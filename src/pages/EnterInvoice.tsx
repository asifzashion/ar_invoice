import { useState } from 'react';
import { Search, CheckCircle, AlertCircle, ArrowRight, Loader } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { formatDate } from '../lib/utils';
import { camundaService } from '../lib/camundaMock';
import { mockInvoices } from '../data/mockData';

// Simulated master data lookup (from Excel or ERP)
const MASTER_DATA = Object.fromEntries(
  mockInvoices.map((inv) => [
    inv.invoiceNumber,
    {
      invoiceNumber: inv.invoiceNumber,
      customerId: inv.customerId,
      customerName: inv.customerName,
      transactionDate: inv.transactionDate,
      purchaseOrder: inv.purchaseOrder,
      projectId: inv.projectId,
      projectDescription: inv.projectDescription,
      projectManager: inv.projectManager,
      dueDate: inv.dueDate,
      balanceDue: inv.balanceDue,
      currency: inv.currency,
      daysLate: inv.daysLate,
      vertical: inv.vertical,
    },
  ])
);

export function EnterInvoice() {
  const { addInvoice, getInvoice, addActivity, addTask, excelData, setActiveView } = useStore();
  const [invoiceNum, setInvoiceNum] = useState('');
  const [fetched, setFetched] = useState<typeof MASTER_DATA[string] | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleFetch = () => {
    const num = invoiceNum.trim().toUpperCase();
    setError('');
    setFetched(null);
    setSuccess(false);

    if (!num) {
      setError('Please enter an invoice number');
      return;
    }

    // Check if already in system
    const existing = getInvoice(num);
    if (existing) {
      setError(`Invoice ${num} is already in the system with status: ${existing.status.replace(/_/g, ' ')}`);
      return;
    }

    // Look up in master data (Excel or mock)
    const masterRow = excelData[num] || MASTER_DATA[num];
    if (!masterRow) {
      setError(`Invoice "${num}" not found in master data. Please check the invoice number or upload the Excel file.`);
      return;
    }

    setFetched(masterRow as typeof MASTER_DATA[string]);
  };

  const handleStartWorkflow = async () => {
    if (!fetched) return;
    setLoading(true);

    try {
      const processResult = await camundaService.startProcess(fetched.invoiceNumber, {
        customerName: fetched.customerName,
        amount: fetched.balanceDue,
        currency: fetched.currency,
      });

      const newInvoice = {
        ...fetched,
        status: 'pending_verification' as const,
        submissionChannel: null,
        submissionDate: null,
        submissionNotes: null,
        currentOwner: 'AR Team',
        comments: [],
        followUpTasks: [],
        camundaProcessId: processResult.processInstanceKey,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      addInvoice(newInvoice);

      addTask({
        id: crypto.randomUUID(),
        name: `Verify Invoice #${fetched.invoiceNumber}`,
        invoiceNumber: fetched.invoiceNumber,
        assignee: 'ar_team',
        created: new Date().toISOString(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        priority: (fetched.daysLate || 0) > 30 ? 'high' : 'medium',
        taskType: 'verification',
        variables: { invoiceNumber: fetched.invoiceNumber },
      });

      addActivity({
        id: crypto.randomUUID(),
        invoiceNumber: fetched.invoiceNumber,
        action: 'Invoice entered and workflow started',
        actor: 'Account Admin',
        timestamp: new Date().toISOString(),
      });

      await camundaService.sendNotification(
        'ar-team@mannai.com',
        `[AR Task] Verify Invoice #${fetched.invoiceNumber}`,
        `Dear AR Team,\n\nA new invoice has been entered.\nInvoice: ${fetched.invoiceNumber}\nCustomer: ${fetched.customerName}\nAmount: ${fetched.balanceDue} ${fetched.currency}\n\nPlease log in to verify.`
      );

      setSuccess(true);
      setLoading(false);
    } catch (err) {
      setError('Failed to start workflow. Please try again.');
      setLoading(false);
    }
  };

  const handleReset = () => {
    setInvoiceNum('');
    setFetched(null);
    setError('');
    setSuccess(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Enter Invoice Number</h2>
        <p className="text-sm text-slate-500 mt-1">
          Enter an invoice number to fetch project details and start the AR workflow
        </p>
      </div>

      {success ? (
        <Card>
          <CardBody className="py-10 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-emerald-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Workflow Started!</h3>
            <p className="text-slate-500 text-sm mb-2">
              Invoice <strong>{fetched?.invoiceNumber}</strong> has been entered and the AR
              verification workflow has been triggered.
            </p>
            <p className="text-xs text-slate-400 mb-6">
              The AR Submission Team has been notified via email.
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="secondary" onClick={handleReset}>
                Enter Another Invoice
              </Button>
              <Button onClick={() => setActiveView(`invoice-${fetched?.invoiceNumber}`)}>
                View Invoice <ArrowRight size={15} />
              </Button>
            </div>
          </CardBody>
        </Card>
      ) : (
        <>
          {/* Search */}
          <Card>
            <CardBody>
              <div className="flex gap-3">
                <div className="flex-1">
                  <Input
                    placeholder="e.g. 11F/DI/3456"
                    value={invoiceNum}
                    onChange={(e) => {
                      setInvoiceNum(e.target.value);
                      setError('');
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleFetch()}
                    leftIcon={<Search size={16} />}
                    label="Invoice Number"
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={handleFetch} size="md">
                    Fetch Details
                  </Button>
                </div>
              </div>

              {error && (
                <div className="mt-3 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Fetched details */}
          {fetched && (
            <Card className="animate-fade-in">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CheckCircle size={18} className="text-emerald-500" />
                  <h3 className="font-semibold text-slate-900">
                    Project Details Found
                  </h3>
                </div>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                  {[
                    { label: 'Invoice Number', value: fetched.invoiceNumber },
                    { label: 'Customer ID', value: fetched.customerId },
                    { label: 'Customer Name', value: fetched.customerName },
                    { label: 'Transaction Date', value: formatDate(fetched.transactionDate) },
                    { label: 'Purchase Order', value: fetched.purchaseOrder },
                    { label: 'Project ID', value: fetched.projectId },
                    { label: 'Project Manager', value: fetched.projectManager },
                    { label: 'Due Date', value: formatDate(fetched.dueDate) },
                  ].map((item) => (
                    <div key={item.label}>
                      <p className="text-xs text-slate-400 font-medium">{item.label}</p>
                      <p className="text-sm font-medium text-slate-800 mt-0.5">{item.value || '—'}</p>
                    </div>
                  ))}
                  <div className="sm:col-span-2">
                    <p className="text-xs text-slate-400 font-medium">Project Description</p>
                    <p className="text-sm font-medium text-slate-800 mt-0.5">
                      {fetched.projectDescription}
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-5">
                  <p className="text-xs text-blue-600 font-medium mb-1">What happens next?</p>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>✓ Invoice will be added to the AR tracking system</li>
                    <li>✓ Camunda 8 BPMN workflow will be started</li>
                    <li>✓ AR Submission Team will be notified via email</li>
                    <li>✓ A verification task will be assigned to the AR Team</li>
                  </ul>
                </div>

                <Button
                  onClick={handleStartWorkflow}
                  loading={loading}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader size={16} className="animate-spin" /> Starting Workflow...
                    </>
                  ) : (
                    <>
                      Fetch & Start Workflow <ArrowRight size={16} />
                    </>
                  )}
                </Button>
              </CardBody>
            </Card>
          )}

          {/* Sample invoice numbers */}
          <Card>
            <CardBody className="py-3">
              <p className="text-xs text-slate-500 mb-2 font-medium">
                Sample invoice numbers to try:
              </p>
              <div className="flex flex-wrap gap-2">
                {Object.keys(MASTER_DATA).map((num) => (
                  <button
                    key={num}
                    onClick={() => {
                      setInvoiceNum(num);
                      setError('');
                      setFetched(null);
                    }}
                    className="font-mono text-xs px-2.5 py-1 bg-slate-100 hover:bg-blue-100 hover:text-blue-700 text-slate-600 rounded-lg transition-colors"
                  >
                    {num}
                  </button>
                ))}
              </div>
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}
