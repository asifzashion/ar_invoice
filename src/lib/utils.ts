import { clsx, type ClassValue } from 'clsx';
import type { InvoiceStatus, UserRole } from '../types';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCurrency(amount: number, currency = 'QAR'): string {
  return new Intl.NumberFormat('en-QA', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + ` ${currency}`;
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

export function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateStr);
}

export const statusConfig: Record<
  InvoiceStatus,
  { label: string; color: string; bg: string; dot: string }
> = {
  pending_verification: {
    label: 'Pending Verification',
    color: 'text-amber-700',
    bg: 'bg-amber-50 border-amber-200',
    dot: 'bg-amber-500',
  },
  rejected: {
    label: 'Rejected',
    color: 'text-red-700',
    bg: 'bg-red-50 border-red-200',
    dot: 'bg-red-500',
  },
  verified: {
    label: 'Verified',
    color: 'text-blue-700',
    bg: 'bg-blue-50 border-blue-200',
    dot: 'bg-blue-500',
  },
  submitted: {
    label: 'Submitted',
    color: 'text-indigo-700',
    bg: 'bg-indigo-50 border-indigo-200',
    dot: 'bg-indigo-500',
  },
  in_followup: {
    label: 'In Follow-up',
    color: 'text-orange-700',
    bg: 'bg-orange-50 border-orange-200',
    dot: 'bg-orange-500',
  },
  resolved: {
    label: 'Resolved',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50 border-emerald-200',
    dot: 'bg-emerald-500',
  },
  on_hold: {
    label: 'On Hold',
    color: 'text-slate-700',
    bg: 'bg-slate-50 border-slate-200',
    dot: 'bg-slate-500',
  },
};

export const roleConfig: Record<
  UserRole,
  { label: string; color: string; bg: string }
> = {
  admin: { label: 'Account Admin', color: 'text-purple-700', bg: 'bg-purple-100' },
  ar_team: { label: 'AR Submission Team', color: 'text-blue-700', bg: 'bg-blue-100' },
  cmd_team: { label: 'CMD Finance', color: 'text-emerald-700', bg: 'bg-emerald-100' },
  bu_team: { label: 'Business Unit', color: 'text-orange-700', bg: 'bg-orange-100' },
  viewer: { label: 'Viewer (PM/Ops)', color: 'text-slate-700', bg: 'bg-slate-100' },
};

export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

export function isOverdue(dueDate: string | undefined): boolean {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
}

export function getDaysLateLabel(daysLate: number | undefined): string {
  if (daysLate === undefined) return '';
  if (daysLate < 0) return `Due in ${Math.abs(daysLate)}d`;
  if (daysLate === 0) return 'Due today';
  return `${daysLate}d overdue`;
}
