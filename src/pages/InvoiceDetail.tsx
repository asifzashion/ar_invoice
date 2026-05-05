import { useState } from 'react';
import {
  ArrowLeft,
  MessageSquare,
  CheckCircle,
  XCircle,
  Send,
  UserPlus,
  Clock,
  Building2,
  Calendar,
  DollarSign,
  FileText,
  User,
  AlertTriangle,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { Modal } from '../components/ui/Modal';
import { Textarea, Select } from '../components/ui/Input';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  timeAgo,
  getDaysLateLabel,
  roleConfig,
} from '../lib/utils';
import type { InvoiceStatus, SubmissionChannel } from '../types';
import { camundaService } from '../lib/camundaMock';

interface InvoiceDetailProps {
  invoiceNumber: string;
}

const CHANNEL_OPTIONS = [
  { value: '', label: 'Select channel...' },
  { value: 'email', label: '📧 Email' },
  { value: 'messenger', label: '📄 Messenger / Hard Copy' },
  { value: 'portal', label: '🌐 Customer Portal' },
];

const STATUS_OPTIONS: { value: InvoiceStatus | ''; label: string }[] = [
  { value: '', label: 'Change status...' },
  { value: 'in_followup', label: 'In Follow-up' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'submitted', label: 'Submitted' },
];

export function InvoiceDetail({ invoiceNumber }: InvoiceDetailProps) {
  const {
    getInvoice,
    currentUser,
    updateInvoice,
    updateInvoiceStatus,
    updateSubmissionChannel,
    addComment,
    addFollowUpTask,
    closeFollowUpTask,
    addActivity,
    removeTask,
    tasks,
  } = useStore();

  const invoice = getInvoice(invoiceNumber);
  const { setActiveView } = useStore();

  const [commentText, setCommentText] = useState('');
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [channel, setChannel] = useState<SubmissionChannel>(null);
  const [channelNotes, setChannelNotes] = useState('');
  const [followUpDesc, setFollowUpDesc] = useState('');
  const [followUpDue, setFollowUpDue] = useState('');
  const [followUpAssignee, setFollowUpAssignee] = useState('');
  const [newStatus, setNewStatus] = useState<InvoiceStatus | ''>('');
  const [loading, setLoading] = useState(false);

  if (!invoice) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400">
        <FileText size={48} className="mb-3 opacity-30" />
        <p>Invoice not found</p>
        <Button variant="ghost" onClick={() => setActiveView('invoices')} className="mt-3">
          Back to invoices
        </Button>
      </div>
    );
  }

  const canVerify = currentUser?.role === 'ar_team' && invoice.status === 'pending_verification';
  const canSubmit = currentUser?.role === 'ar_team' && invoice.status === 'verified';
  const canFollowUp = currentUser?.role === 'cmd_team';
  const canBUAction = currentUser?.role === 'bu_team';
  const canChangeStatus =
    currentUser?.role === 'cmd_team' || currentUser?.role === 'bu_team';

  const handleAccept = async () => {
    setLoading(true);
    await camundaService.completeTask(
      tasks.find((t) => t.invoiceNumber === invoiceNumber && t.taskType === 'verification')?.id || '',
      { verificationStatus: 'approved' }
    );
    updateInvoiceStatus(invoiceNumber, 'verified', currentUser!.name);
    addActivity({
      id: crypto.randomUUID(),
      invoiceNumber,
      action: 'Invoice verified and approved',
      actor: currentUser!.name,
      timestamp: new Date().toISOString(),
    });
    const taskId = tasks.find(
      (t) => t.invoiceNumber === invoiceNumber && t.taskType === 'verification'
    )?.id;
    if (taskId) removeTask(taskId);
    setLoading(false);
    setShowVerifyModal(false);
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    setLoading(true);
    updateInvoiceStatus(invoiceNumber, 'rejected', currentUser!.name);
    updateInvoice(invoiceNumber, { rejectionReason: rejectReason });
    addComment(invoiceNumber, {
      id: crypto.randomUUID(),
      invoiceNumber,
      author: currentUser!.name,
      authorRole: currentUser!.role,
      text: `Rejected: ${rejectReason}`,
      timestamp: new Date().toISOString(),
      taskType: 'verification',
    });
    addActivity({
      id: crypto.randomUUID(),
      invoiceNumber,
      action: 'Invoice rejected',
      actor: currentUser!.name,
      timestamp: new Date().toISOString(),
      details: rejectReason,
    });
    setLoading(false);
    setShowVerifyModal(false);
    setRejectReason('');
  };

  const handleSubmit = async () => {
    if (!channel) return;
    setLoading(true);
    updateSubmissionChannel(invoiceNumber, channel, channelNotes || null);
    addActivity({
      id: crypto.randomUUID(),
      invoiceNumber,
      action: `Invoice submitted via ${channel}`,
      actor: currentUser!.name,
      timestamp: new Date().toISOString(),
    });
    await camundaService.sendNotification(
      'cmd@mannai.com',
      `[AR Task] Invoice ${invoiceNumber} submitted`,
      `Invoice ${invoiceNumber} has been submitted via ${channel}.`
    );
    setLoading(false);
    setShowSubmitModal(false);
  };

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    addComment(invoiceNumber, {
      id: crypto.randomUUID(),
      invoiceNumber,
      author: currentUser!.name,
      authorRole: currentUser!.role,
      text: commentText,
      timestamp: new Date().toISOString(),
      taskType:
        currentUser?.role === 'cmd_team'
          ? 'followup'
          : currentUser?.role === 'bu_team'
          ? 'bu_action'
          : 'verification',
    });
    addActivity({
      id: crypto.randomUUID(),
      invoiceNumber,
      action: 'Comment added',
      actor: currentUser!.name,
      timestamp: new Date().toISOString(),
    });
    setCommentText('');
  };

  const handleAddFollowUp = () => {
    if (!followUpDesc.trim() || !followUpDue || !followUpAssignee) return;
    addFollowUpTask(invoiceNumber, {
      id: crypto.randomUUID(),
      invoiceNumber,
      assignedTo: followUpAssignee,
      assignedBy: currentUser!.name,
      description: followUpDesc,
      dueDate: followUpDue,
      status: 'open',
      createdAt: new Date().toISOString(),
    });
    addActivity({
      id: crypto.randomUUID(),
      invoiceNumber,
      action: `Follow-up task assigned to ${followUpAssignee}`,
      actor: currentUser!.name,
      timestamp: new Date().toISOString(),
    });
    setShowFollowUpModal(false);
    setFollowUpDesc('');
    setFollowUpDue('');
    setFollowUpAssignee('');
  };

  const handleStatusChange = () => {
    if (!newStatus) return;
    updateInvoiceStatus(invoiceNumber, newStatus, currentUser!.name);
    setShowStatusModal(false);
    setNewStatus('');
  };

  const infoItems = [
    { icon: <Building2 size={15} />, label: 'Customer', value: invoice.customerName },
    { icon: <FileText size={15} />, label: 'Customer ID', value: invoice.customerId },
    { icon: <Calendar size={15} />, label: 'Transaction Date', value: formatDate(invoice.transactionDate) },
    { icon: <FileText size={15} />, label: 'Purchase Order', value: invoice.purchaseOrder },
    { icon: <FileText size={15} />, label: 'Project ID', value: invoice.projectId },
    { icon: <User size={15} />, label: 'Project Manager', value: invoice.projectManager },
    { icon: <Calendar size={15} />, label: 'Due Date', value: formatDate(invoice.dueDate) },
    { icon: <DollarSign size={15} />, label: 'Balance Due', value: formatCurrency(invoice.balanceDue || 0, invoice.currency) },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Back + header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveView('invoices')}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-slate-900 font-mono">
                {invoice.invoiceNumber}
              </h2>
              <StatusBadge status={invoice.status} />
              {invoice.daysLate !== undefined && invoice.daysLate > 0 && (
                <Badge variant="danger">
                  <AlertTriangle size={11} />
                  {getDaysLateLabel(invoice.daysLate)}
                </Badge>
              )}
            </div>
            <p className="text-sm text-slate-500 mt-0.5">{invoice.projectDescription}</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {canVerify && (
            <Button onClick={() => setShowVerifyModal(true)} size="sm">
              <CheckCircle size={15} /> Verify Invoice
            </Button>
          )}
          {canSubmit && (
            <Button onClick={() => setShowSubmitModal(true)} size="sm" variant="success">
              <Send size={15} /> Mark Submitted
            </Button>
          )}
          {canFollowUp && (
            <Button onClick={() => setShowFollowUpModal(true)} size="sm" variant="secondary">
              <UserPlus size={15} /> Assign Follow-up
            </Button>
          )}
          {canChangeStatus && (
            <Button onClick={() => setShowStatusModal(true)} size="sm" variant="outline">
              <Clock size={15} /> Change Status
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Invoice info */}
        <div className="lg:col-span-2 space-y-5">
          {/* Invoice details */}
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-slate-900">Invoice & Project Details</h3>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {infoItems.map((item) => (
                  <div key={item.label} className="flex items-start gap-2.5">
                    <div className="text-slate-400 mt-0.5 flex-shrink-0">{item.icon}</div>
                    <div>
                      <p className="text-xs text-slate-400 font-medium">{item.label}</p>
                      <p className="text-sm text-slate-800 font-medium mt-0.5">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Submission info */}
          {invoice.submissionChannel && (
            <Card>
              <CardHeader>
                <h3 className="font-semibold text-slate-900">Submission Details</h3>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Channel</p>
                    <p className="text-sm font-medium text-slate-800 mt-0.5 capitalize">
                      {invoice.submissionChannel === 'portal'
                        ? '🌐 Customer Portal'
                        : invoice.submissionChannel === 'email'
                        ? '📧 Email'
                        : '📄 Messenger / Hard Copy'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Submission Date</p>
                    <p className="text-sm font-medium text-slate-800 mt-0.5">
                      {formatDate(invoice.submissionDate)}
                    </p>
                  </div>
                  {invoice.submissionNotes && (
                    <div className="col-span-2">
                      <p className="text-xs text-slate-400 font-medium">Notes</p>
                      <p className="text-sm text-slate-700 mt-0.5">{invoice.submissionNotes}</p>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Comments */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">
                  Comments ({invoice.comments.length})
                </h3>
              </div>
            </CardHeader>
            <CardBody className="space-y-4">
              {invoice.comments.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">No comments yet</p>
              ) : (
                invoice.comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar name={comment.author} size="sm" />
                    <div className="flex-1 bg-slate-50 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-slate-800">
                          {comment.author}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${roleConfig[comment.authorRole].bg} ${roleConfig[comment.authorRole].color}`}
                        >
                          {roleConfig[comment.authorRole].label}
                        </span>
                        <span className="text-xs text-slate-400 ml-auto">
                          {timeAgo(comment.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 leading-relaxed">{comment.text}</p>
                    </div>
                  </div>
                ))
              )}

              {/* Add comment */}
              {currentUser?.role !== 'viewer' && (
                <div className="flex gap-3 pt-2 border-t border-slate-100">
                  <Avatar name={currentUser?.name || ''} size="sm" />
                  <div className="flex-1 space-y-2">
                    <Textarea
                      placeholder="Add a comment..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      rows={3}
                    />
                    <Button
                      size="sm"
                      onClick={handleAddComment}
                      disabled={!commentText.trim()}
                    >
                      <MessageSquare size={14} /> Post Comment
                    </Button>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Right: Status + tasks */}
        <div className="space-y-5">
          {/* Status card */}
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-slate-900">Workflow Status</h3>
            </CardHeader>
            <CardBody className="space-y-3">
              <div>
                <p className="text-xs text-slate-400 font-medium mb-1">Current Status</p>
                <StatusBadge status={invoice.status} />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium mb-1">Current Owner</p>
                <p className="text-sm font-medium text-slate-800">{invoice.currentOwner}</p>
              </div>
              {invoice.buResponsible && (
                <div>
                  <p className="text-xs text-slate-400 font-medium mb-1">BU Responsible</p>
                  <p className="text-sm font-medium text-slate-800">{invoice.buResponsible}</p>
                </div>
              )}
              {invoice.vertical && (
                <div>
                  <p className="text-xs text-slate-400 font-medium mb-1">Vertical</p>
                  <Badge variant="info">{invoice.vertical}</Badge>
                </div>
              )}
              <div className="pt-2 border-t border-slate-100 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Created</span>
                  <span className="text-slate-600">{formatDate(invoice.createdAt)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Last updated</span>
                  <span className="text-slate-600">{formatDateTime(invoice.updatedAt)}</span>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Follow-up tasks */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">Follow-up Tasks</h3>
                <Badge variant={invoice.followUpTasks.filter((t) => t.status === 'open').length > 0 ? 'warning' : 'success'}>
                  {invoice.followUpTasks.filter((t) => t.status === 'open').length} open
                </Badge>
              </div>
            </CardHeader>
            <CardBody className="space-y-3">
              {invoice.followUpTasks.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-2">No tasks assigned</p>
              ) : (
                invoice.followUpTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`p-3 rounded-xl border ${
                      task.status === 'closed'
                        ? 'bg-slate-50 border-slate-100 opacity-60'
                        : 'bg-amber-50 border-amber-100'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm text-slate-700 leading-snug">{task.description}</p>
                      {task.status === 'open' && (canBUAction || canFollowUp) && (
                        <button
                          onClick={() => closeFollowUpTask(invoiceNumber, task.id)}
                          className="text-emerald-600 hover:text-emerald-700 flex-shrink-0"
                          title="Mark as done"
                        >
                          <CheckCircle size={16} />
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                      <span>→ {task.assignedTo}</span>
                      <span>·</span>
                      <span>Due {formatDate(task.dueDate)}</span>
                    </div>
                    {task.status === 'closed' && (
                      <Badge variant="success" className="mt-1">Completed</Badge>
                    )}
                  </div>
                ))
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Verify Modal */}
      <Modal
        open={showVerifyModal}
        onClose={() => setShowVerifyModal(false)}
        title={`Verify Invoice ${invoiceNumber}`}
        description="Review the invoice details and accept or reject"
      >
        <div className="space-y-4">
          <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Customer</span>
              <span className="font-medium text-slate-800">{invoice.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Amount</span>
              <span className="font-semibold text-slate-800">
                {formatCurrency(invoice.balanceDue || 0, invoice.currency)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Due Date</span>
              <span className="font-medium text-slate-800">{formatDate(invoice.dueDate)}</span>
            </div>
          </div>
          <Textarea
            label="Rejection reason (required if rejecting)"
            placeholder="Enter reason for rejection..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={3}
          />
          <div className="flex gap-3 pt-2">
            <Button
              variant="danger"
              onClick={handleReject}
              disabled={!rejectReason.trim()}
              loading={loading}
              className="flex-1"
            >
              <XCircle size={15} /> Reject
            </Button>
            <Button onClick={handleAccept} loading={loading} className="flex-1">
              <CheckCircle size={15} /> Accept
            </Button>
          </div>
        </div>
      </Modal>

      {/* Submit Modal */}
      <Modal
        open={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        title="Mark Invoice as Submitted"
        description="Select the submission channel and add notes"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: 'email' as SubmissionChannel, label: '📧 Email', desc: 'Send to customer' },
              { value: 'messenger' as SubmissionChannel, label: '📄 Messenger', desc: 'Hard copy' },
              { value: 'portal' as SubmissionChannel, label: '🌐 Portal', desc: 'Customer portal' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setChannel(opt.value)}
                className={`p-3 rounded-xl border-2 text-center transition-all ${
                  channel === opt.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <p className="text-lg">{opt.label.split(' ')[0]}</p>
                <p className="text-xs font-medium text-slate-700 mt-1">
                  {opt.label.split(' ').slice(1).join(' ')}
                </p>
                <p className="text-xs text-slate-400">{opt.desc}</p>
              </button>
            ))}
          </div>
          <Textarea
            label="Notes / Reference number (optional)"
            placeholder="e.g. Portal reference #12345"
            value={channelNotes}
            onChange={(e) => setChannelNotes(e.target.value)}
            rows={2}
          />
          <Button
            onClick={handleSubmit}
            disabled={!channel}
            loading={loading}
            className="w-full"
          >
            <Send size={15} /> Mark as Submitted
          </Button>
        </div>
      </Modal>

      {/* Follow-up Modal */}
      <Modal
        open={showFollowUpModal}
        onClose={() => setShowFollowUpModal(false)}
        title="Assign Follow-up Task"
        description="Assign a task to the BU team for resolution"
      >
        <div className="space-y-4">
          <Textarea
            label="Task description"
            placeholder="Describe the action required..."
            value={followUpDesc}
            onChange={(e) => setFollowUpDesc(e.target.value)}
            rows={3}
          />
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Assign to</label>
              <input
                type="text"
                placeholder="Name or team"
                value={followUpAssignee}
                onChange={(e) => setFollowUpAssignee(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Due date</label>
              <input
                type="date"
                value={followUpDue}
                onChange={(e) => setFollowUpDue(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <Button
            onClick={handleAddFollowUp}
            disabled={!followUpDesc.trim() || !followUpDue || !followUpAssignee}
            className="w-full"
          >
            <UserPlus size={15} /> Assign Task
          </Button>
        </div>
      </Modal>

      {/* Status Modal */}
      <Modal
        open={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        title="Update Invoice Status"
        size="sm"
      >
        <div className="space-y-4">
          <Select
            label="New status"
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value as InvoiceStatus | '')}
            options={STATUS_OPTIONS}
          />
          <Button
            onClick={handleStatusChange}
            disabled={!newStatus}
            className="w-full"
          >
            Update Status
          </Button>
        </div>
      </Modal>
    </div>
  );
}
