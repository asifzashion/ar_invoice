import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { useStore } from '../store/useStore';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { formatCurrency } from '../lib/utils';
import {
  BRAND_COLORS, STATUS_COLORS, TOOLTIP_STYLE, GRID_COLOR, AXIS_STYLE,
} from '../lib/chartTheme';

export function Analytics() {
  const { invoices } = useStore();

  // ── Status distribution ──────────────────────────────
  const statusData = Object.entries(
    invoices.reduce((acc, inv) => {
      const label = inv.status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({
    name,
    value,
    color: STATUS_COLORS[name.toLowerCase().replace(/ /g, '_')] || '#a8bbd4',
  }));

  // ── Customer balance ─────────────────────────────────
  const customerData = invoices.reduce(
    (acc, inv) => {
      const short = inv.customerName.split(' ').slice(0, 2).join(' ');
      const existing = acc.find((a) => a.name === short);
      if (existing) { existing.balance += inv.balanceDue || 0; existing.count += 1; }
      else acc.push({ name: short, balance: inv.balanceDue || 0, count: 1 });
      return acc;
    },
    [] as { name: string; balance: number; count: number }[]
  );

  // ── Submission channels ──────────────────────────────
  const channelData = invoices
    .filter((i) => i.submissionChannel)
    .reduce((acc, inv) => {
      const ch = inv.submissionChannel!;
      const label = ch === 'portal' ? 'Portal' : ch === 'email' ? 'Email' : 'Messenger';
      const existing = acc.find((a) => a.name === label);
      if (existing) existing.value += 1;
      else acc.push({ name: label, value: 1 });
      return acc;
    }, [] as { name: string; value: number }[]);

  // ── Days late ────────────────────────────────────────
  const daysLateData = [
    { range: 'Not due', count: invoices.filter((i) => (i.daysLate || 0) < 0).length },
    { range: '0–30d',   count: invoices.filter((i) => (i.daysLate || 0) >= 0 && (i.daysLate || 0) <= 30).length },
    { range: '31–90d',  count: invoices.filter((i) => (i.daysLate || 0) > 30 && (i.daysLate || 0) <= 90).length },
    { range: '90d+',    count: invoices.filter((i) => (i.daysLate || 0) > 90).length },
  ];

  const totalBalance   = invoices.reduce((s, i) => s + (i.balanceDue || 0), 0);
  const overdueBalance = invoices.filter((i) => (i.daysLate || 0) > 0 && i.status !== 'resolved').reduce((s, i) => s + (i.balanceDue || 0), 0);
  const resolvedCount  = invoices.filter((i) => i.status === 'resolved').length;
  const avgDaysLate    = invoices.filter((i) => (i.daysLate || 0) > 0).reduce((s, i) => s + (i.daysLate || 0), 0) / (invoices.filter((i) => (i.daysLate || 0) > 0).length || 1);

  // Shared chart card wrapper
  const ChartCard = ({ title, children, height = 260 }: { title: string; children: React.ReactNode; height?: number }) => (
    <Card>
      <CardHeader><h3 className="font-semibold text-slate-900">{title}</h3></CardHeader>
      <CardBody>
        <ResponsiveContainer width="100%" height={height}>
          {children as React.ReactElement}
        </ResponsiveContainer>
      </CardBody>
    </Card>
  );

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total AR Balance', value: formatCurrency(totalBalance),   sub: `${invoices.length} invoices`,                                                                                    color: 'text-[#2c4070]', bg: 'bg-[#2c4070]/10' },
          { label: 'Overdue Balance',  value: formatCurrency(overdueBalance), sub: `${invoices.filter((i) => (i.daysLate||0)>0 && i.status!=='resolved').length} invoices`,                          color: 'text-red-600',   bg: 'bg-red-50' },
          { label: 'Resolved',         value: `${resolvedCount}`,             sub: `${Math.round((resolvedCount / invoices.length) * 100)}% of total`,                                               color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Avg Days Late', value: `${Math.round(avgDaysLate)}d`, sub: 'For overdue invoices', color: 'text-[#2c4070]', bg: 'bg-[#2c4070]/10' },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardBody className="p-4">
              <div className={`text-xs font-medium ${kpi.color} ${kpi.bg} px-2 py-0.5 rounded-full inline-block mb-2`}>
                {kpi.label}
              </div>
              <p className="text-2xl font-bold text-slate-900">{kpi.value}</p>
              <p className="text-xs text-slate-600 mt-0.5">{kpi.sub}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* ── Row 1: Status pie + Customer bar ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <ChartCard title="Status Distribution">
          <PieChart>
            <Pie
              data={statusData}
              cx="50%" cy="50%"
              innerRadius={65} outerRadius={95}
              paddingAngle={3} dataKey="value"
              label={({ percent }: { percent?: number }) =>
                (percent ?? 0) > 0.05 ? `${Math.round((percent ?? 0) * 100)}%` : ''
              }
              labelLine={false}
            >
              {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
            </Pie>
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Legend iconType="circle" iconSize={8}
              formatter={(v) => <span style={{ fontSize: 11, color: '#64748b' }}>{v}</span>}
            />
          </PieChart>
        </ChartCard>

        <ChartCard title="Balance Due by Customer (QAR)">
          <BarChart data={customerData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
            <XAxis dataKey="name" tick={AXIS_STYLE} tickLine={false} />
            <YAxis tick={AXIS_STYLE} tickLine={false} axisLine={false}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
            />
            <Tooltip contentStyle={TOOLTIP_STYLE}
              formatter={(v) => [formatCurrency(Number(v)), 'Balance Due']}
            />
            <Bar dataKey="balance" radius={[4, 4, 0, 0]}>
              {customerData.map((_, i) => (
                <Cell key={i} fill={BRAND_COLORS[i % BRAND_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ChartCard>

      </div>

      {/* ── Row 2: Channels pie + Days late bar ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <Card>
          <CardHeader><h3 className="font-semibold text-slate-900">Submission Channels</h3></CardHeader>
          <CardBody>
            {channelData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-slate-600 text-sm">
                No submissions yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={channelData}
                    cx="50%" cy="50%"
                    innerRadius={55} outerRadius={80}
                    paddingAngle={3} dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {channelData.map((_, i) => (
                      <Cell key={i} fill={BRAND_COLORS[i % BRAND_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend iconType="circle" iconSize={8}
                    formatter={(v) => <span style={{ fontSize: 11, color: '#64748b' }}>{v}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardBody>
        </Card>

        <ChartCard title="Days Late Distribution" height={220}>
          <BarChart data={daysLateData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
            <XAxis dataKey="range" tick={AXIS_STYLE} tickLine={false} />
            <YAxis tick={AXIS_STYLE} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Invoices">
              {daysLateData.map((_, i) => (
                <Cell key={i} fill={BRAND_COLORS[i % BRAND_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ChartCard>

      </div>

      {/* ── Invoice summary table ── */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-slate-900">Invoice Summary</h3>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {['Invoice #', 'Customer', 'Balance Due', 'Days Late', 'Status', 'Vertical'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {invoices.map((inv) => (
                <tr key={inv.invoiceNumber} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-[#2c4070]">{inv.invoiceNumber}</td>
                  <td className="px-4 py-3 text-xs text-slate-700 max-w-[160px] truncate">{inv.customerName}</td>
                  <td className="px-4 py-3 text-xs font-semibold text-slate-800">{formatCurrency(inv.balanceDue || 0, inv.currency)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium ${(inv.daysLate||0)>90?'text-red-600':(inv.daysLate||0)>0?'text-amber-600':'text-emerald-600'}`}>
                      {inv.daysLate !== undefined ? (inv.daysLate > 0 ? `+${inv.daysLate}d` : `${inv.daysLate}d`) : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                      inv.status==='resolved'   ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      inv.status==='in_followup'? 'bg-[#2c4070]/10 text-[#2c4070] border-[#2c4070]/30' :
                                                  'bg-slate-50 text-slate-600 border-slate-200'
                    }`}>
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
