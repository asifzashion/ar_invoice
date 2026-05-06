import {
  LayoutDashboard,
  FileText,
  ClipboardList,
  PlusCircle,
  Upload,
  Users,
  ChevronLeft,
  ChevronRight,
  Bell,
  TrendingUp,
} from 'lucide-react';
import { cn, roleConfig } from '../../lib/utils';
import { useStore } from '../../store/useStore';
import { Avatar } from '../ui/Avatar';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  roles: string[];
  badge?: number;
}

const navItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <LayoutDashboard size={18} />,
    roles: ['admin', 'ar_team', 'cmd_team', 'bu_team', 'viewer'],
  },
  {
    id: 'invoices',
    label: 'All Invoices',
    icon: <FileText size={18} />,
    roles: ['admin', 'ar_team', 'cmd_team', 'bu_team', 'viewer'],
  },
  {
    id: 'assignments',
    label: 'My Assignments',
    icon: <ClipboardList size={18} />,
    roles: ['admin', 'ar_team', 'cmd_team', 'bu_team'],
  },
  {
    id: 'enter-invoice',
    label: 'Enter Invoice',
    icon: <PlusCircle size={18} />,
    roles: ['admin'],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: <TrendingUp size={18} />,
    roles: ['admin', 'cmd_team', 'viewer'],
  },
  {
    id: 'upload',
    label: 'Data Management',
    icon: <Upload size={18} />,
    roles: ['admin'],
  },
  {
    id: 'users',
    label: 'Users',
    icon: <Users size={18} />,
    roles: ['admin'],
  },
];

export function Sidebar() {
  const { currentUser, sidebarOpen, setSidebarOpen, activeView, setActiveView, tasks } =
    useStore();

  if (!currentUser) return null;

  const userTasks = tasks.filter(
    (t) =>
      t.assignee === currentUser.role ||
      (currentUser.role === 'admin' && t.assignee === 'admin')
  );

  const filteredNav = navItems.filter((item) =>
    item.roles.includes(currentUser.role)
  );

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 h-full z-30 flex flex-col',
          'bg-slate-900 text-white transition-all duration-300',
          sidebarOpen ? 'w-64' : 'w-16',
          'lg:relative lg:translate-x-0',
          !sidebarOpen && '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-700/50">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">M</span>
          </div>
          {sidebarOpen && (
            <div className="animate-fade-in overflow-hidden">
              <p className="font-bold text-sm leading-tight">MIT AR Tracker</p>
              <p className="text-xs text-slate-400">Mannai Infotech</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <ul className="space-y-1 px-2">
            {filteredNav.map((item) => {
              const isActive = activeView === item.id;
              const badge =
                item.id === 'assignments' ? userTasks.length : item.badge;

              return (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveView(item.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                      isActive
                        ? 'bg-[#2c4070] text-white shadow-lg shadow-slate-900/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    )}
                    title={!sidebarOpen ? item.label : undefined}
                  >
                    <span className="flex-shrink-0">{item.icon}</span>
                    {sidebarOpen && (
                      <span className="flex-1 text-left animate-fade-in truncate">
                        {item.label}
                      </span>
                    )}
                    {sidebarOpen && badge && badge > 0 && (
                      <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                        {badge}
                      </span>
                    )}
                    {!sidebarOpen && badge && badge > 0 && (
                      <span className="absolute left-8 top-1 w-2 h-2 bg-blue-500 rounded-full" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User info */}
        <div className="border-t border-slate-700/50 p-3">
          <div className="flex items-center gap-3">
            <Avatar name={currentUser.name} size="sm" />
            {sidebarOpen && (
              <div className="flex-1 min-w-0 animate-fade-in">
                <p className="text-sm font-medium text-white truncate">
                  {currentUser.name}
                </p>
                <p
                  className={cn(
                    'text-xs px-1.5 py-0.5 rounded-full inline-block mt-0.5',
                    roleConfig[currentUser.role].bg,
                    roleConfig[currentUser.role].color
                  )}
                >
                  {roleConfig[currentUser.role].label}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Toggle button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-3 top-20 w-6 h-6 bg-slate-700 border border-slate-600 rounded-full flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-600 transition-colors shadow-md"
        >
          {sidebarOpen ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
        </button>
      </aside>
    </>
  );
}
