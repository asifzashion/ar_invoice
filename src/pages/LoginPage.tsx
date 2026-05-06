import { useState } from 'react';
import { useStore } from '../store/useStore';
import { mockUsers } from '../data/mockData';
import { roleConfig } from '../lib/utils';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { FileText, Shield, Users, TrendingUp } from 'lucide-react';

export function LoginPage() {
  const { setCurrentUser } = useStore();
  const [selected, setSelected] = useState<string | null>(null);

  const handleLogin = () => {
    const user = mockUsers.find((u) => u.id === selected);
    if (user) setCurrentUser(user);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-slate-700/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-slate-600/20 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-4xl relative">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary shadow-xl shadow-blue-900/40 mb-4">
            <span className="text-white font-bold text-2xl">M</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">MIT AR Tracker</h1>
          <p className="text-slate-400 text-lg">
            Mannai Infotech · Accounts Receivable Management
          </p>
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {[
            { icon: <FileText size={18} />, label: 'Invoice Tracking', desc: 'Real-time status' },
            { icon: <Shield size={18} />, label: 'Role-Based Access', desc: 'Secure workflows' },
            { icon: <Users size={18} />, label: 'Team Collaboration', desc: 'Assign & follow-up' },
            { icon: <TrendingUp size={18} />, label: 'Analytics', desc: 'Charts & insights' },
          ].map((f) => (
            <div
              key={f.label}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 text-center"
            >
              <div className="text-slate-300 flex justify-center mb-2">{f.icon}</div>
              <p className="text-white text-sm font-medium">{f.label}</p>
              <p className="text-slate-400 text-xs mt-0.5">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Login card */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-2xl">
          <h2 className="text-white font-semibold text-lg mb-1">Select your role to continue</h2>
          <p className="text-slate-400 text-sm mb-5">
            Choose a user profile to explore the system with role-specific access
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
            {mockUsers.map((user) => {
              const role = roleConfig[user.role];
              const isSelected = selected === user.id;
              return (
                <button
                  key={user.id}
                  onClick={() => setSelected(user.id)}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all duration-150 ${
                    isSelected
                      ? 'border-slate-400 bg-slate-700/30 shadow-lg shadow-slate-900/30'
                      : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10'
                  }`}
                >
                  <Avatar name={user.name} src={user.avatar} size="md" />
                  <div className="min-w-0">
                    <p className="text-white font-medium text-sm truncate">{user.name}</p>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${role.bg} ${role.color} inline-block mt-0.5`}
                    >
                      {role.label}
                    </span>
                  </div>
                  {isSelected && (
                    <div className="ml-auto w-5 h-5 rounded-full bg-slate-600 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <Button
            onClick={handleLogin}
            disabled={!selected}
            size="lg"
            className="w-full"
          >
            Enter Dashboard →
          </Button>
        </div>

        <p className="text-center text-slate-500 text-xs mt-4">
          MIT AR Tracker v1.0 · Powered by React + Camunda 8 BPMN
        </p>
      </div>
    </div>
  );
}
