import { useState } from 'react';
import { ClipboardList, Clock, AlertTriangle, CheckCircle, ArrowRight, Filter } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Card, CardBody } from '../components/ui/Card';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { formatDate, formatCurrency, getDaysLateLabel } from '../lib/utils';
import type { CamundaTask } from '../types';

const PRIORITY_CONFIG = {
  high: { label: 'High', color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
  medium: { label: 'Medium', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
  low: { label: 'Low', color: 'text-slate-600', bg: 'bg-slate-50 border-slate-200' },
};

const TASK_TYPE_CONFIG = {
  verification: { label: 'Verification', icon: '🔍', color: 'text-blue-600', bg: 'bg-blue-50' },
  submission: { label: 'Submission', icon: '📤', color: 'text-indigo-600', bg: 'bg-indigo-50' },
  followup: { label: 'Follow-up', icon: '📋', color: 'text-orange-600', bg: 'bg-orange-50' },
  bu_action: { label: 'BU Action', icon: '⚙️', color: 'text-purple-600', bg: 'bg-purple-50' },
};

export function MyAssignments() {
  const { tasks, invoices, currentUser, setActiveView, removeTask } = useStore();
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  const myTasks = tasks.filter(
    (t) =>
      t.assignee === currentUser?.role ||
      (currentUser?.role === 'admin')
  );

  const filtered = myTasks.filter(
    (t) => filter === 'all' || t.priority === filter
  );

  const getInvoice = (num: string) => invoices.find((i) => i.invoiceNumber === num);

  const isOverdue = (task: CamundaTask) =>
    task.dueDate && new Date(task.dueDate) < new Date();

  const stats = {
    total: myTasks.length,
    high: myTasks.filter((t) => t.priority === 'high').length,
    overdue: myTasks.filter((t) => isOverdue(t)).length,
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Tasks', value: stats.total, icon: <ClipboardList size={20} />, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'High Priority', value: stats.high, icon: <AlertTriangle size={20} />, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Overdue', value: stats.overdue, icon: <Clock size={20} />, color: 'text-orange-600', bg: 'bg-orange-50' },
        ].map((s) => (
          <Card key={s.label}>
            <CardBody className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${s.bg} ${s.color} flex items-center justify-center flex-shrink-0`}>
                {s.icon}
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{s.value}</p>
                <p className="text-xs text-slate-500">{s.label}</p>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter size={15} className="text-slate-400" />
        <span className="text-sm text-slate-500">Priority:</span>
        {(['all', 'high', 'medium', 'low'] as const).map((p) => (
          <button
            key={p}
            onClick={() => setFilter(p)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
              filter === p
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Task list */}
      {filtered.length === 0 ? (
        <Card>
          <CardBody className="py-16 text-center">
            <CheckCircle size={48} className="mx-auto mb-3 text-emerald-400 opacity-60" />
            <h3 className="font-semibold text-slate-700 mb-1">All caught up!</h3>
            <p className="text-sm text-slate-400">No tasks assigned to you right now.</p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((task) => {
            const invoice = getInvoice(task.invoiceNumber);
            const overdue = isOverdue(task);
            const taskType = TASK_TYPE_CONFIG[task.taskType];
            const priority = PRIORITY_CONFIG[task.priority];

            return (
              <Card
                key={task.id}
                className={`border-l-4 ${
                  task.priority === 'high'
                    ? 'border-l-red-500'
                    : task.priority === 'medium'
                    ? 'border-l-amber-500'
                    : 'border-l-slate-300'
                }`}
              >
                <CardBody className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${taskType.bg} ${taskType.color}`}>
                          {taskType.icon} {taskType.label}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${priority.bg} ${priority.color}`}>
                          {priority.label} Priority
                        </span>
                        {overdue && (
                          <Badge variant="danger">
                            <AlertTriangle size={11} /> Overdue
                          </Badge>
                        )}
                      </div>

                      <h4 className="font-semibold text-slate-900 text-sm">{task.name}</h4>

                      {invoice && (
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                          <span className="font-mono text-blue-600 font-medium">
                            {invoice.invoiceNumber}
                          </span>
                          <span>·</span>
                          <span className="truncate max-w-[200px]">{invoice.customerName}</span>
                          <span>·</span>
                          <span className="font-medium text-slate-700">
                            {formatCurrency(invoice.balanceDue || 0, invoice.currency)}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-3 mt-2">
                        {invoice && <StatusBadge status={invoice.status} />}
                        {invoice?.daysLate !== undefined && invoice.daysLate > 0 && (
                          <Badge variant="warning">{getDaysLateLabel(invoice.daysLate)}</Badge>
                        )}
                        {task.dueDate && (
                          <span className={`text-xs ${overdue ? 'text-red-600 font-medium' : 'text-slate-400'}`}>
                            <Clock size={11} className="inline mr-1" />
                            Due {formatDate(task.dueDate)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setActiveView(`invoice-${task.invoiceNumber}`)}
                      >
                        Open <ArrowRight size={13} />
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
