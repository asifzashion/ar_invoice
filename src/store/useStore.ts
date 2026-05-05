import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Invoice,
  User,
  CamundaTask,
  ActivityItem,
  Comment,
  FollowUpTask,
  InvoiceStatus,
  SubmissionChannel,
} from '../types';
import { mockInvoices, mockTasks, mockActivity } from '../data/mockData';

interface AppState {
  // Auth
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;

  // Excel data (master)
  excelData: Record<string, Partial<Invoice>>;
  setExcelData: (data: Record<string, Partial<Invoice>>) => void;

  // Invoices
  invoices: Invoice[];
  addInvoice: (invoice: Invoice) => void;
  updateInvoice: (invoiceNumber: string, updates: Partial<Invoice>) => void;
  getInvoice: (invoiceNumber: string) => Invoice | undefined;

  // Tasks
  tasks: CamundaTask[];
  addTask: (task: CamundaTask) => void;
  removeTask: (taskId: string) => void;
  updateTask: (taskId: string, updates: Partial<CamundaTask>) => void;

  // Activity
  activity: ActivityItem[];
  addActivity: (item: ActivityItem) => void;

  // Comments
  addComment: (invoiceNumber: string, comment: Comment) => void;

  // Follow-up tasks
  addFollowUpTask: (invoiceNumber: string, task: FollowUpTask) => void;
  closeFollowUpTask: (invoiceNumber: string, taskId: string) => void;

  // Status updates
  updateInvoiceStatus: (
    invoiceNumber: string,
    status: InvoiceStatus,
    actor: string
  ) => void;
  updateSubmissionChannel: (
    invoiceNumber: string,
    channel: SubmissionChannel,
    notes: string | null
  ) => void;

  // UI state
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  activeView: string;
  setActiveView: (view: string) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      setCurrentUser: (user) => set({ currentUser: user }),

      excelData: {},
      setExcelData: (data) => set({ excelData: data }),

      invoices: mockInvoices,
      addInvoice: (invoice) =>
        set((state) => ({ invoices: [invoice, ...state.invoices] })),
      updateInvoice: (invoiceNumber, updates) =>
        set((state) => ({
          invoices: state.invoices.map((inv) =>
            inv.invoiceNumber === invoiceNumber
              ? { ...inv, ...updates, updatedAt: new Date().toISOString() }
              : inv
          ),
        })),
      getInvoice: (invoiceNumber) =>
        get().invoices.find((inv) => inv.invoiceNumber === invoiceNumber),

      tasks: mockTasks,
      addTask: (task) =>
        set((state) => ({ tasks: [task, ...state.tasks] })),
      removeTask: (taskId) =>
        set((state) => ({ tasks: state.tasks.filter((t) => t.id !== taskId) })),
      updateTask: (taskId, updates) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId ? { ...t, ...updates } : t
          ),
        })),

      activity: mockActivity,
      addActivity: (item) =>
        set((state) => ({ activity: [item, ...state.activity].slice(0, 50) })),

      addComment: (invoiceNumber, comment) =>
        set((state) => ({
          invoices: state.invoices.map((inv) =>
            inv.invoiceNumber === invoiceNumber
              ? {
                  ...inv,
                  comments: [...inv.comments, comment],
                  updatedAt: new Date().toISOString(),
                }
              : inv
          ),
        })),

      addFollowUpTask: (invoiceNumber, task) =>
        set((state) => ({
          invoices: state.invoices.map((inv) =>
            inv.invoiceNumber === invoiceNumber
              ? {
                  ...inv,
                  followUpTasks: [...inv.followUpTasks, task],
                  updatedAt: new Date().toISOString(),
                }
              : inv
          ),
        })),

      closeFollowUpTask: (invoiceNumber, taskId) =>
        set((state) => ({
          invoices: state.invoices.map((inv) =>
            inv.invoiceNumber === invoiceNumber
              ? {
                  ...inv,
                  followUpTasks: inv.followUpTasks.map((t) =>
                    t.id === taskId ? { ...t, status: 'closed' } : t
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : inv
          ),
        })),

      updateInvoiceStatus: (invoiceNumber, status, actor) => {
        set((state) => ({
          invoices: state.invoices.map((inv) =>
            inv.invoiceNumber === invoiceNumber
              ? { ...inv, status, updatedAt: new Date().toISOString() }
              : inv
          ),
        }));
        get().addActivity({
          id: crypto.randomUUID(),
          invoiceNumber,
          action: `Status updated to "${status.replace(/_/g, ' ')}"`,
          actor,
          timestamp: new Date().toISOString(),
        });
      },

      updateSubmissionChannel: (invoiceNumber, channel, notes) =>
        set((state) => ({
          invoices: state.invoices.map((inv) =>
            inv.invoiceNumber === invoiceNumber
              ? {
                  ...inv,
                  submissionChannel: channel,
                  submissionNotes: notes,
                  submissionDate: new Date().toISOString(),
                  status: 'submitted',
                  updatedAt: new Date().toISOString(),
                }
              : inv
          ),
        })),

      sidebarOpen: true,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      activeView: 'dashboard',
      setActiveView: (view) => set({ activeView: view }),
    }),
    {
      name: 'mit-ar-store',
      partialize: (state) => ({
        currentUser: state.currentUser,
        invoices: state.invoices,
        excelData: state.excelData,
        activity: state.activity,
      }),
    }
  )
);
