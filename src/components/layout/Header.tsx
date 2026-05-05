import { Bell, Menu, Search, LogOut, ChevronDown } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { roleConfig } from '../../lib/utils';
import { Avatar } from '../ui/Avatar';
import { useState } from 'react';
import { mockUsers } from '../../data/mockData';

const viewTitles: Record<string, string> = {
  dashboard: 'Dashboard',
  invoices: 'All Invoices',
  assignments: 'My Assignments',
  'enter-invoice': 'Enter Invoice',
  analytics: 'Analytics',
  upload: 'Data Management',
  users: 'Users',
  'invoice-detail': 'Invoice Details',
};

export function Header() {
  const { currentUser, setCurrentUser, setSidebarOpen, sidebarOpen, activeView, tasks } =
    useStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  if (!currentUser) return null;

  const userTasks = tasks.filter(
    (t) => t.assignee === currentUser.role
  );

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-10 shadow-sm">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 lg:hidden"
        >
          <Menu size={20} />
        </button>
        <div>
          <h1 className="text-lg font-semibold text-slate-900">
            {viewTitles[activeView] || 'MIT AR Tracker'}
          </h1>
          <p className="text-xs text-slate-500 hidden sm:block">
            Mannai Infotech · Accounts Receivable
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
          >
            <Bell size={20} />
            {userTasks.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </button>
          {showNotifications && (
            <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50 animate-fade-in">
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="font-semibold text-slate-900 text-sm">Notifications</p>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {userTasks.length === 0 ? (
                  <p className="text-sm text-slate-500 px-4 py-6 text-center">
                    No pending tasks
                  </p>
                ) : (
                  userTasks.map((task) => (
                    <div
                      key={task.id}
                      className="px-4 py-3 hover:bg-slate-50 border-b border-slate-50 last:border-0"
                    >
                      <p className="text-sm font-medium text-slate-800">{task.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Invoice #{task.invoiceNumber}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <Avatar name={currentUser.name} size="sm" />
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-slate-800 leading-tight">
                {currentUser.name.split(' ')[0]}
              </p>
              <p className="text-xs text-slate-500">
                {roleConfig[currentUser.role].label}
              </p>
            </div>
            <ChevronDown size={14} className="text-slate-400" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-12 w-56 bg-white rounded-xl shadow-xl border border-slate-200 z-50 animate-fade-in">
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="font-semibold text-slate-900 text-sm">{currentUser.name}</p>
                <p className="text-xs text-slate-500">{currentUser.email}</p>
              </div>
              <div className="py-1">
                <p className="px-4 py-2 text-xs font-medium text-slate-400 uppercase tracking-wide">
                  Switch Role
                </p>
                {mockUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => {
                      setCurrentUser(user);
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 text-slate-700 flex items-center gap-2"
                  >
                    <Avatar name={user.name} size="sm" />
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-xs text-slate-500">
                        {roleConfig[user.role].label}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
              <div className="border-t border-slate-100 py-1">
                <button
                  onClick={() => setCurrentUser(null)}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <LogOut size={14} />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
