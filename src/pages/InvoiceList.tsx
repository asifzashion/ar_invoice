import { useState } from 'react';
import { Search, Filter, ChevronUp, ChevronDown, Eye } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Card } from '../components/ui/Card';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { formatCurrency, formatDate, getDaysLateLabel } from '../lib/utils';
import type { InvoiceStatus } from '../types';

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'All Statuses' },
  { value: 'pending_verification', label: 'Pending Verification' },
  { value: 'verified', label: 'Verified' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'in_followup', label: 'In Follow-up' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'rejected', label: 'Rejected' },
];

type SortKey = 'invoiceNumber' | 'customerName' | 'dueDate' | 'balanceDue' | 'daysLate' | 'updatedAt';

export function InvoiceList() {
  const { invoices, setActiveView } = useStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('updatedAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const filtered = invoices
    .filter((inv) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.customerName.toLowerCase().includes(q) ||
        inv.projectDescription.toLowerCase().includes(q) ||
        inv.projectManager.toLowerCase().includes(q) ||
        inv.projectId.toLowerCase().includes(q);
      const matchStatus = !statusFilter || inv.status === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      let aVal: string | number = '';
      let bVal: string | number = '';
      if (sortKey === 'balanceDue') {
        aVal = a.balanceDue || 0;
        bVal = b.balanceDue || 0;
      } else if (sortKey === 'daysLate') {
        aVal = a.daysLate || 0;
        bVal = b.daysLate || 0;
      } else {
        aVal = String(a[sortKey] || '');
        bVal = String(b[sortKey] || '');
      }
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ col }: { col: SortKey }) =>
    sortKey === col ? (
      sortDir === 'asc' ? (
        <ChevronUp size={14} />
      ) : (
        <ChevronDown size={14} />
      )
    ) : (
      <ChevronDown size={14} className="opacity-30" />
    );

  const totalBalance = filtered.reduce((s, i) => s + (i.balanceDue || 0), 0);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Filters */}
      <Card>
        <div className="px-4 py-3 flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Search by invoice #, customer, project, PM..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search size={16} />}
            />
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            {(search || statusFilter) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('');
                }}
              >
                Clear
              </Button>
            )}
          </div>
        </div>
        <div className="px-4 pb-2 flex items-center gap-4 text-xs text-slate-500 border-t border-slate-50 pt-2">
          <span>
            <strong className="text-slate-700">{filtered.length}</strong> invoices
          </span>
          <span>
            Total balance:{' '}
            <strong className="text-slate-700">{formatCurrency(totalBalance)}</strong>
          </span>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {[
                  { key: 'invoiceNumber' as SortKey, label: 'Invoice #' },
                  { key: 'customerName' as SortKey, label: 'Customer' },
                  { key: null, label: 'Project' },
                  { key: 'dueDate' as SortKey, label: 'Due Date' },
                  { key: 'daysLate' as SortKey, label: 'Days Late' },
                  { key: 'balanceDue' as SortKey, label: 'Balance Due' },
                  { key: null, label: 'Status' },
                  { key: 'updatedAt' as SortKey, label: 'Updated' },
                  { key: null, label: '' },
                ].map((col, i) => (
                  <th
                    key={i}
                    className={`px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap ${
                      col.key ? 'cursor-pointer hover:text-slate-700 select-none' : ''
                    }`}
                    onClick={() => col.key && handleSort(col.key)}
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      {col.key && <SortIcon col={col.key} />}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                    <Search size={32} className="mx-auto mb-2 opacity-30" />
                    <p>No invoices found</p>
                  </td>
                </tr>
              ) : (
                filtered.map((inv) => (
                  <tr
                    key={inv.invoiceNumber}
                    className="hover:bg-blue-50/30 transition-colors cursor-pointer"
                    onClick={() => setActiveView(`invoice-${inv.invoiceNumber}`)}
                  >
                    <td className="px-4 py-3.5">
                      <span className="font-mono font-semibold text-blue-700 text-xs">
                        {inv.invoiceNumber}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-slate-800 text-xs leading-tight max-w-[160px] truncate">
                        {inv.customerName}
                      </p>
                      <p className="text-slate-400 text-xs">{inv.customerId}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-slate-700 text-xs max-w-[200px] truncate">
                        {inv.projectDescription}
                      </p>
                      <p className="text-slate-400 text-xs">{inv.projectId}</p>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 text-xs whitespace-nowrap">
                      {formatDate(inv.dueDate)}
                    </td>
                    <td className="px-4 py-3.5">
                      {inv.daysLate !== undefined && (
                        <Badge
                          variant={
                            inv.daysLate > 30
                              ? 'danger'
                              : inv.daysLate > 0
                              ? 'warning'
                              : 'success'
                          }
                        >
                          {getDaysLateLabel(inv.daysLate)}
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="font-semibold text-slate-800 text-xs whitespace-nowrap">
                        {formatCurrency(inv.balanceDue || 0, inv.currency)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={inv.status} />
                    </td>
                    <td className="px-4 py-3.5 text-slate-400 text-xs whitespace-nowrap">
                      {formatDate(inv.updatedAt)}
                    </td>
                    <td className="px-4 py-3.5">
                      <button
                        className="p-1.5 rounded-lg hover:bg-blue-100 text-slate-400 hover:text-blue-600 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveView(`invoice-${inv.invoiceNumber}`);
                        }}
                      >
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
