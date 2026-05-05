import { useState, useRef, useEffect } from 'react';
import {
  Search,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Loader,
  Building2,
  Calendar,
  DollarSign,
  FileText,
  User,
  Lock,
  Hash,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { formatCurrency, formatDate } from '../lib/utils';
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

const ALL_INVOICE_NUMBERS = Object.keys(MASTER_DATA);

export function EnterInvoice() {
  const { addInvoice, getInvoice, addActivity, addTask, excelData, setActiveView } = useStore();

  const [invoiceNum, setInvoiceNum] = useState('');
  const [fetched, setFetched] = useState<typeof MASTER_DATA[string] | null>(null);
  const [alreadyExists, setAlreadyExists] = useState(false);
  const [existingStatus, setExistingStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Autocomplete state
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // All available keys (master data + excel upload)
  const allKeys = [...new Set([...ALL_INVOICE_NUMBERS, ...Object.keys(excelData)])];

  // Filter suggestions based on input
  const suggestions = invoiceNum.trim()
    ? allKeys.filter((k) =>
        k.toLowerCase().includes(invoiceNum.trim().toLowerCase())
      )
    : [];

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
        setActiveSuggestion(-1);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const doFetch = (num: string) => {
    const normalized = num.trim().toUpperCase();
    setError('');
    setFetched(null);
    setAlreadyExists(false);
    setExistingStatus('');
    setSuccess(false);
    setShowSuggestions(false);
    setActiveSuggestion(-1);

    if (!normalized) {
      setError('Please enter an invoice number');
      return;
    }

    const masterRow = excelData[normalized] || MASTER_DATA[normalized];
    if (!masterRow) {
      setError(`Invoice "${normalized}" not found in master data. Please check the invoice number or upload the Excel file.`);
      return;
    }

    const existing = getInvoice(normalized);
    if (existing) {
      setAlreadyExists(true);
      setExistingStatus(existing.status.replace(/_/g, ' '));
    }

    setFetched(masterRow as typeof MASTER_DATA[string]);
  };

  const handleFetch = () => doFetch(invoiceNum);

  const handleSuggestionClick = (num: string) => {
    setInvoiceNum(num);
    doFetch(num);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') handleFetch();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestion((prev) => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestion((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeSuggestion >= 0) {
        const chosen = suggestions[activeSuggestion];
        setInvoiceNum(chosen);
        doFetch(chosen);
      } else {
        handleFetch();
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setActiveSuggestion(-1);
    }
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

      addInvoice({
        ...fetched,
        status: 'pending_verification',
        submissionChannel: null,
        submissionDate: null,
        submissionNotes: null,
        currentOwner: 'AR Team',
        comments: [],
        followUpTasks: [],
        camundaProcessId: processResult.processInstanceKey,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

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
    } catch {
      setError('Failed to start workflow. Please try again.');
      setLoading(false);
    }
  };

  const handleReset = () => {
    setInvoiceNum('');
    setFetched(null);
    setAlreadyExists(false);
    setExistingStatus('');
    setError('');
    setSuccess(false);
  };

  // Highlight matching part of suggestion
  const highlight = (text: string, query: string) => {
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return <span>{text}</span>;
    return (
      <>
        {text.slice(0, idx)}
        <span className="text-blue-600 font-bold">{text.slice(idx, idx + query.length)}</span>
        {text.slice(idx + query.length)}
      </>
    );
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
          {/* ── Search card with autocomplete ── */}
          <Card>
            <CardBody>
              <div className="flex gap-3">
                {/* Input + dropdown wrapper */}
                <div className="flex-1 flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-700">Invoice Number</label>
                  <div className="relative">
                    {/* Left icon */}
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <Search size={16} />
                    </div>

                    <input
                      ref={inputRef}
                      type="text"
                      placeholder="e.g. 11F/DI/3456 — type to search"
                      value={invoiceNum}
                      onChange={(e) => {
                        setInvoiceNum(e.target.value);
                        setError('');
                        setShowSuggestions(true);
                        setActiveSuggestion(-1);
                      }}
                      onFocus={() => invoiceNum && setShowSuggestions(true)}
                      onKeyDown={handleKeyDown}
                      className="w-full rounded-lg border border-slate-300 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      autoComplete="off"
                    />

                    {/* Suggestions dropdown */}
                    {showSuggestions && suggestions.length > 0 && (
                      <div
                        ref={dropdownRef}
                        className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in"
                      >
                        <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100">
                          <p className="text-xs text-slate-400 font-medium">
                            {suggestions.length} suggestion{suggestions.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <ul className="max-h-52 overflow-y-auto">
                          {suggestions.map((num, i) => {
                            const row = excelData[num] || MASTER_DATA[num];
                            const isActive = i === activeSuggestion;
                            return (
                              <li key={num}>
                                <button
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() => handleSuggestionClick(num)}
                                  className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors ${
                                    isActive
                                      ? 'bg-blue-50'
                                      : 'hover:bg-slate-50'
                                  }`}
                                >
                                  <Hash size={13} className="text-slate-400 flex-shrink-0" />
                                  <div className="min-w-0">
                                    <p className="font-mono text-sm font-semibold text-slate-800">
                                      {highlight(num, invoiceNum.trim())}
                                    </p>
                                    {row && (
                                      <p className="text-xs text-slate-400 truncate mt-0.5">
                                        {row.customerName} · {row.projectId}
                                      </p>
                                    )}
                                  </div>
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </div>
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

          {/* ── Sample invoice chips — always visible, ABOVE details card ── */}
          <Card>
            <CardBody className="py-3">
              <p className="text-xs text-slate-500 mb-2 font-medium">
                Sample invoice numbers to try:
              </p>
              <div className="flex flex-wrap gap-2">
                {ALL_INVOICE_NUMBERS.map((num) => (
                  <button
                    key={num}
                    onClick={() => {
                      setInvoiceNum(num);
                      doFetch(num);
                    }}
                    className={`font-mono text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                      fetched?.invoiceNumber === num
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-100 hover:bg-blue-100 hover:text-blue-700 hover:border-blue-300 text-slate-600 border-slate-200'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* ── Invoice & Project Details (read-only) — appears AFTER chips ── */}
          {fetched && (
            <Card className="animate-fade-in">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={18} className="text-emerald-500" />
                    <h3 className="font-semibold text-slate-900">Invoice & Project Details</h3>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
                    <Lock size={11} /> Read Only
                  </span>
                </div>
              </CardHeader>
              <CardBody className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { icon: <Building2 size={15} />, label: 'Customer',          value: fetched.customerName },
                    { icon: <FileText   size={15} />, label: 'Customer ID',       value: fetched.customerId },
                    { icon: <Calendar   size={15} />, label: 'Transaction Date',  value: formatDate(fetched.transactionDate) },
                    { icon: <FileText   size={15} />, label: 'Purchase Order',    value: fetched.purchaseOrder },
                    { icon: <FileText   size={15} />, label: 'Project ID',        value: fetched.projectId },
                    { icon: <User       size={15} />, label: 'Project Manager',   value: fetched.projectManager },
                    { icon: <Calendar   size={15} />, label: 'Due Date',          value: formatDate(fetched.dueDate) },
                    { icon: <DollarSign size={15} />, label: 'Balance Due',       value: formatCurrency(fetched.balanceDue || 0, fetched.currency) },
                  ].map((item) => (
                    <div key={item.label} className="flex items-start gap-2.5">
                      <div className="text-slate-400 mt-0.5 flex-shrink-0">{item.icon}</div>
                      <div>
                        <p className="text-xs text-slate-400 font-medium">{item.label}</p>
                        <p className="text-sm text-slate-800 font-medium mt-0.5">{item.value || '—'}</p>
                      </div>
                    </div>
                  ))}

                  {/* Project Description — full width */}
                  <div className="sm:col-span-2 flex items-start gap-2.5">
                    <div className="text-slate-400 mt-0.5 flex-shrink-0">
                      <FileText size={15} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-medium">Project Description</p>
                      <p className="text-sm text-slate-800 font-medium mt-0.5">
                        {fetched.projectDescription || '—'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100" />

                {/* Already-in-system notice OR what-happens-next */}
                {alreadyExists ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <div className="flex items-start gap-2.5">
                      <AlertCircle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-amber-800">Already in the system</p>
                        <p className="text-xs text-amber-700 mt-0.5">
                          This invoice is currently tracked with status:{' '}
                          <span className="font-semibold capitalize">{existingStatus}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                    <p className="text-xs text-blue-600 font-medium mb-1.5">What happens next?</p>
                    <ul className="text-xs text-blue-700 space-y-1">
                      <li>✓ Invoice will be added to the AR tracking system</li>
                      <li>✓ Camunda 8 BPMN workflow will be started</li>
                      <li>✓ AR Submission Team will be notified via email</li>
                      <li>✓ A verification task will be assigned to the AR Team</li>
                    </ul>
                  </div>
                )}

                {/* CTA button */}
                {alreadyExists ? (
                  <Button
                    variant="secondary"
                    className="w-full"
                    size="lg"
                    onClick={() => setActiveView(`invoice-${fetched.invoiceNumber}`)}
                  >
                    View Invoice <ArrowRight size={16} />
                  </Button>
                ) : (
                  <Button onClick={handleStartWorkflow} loading={loading} className="w-full" size="lg">
                    {loading ? (
                      <><Loader size={16} className="animate-spin" /> Starting Workflow...</>
                    ) : (
                      <>Fetch & Start Workflow <ArrowRight size={16} /></>
                    )}
                  </Button>
                )}
              </CardBody>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
