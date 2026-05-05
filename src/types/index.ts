export type UserRole = 'admin' | 'ar_team' | 'cmd_team' | 'bu_team' | 'viewer';

export type InvoiceStatus =
  | 'pending_verification'
  | 'rejected'
  | 'verified'
  | 'submitted'
  | 'in_followup'
  | 'resolved'
  | 'on_hold';

export type SubmissionChannel = 'email' | 'messenger' | 'portal' | null;

export type TaskType = 'verification' | 'submission' | 'followup' | 'bu_action';

export interface Comment {
  id: string;
  invoiceNumber: string;
  author: string;
  authorRole: UserRole;
  text: string;
  timestamp: string;
  taskType: TaskType;
}

export interface FollowUpTask {
  id: string;
  invoiceNumber: string;
  assignedTo: string;
  assignedBy: string;
  description: string;
  dueDate: string;
  status: 'open' | 'closed';
  createdAt: string;
}

export interface Invoice {
  // From Excel (A–H)
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  transactionDate: string;
  purchaseOrder: string;
  projectId: string;
  projectDescription: string;
  projectManager: string;

  // Application-tracked
  status: InvoiceStatus;
  submissionChannel: SubmissionChannel;
  submissionDate: string | null;
  submissionNotes: string | null;
  currentOwner: string;
  comments: Comment[];
  followUpTasks: FollowUpTask[];
  createdAt: string;
  updatedAt: string;

  // Financial (from Excel)
  daysLate?: number;
  dueDate?: string;
  balanceDue?: number;
  currency?: string;
  originalAmount?: number;

  // Workflow
  camundaProcessId?: string;
  rejectionReason?: string;
  buResponsible?: string;
  vertical?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface CamundaTask {
  id: string;
  name: string;
  invoiceNumber: string;
  assignee: string;
  created: string;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high';
  taskType: TaskType;
  variables: Record<string, unknown>;
}

export interface ActivityItem {
  id: string;
  invoiceNumber: string;
  action: string;
  actor: string;
  timestamp: string;
  details?: string;
}

export interface DashboardStats {
  total: number;
  pendingVerification: number;
  pendingSubmission: number;
  overdueFollowups: number;
  resolved: number;
  onHold: number;
}
