import {
  FileText,
  Clock,
  Send,
  AlertTriangle,
  CheckCircle,
  PauseCircle,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useStore } from '../store/useStore';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { formatCurrency, formatDate, timeAgo, getDaysLateLabel } from '../lib/utils';
import type { InvoiceStatus } from '../types';

const STATUS_COLORS: Record<string, string> = {
  pending_verification: '#f59e0b',
  rejected: '#ef4444',
  verified: '#3b82f6',
  submitted: '#6366f1',
  in_followup: '#f97316',
  resolved: '#10b981',
  on_hold: '#94a3b8',
};

export function Dashboard() {
  const { invoices, activity, setActiveView, currentUser } = useStore();

  // Stats
  const stats = {
    total: invoices.length,
    pendingVerification: invoices.filter((i) => i.status === 'pending_verification').length,
    pendingSubmission: invoices.filter((i) => i.status === 'verified').length,
    overdueFollowups: invoices.filter(
      (i) => i.daysLate !== undefined && i.daysLate > 0 && i.status !== 'resolved'
    ).length,
    resolved: invoices.filter((i) => i.status === 'resolved').length,
    onHold: invoices.filter((i) => i.status === 'on_hold').length,
  };

  // Status distribution for pie chart
  const statusCounts = invoices.reduce(
    (acc, inv) => {
      acc[inv.status] = (acc[inv.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const pieData = Object.entries(statusCounts).map(([status, count]) => ({
    name: status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    value: count,
    color: STATUS_COLORS[status] || '#94a3b8',
  }));

  // Customer bar chart
  const customerData = invoices.reduce(
    (acc, inv) => {
      const short = inv.customerName.split(' ').slice(0, 2).join(' ');
      const existing = acc.find((a) => a.customer === short);
      if (existing) {
        existing.invoices += 1;
        existing.amount += inv.balanceDue || 0;
      } else {
        acc.push({ customer: short, invoices: 1, amount: inv.balanceDue || 0 });
      }
      return acc;
    },
    [] as { customer: string; invoices: number; amount: number }[]
  );

  const statCards = [
    {
      label: 'Total Invoices',
      value: stats.total,
      icon: <FileText size={22} />,
      gradient: 'from-slate-700 to-slate-900',
      bg: 'bg-slate-100',
      text: 'text-slate-700',
    },
    {
      label: 'Pending Verification',
      value: stats.pendingVerification,
      icon: <Clock size={22} />,
      gradient: 'from-amber-500 to-amber-600',
      bg: 'bg-amber-50',
      text: 'text-amber-600',
    },
    {
      label: 'Pending Submission',
      value: stats.pendingSubmission,
      icon: <Send size={22} />,
      gradient: 'from-indigo-500 to-indigo-600',
      bg: 'bg-slate-50',
      text: 'text-slate-600',
    },
    {
      label: 'Overdue Follow-ups',
      value: stats.overdueFollowups,
      icon: <AlertTriangle size={22} />,
      gradient: 'from-red-500 to-red-600',
      bg: 'bg-red-50',
      text: 'text-red-600',
    },
    {
      label: 'Resolved',
      value: stats.resolved,
      icon: <CheckCircle size={22} />,
      gradient: 'from-emerald-500 to-emerald-600',
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
    },
    {
      label: 'On Hold',
      value: stats.onHold,
      icon: <PauseCircle size={22} />,
      gradient: 'from-slate-500 to-slate-600',
      bg: 'bg-slate-50',
      text: 'text-slate-600',
    },
  ];

  const recentInvoices = [...invoices]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-[#2c4070] to-[#3a5490] rounded-2xl p-6 text-white shadow-lg shadow-slate-300">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">
              Good morning, {currentUser?.name.split(' ')[0]} 👋
            </h2>
            <p className="text-slate-200 mt-1 text-sm">
              Here's your AR overview for today · {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-white/10 rounded-xl px-4 py-2">
            <TrendingUp size={18} />
            <span className="text-sm font-medium">
              {formatCurrency(
                invoices.reduce((s, i) => s + (i.balanceDue || 0), 0)
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((card) => (
          <Card key={card.label} className="overflow-hidden">
            <CardBody className="p-4">
              <div className={`w-10 h-10 rounded-xl ${card.bg} ${card.text} flex items-center justify-center mb-3`}>
                {card.icon}
              </div>
              <p className="text-2xl font-bold text-slate-900">{card.value}</p>
              <p className="text-xs text-slate-500 mt-0.5 leading-tight">{card.label}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie chart */}
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-slate-900">Status Distribution</h3>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [value, name]}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => (
                    <span className="text-xs text-slate-600">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* Bar chart */}
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-slate-900">Invoices by Customer</h3>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={customerData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="customer"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  formatter={(value, name) => [
                    name === 'amount' ? formatCurrency(Number(value)) : value,
                    name === 'amount' ? 'Balance Due' : 'Invoices',
                  ]}
                />
                <Bar dataKey="invoices" fill="#0f172a" radius={[4, 4, 0, 0]} name="invoices" />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent invoices */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">Recent Invoices</h3>
                <button
                  onClick={() => setActiveView('invoices')}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  View all <ArrowRight size={14} />
                </button>
              </div>
            </CardHeader>
            <div className="divide-y divide-slate-50">
              {recentInvoices.map((inv) => (
                <div
                  key={inv.invoiceNumber}
                  className="px-6 py-3.5 hover:bg-slate-50/50 transition-colors cursor-pointer"
                  onClick={() => setActiveView(`invoice-${inv.invoiceNumber}`)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-mono text-sm font-semibold text-slate-800">
                          {inv.invoiceNumber}
                        </span>
                        <StatusBadge status={inv.status} />
                        {inv.daysLate !== undefined && inv.daysLate > 0 && (
                          <Badge variant="danger" className="text-xs">
                            {getDaysLateLabel(inv.daysLate)}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 truncate">
                        {inv.customerName} · {inv.projectDescription}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-slate-800">
                        {formatCurrency(inv.balanceDue || 0, inv.currency)}
                      </p>
                      <p className="text-xs text-slate-400">{timeAgo(inv.updatedAt)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Activity feed */}
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-slate-900">Recent Activity</h3>
          </CardHeader>
          <div className="divide-y divide-slate-50 max-h-80 overflow-y-auto">
            {activity.slice(0, 10).map((item) => (
              <div key={item.id} className="px-4 py-3 hover:bg-slate-50/50">
                <div className="flex items-start gap-2.5">
                  <Avatar name={item.actor} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-slate-700 leading-snug">
                      <span className="font-medium">{item.actor}</span>{' '}
                      {item.action}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="font-mono text-xs text-slate-700 font-semibold">
                        #{item.invoiceNumber}
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="text-xs text-slate-400">{timeAgo(item.timestamp)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
