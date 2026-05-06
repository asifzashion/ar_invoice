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
    color: 'text-[#2c4070]',
    bg: 'bg-[#2c4070]/10 border-[#2c4070]/30',
    dot: 'bg-[#2c4070]',
  },
  rejected: {
    label: 'Rejected',
    color: 'text-red-800',
    bg: 'bg-red-100 border-red-300',
    dot: 'bg-red-700',
  },
  verified: {
    label: 'Verified',
    color: 'text-[#1a2a4a]',
    bg: 'bg-[#2c4070]/15 border-[#2c4070]/40',
    dot: 'bg-[#2c4070]',
  },
  submitted: {
    label: 'Submitted',
    color: 'text-[#1a2a4a]',
    bg: 'bg-[#3d5490]/15 border-[#3d5490]/40',
    dot: 'bg-[#3d5490]',
  },
  in_followup: {
    label: 'In Follow-up',
    color: 'text-[#2c4070]',
    bg: 'bg-[#4e68b0]/15 border-[#4e68b0]/40',
    dot: 'bg-[#4e68b0]',
  },
  resolved: {
    label: 'Resolved',
    color: 'text-emerald-800',
    bg: 'bg-emerald-100 border-emerald-300',
    dot: 'bg-emerald-700',
  },
  on_hold: {
    label: 'On Hold',
    color: 'text-slate-700',
    bg: 'bg-slate-100 border-slate-300',
    dot: 'bg-slate-600',
  },
};

export const roleConfig: Record<
  UserRole,
  { label: string; color: string; bg: string }
> = {
  admin: { label: 'Account Admin', color: 'text-purple-700', bg: 'bg-purple-100' },
  ar_team: { label: 'AR Submission Team', color: 'text-slate-700', bg: 'bg-slate-100' },
  cmd_team: { label: 'CMD Finance', color: 'text-emerald-700', bg: 'bg-emerald-100' },
  bu_team: { label: 'Business Unit', color: 'text-[#2c4070]', bg: 'bg-[#2c4070]/10' },
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
