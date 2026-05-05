import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area,
} from 'recharts';
import { useStore } from '../store/useStore';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { formatCurrency } from '../lib/utils';

const STATUS_COLORS: Record<string, string> = {
  pending_verification: '#f59e0b',
  rejected: '#ef4444',
  verified: '#3b82f6',
  submitted: '#6366f1',
  in_followup: '#f97316',
  resolved: '#10b981',
  on_hold: '#94a3b8',
};

const CHANNEL_COLORS = ['#3b82f6', '#10b981', '#8b5cf6'];

export function Analytics() {
  const { invoices } = useStore();

  // Status distribution
  const statusData = Object.entries(
    invoices.reduce((acc, inv) => {
      const label = inv.status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({
    name,
    value,
    color: STATUS_COLORS[name.toLowerCase().replace(/ /g, '_')] || '#94a3b8',
  }));

  // Customer balance
  const customerData = invoices.reduce(
    (acc, inv) => {
      const short = inv.customerName.split(' ').slice(0, 2).join(' ');
      const existing = acc.find((a) => a.name === short);
      if (existing) {
        existing.balance += inv.balanceDue || 0;
        existing.count += 1;
      } else {
        acc.push({ name: short, balance: inv.balanceDue || 0, count: 1 });
      }
      return acc;
    },
    [] as { name: string; balance: number; count: number }[]
  );

  // Submission channels
  const channelData = invoices
    .filter((i) => i.submissionChannel)
    .reduce(
      (acc, inv) => {
        const ch = inv.submissionChannel!;
        const label = ch === 'portal' ? 'Portal' : ch === 'email' ? 'Email' : 'Messenger';
        const existing = acc.find((a) => a.name === label);
        if (existing) existing.value += 1;
        else acc.push({ name: label, value: 1 });
        return acc;
      },
      [] as { name: string; value: number }[]
    );

  // Days late distribution
  const daysLateData = [
    { range: 'Not due', count: invoices.filter((i) => (i.daysLate || 0) < 0).length },
    { range: '0-30d', count: invoices.filter((i) => (i.daysLate || 0) >= 0 && (i.daysLate || 0) <= 30).length },
    { range: '31-90d', count: invoices.filter((i) => (i.daysLate || 0) > 30 && (i.daysLate || 0) <= 90).length },
    { range: '90d+', count: invoices.filter((i) => (i.daysLate || 0) > 90).length },
  ];

  const totalBalance = invoices.reduce((s, i) => s + (i.balanceDue || 0), 0);
  const overdueBalance = invoices
    .filter((i) => (i.daysLate || 0) > 0 && i.status !== 'resolved')
    .reduce((s, i) => s + (i.balanceDue || 0), 0);
  const resolvedCount = invoices.filter((i) => i.status === 'resolved').length;
  const avgDaysLate =
    invoices.filter((i) => (i.daysLate || 0) > 0).reduce((s, i) => s + (i.daysLate || 0), 0) /
    (invoices.filter((i) => (i.daysLate || 0) > 0).length || 1);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total AR Balance',
            value: formatCurrency(totalBalance),
            sub: `${invoices.length} invoices`,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
          },
          {
            label: 'Overdue Balance',
            value: formatCurrency(overdueBalance),
            sub: `${invoices.filter((i) => (i.daysLate || 0) > 0 && i.status !== 'resolved').length} invoices`,
            color: 'text-red-600',
            bg: 'bg-red-50',
          },
          {
            label: 'Resolved',
            value: `${resolvedCount}`,
            sub: `${Math.round((resolvedCount / invoices.length) * 100)}% of total`,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
          },
          {
            label: 'Avg Days Late',
            value: `${Math.round(avgDaysLate)}d`,
            sub: 'For overdue invoices',
            color: 'text-orange-600',
            bg: 'bg-orange-50',
          },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardBody className="p-4">
              <div className={`text-xs font-medium ${kpi.color} ${kpi.bg} px-2 py-0.5 rounded-full inline-block mb-2`}>
                {kpi.label}
              </div>
              <p className="text-2xl font-bold text-slate-900">{kpi.value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{kpi.sub}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-slate-900">Status Distribution</h3>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ percent }: { percent?: number }) =>
                    (percent ?? 0) > 0.05 ? `${Math.round((percent ?? 0) * 100)}%` : ''
                  }
                  labelLine={false}
                >
                  {statusData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
                <Legend iconType="circle" iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="font-semibold text-slate-900">Balance Due by Customer (QAR)</h3>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={customerData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
                />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  formatter={(v) => [formatCurrency(Number(v)), 'Balance Due']}
                />
                <Bar dataKey="balance" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-slate-900">Submission Channels</h3>
          </CardHeader>
          <CardBody>
            {channelData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
                No submissions yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={channelData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {channelData.map((_, i) => (
                      <Cell key={i} fill={CHANNEL_COLORS[i % CHANNEL_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="font-semibold text-slate-900">Days Late Distribution</h3>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={daysLateData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="range" tick={{ fontSize: 12, fill: '#64748b' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                <Bar
                  dataKey="count"
                  radius={[4, 4, 0, 0]}
                  fill="#f97316"
                  name="Invoices"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>

      {/* Invoice table summary */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-slate-900">Invoice Summary</h3>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {['Invoice #', 'Customer', 'Balance Due', 'Days Late', 'Status', 'Vertical'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {invoices.map((inv) => (
                <tr key={inv.invoiceNumber} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-blue-700">
                    {inv.invoiceNumber}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-700 max-w-[160px] truncate">
                    {inv.customerName}
                  </td>
                  <td className="px-4 py-3 text-xs font-semibold text-slate-800">
                    {formatCurrency(inv.balanceDue || 0, inv.currency)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-medium ${
                        (inv.daysLate || 0) > 90
                          ? 'text-red-600'
                          : (inv.daysLate || 0) > 0
                          ? 'text-amber-600'
                          : 'text-emerald-600'
                      }`}
                    >
                      {inv.daysLate !== undefined
                        ? inv.daysLate > 0
                          ? `+${inv.daysLate}d`
                          : `${inv.daysLate}d`
                        : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                        inv.status === 'resolved'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : inv.status === 'in_followup'
                          ? 'bg-orange-50 text-orange-700 border-orange-200'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      {inv.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{inv.vertical || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
