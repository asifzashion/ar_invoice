import { Users, Shield, Mail } from 'lucide-react';
import { mockUsers } from '../data/mockData';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Avatar } from '../components/ui/Avatar';
import { roleConfig } from '../lib/utils';

export function UsersPage() {
  const roleGroups = mockUsers.reduce(
    (acc, user) => {
      if (!acc[user.role]) acc[user.role] = [];
      acc[user.role].push(user);
      return acc;
    },
    {} as Record<string, typeof mockUsers>
  );

  const roleOrder = ['admin', 'ar_team', 'cmd_team', 'bu_team', 'viewer'] as const;

  const roleDescriptions: Record<string, string> = {
    admin: 'Full access — enter invoices, upload Excel, view all, assign tasks',
    ar_team: 'Verify invoices, accept/reject, mark submission channel',
    cmd_team: 'Update follow-up status, add comments, assign tasks to BU',
    bu_team: 'Resolve technical/milestone issues, update status with comments',
    viewer: 'Read-only access to dashboards, invoice details, and comments',
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Users & Roles</h2>
        <p className="text-sm text-slate-500 mt-1">
          Role-based access control for the MIT AR Tracker
        </p>
      </div>

      {/* Role overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {roleOrder.map((role) => {
          const config = roleConfig[role];
          const users = roleGroups[role] || [];
          return (
            <Card key={role}>
              <CardBody className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield size={16} className={config.color} />
                  <span className={`text-sm font-semibold ${config.color}`}>
                    {config.label}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                  {roleDescriptions[role]}
                </p>
                <div className="flex items-center gap-1.5">
                  {users.map((u) => (
                    <Avatar key={u.id} name={u.name} size="sm" />
                  ))}
                  <span className="text-xs text-slate-400 ml-1">
                    {users.length} user{users.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>

      {/* User list */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users size={18} className="text-slate-500" />
            <h3 className="font-semibold text-slate-900">All Users</h3>
          </div>
        </CardHeader>
        <div className="divide-y divide-slate-50">
          {mockUsers.map((user) => {
            const config = roleConfig[user.role];
            return (
              <div key={user.id} className="px-6 py-4 flex items-center gap-4">
                <Avatar name={user.name} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 text-sm">{user.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Mail size={12} className="text-slate-400" />
                    <span className="text-xs text-slate-500">{user.email}</span>
                  </div>
                </div>
                <span
                  className={`text-xs px-3 py-1 rounded-full font-medium ${config.bg} ${config.color}`}
                >
                  {config.label}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Permissions matrix */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-slate-900">Permissions Matrix</h3>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-left font-semibold text-slate-500 uppercase tracking-wide">
                  Permission
                </th>
                {roleOrder.map((role) => (
                  <th
                    key={role}
                    className={`px-4 py-3 text-center font-semibold uppercase tracking-wide ${roleConfig[role].color}`}
                  >
                    {roleConfig[role].label.split(' ')[0]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {[
                { label: 'View Dashboard', perms: [true, true, true, true, true] },
                { label: 'View All Invoices', perms: [true, true, true, true, true] },
                { label: 'Enter Invoice', perms: [true, false, false, false, false] },
                { label: 'Upload Excel', perms: [true, false, false, false, false] },
                { label: 'Verify Invoice', perms: [false, true, false, false, false] },
                { label: 'Mark Submitted', perms: [false, true, false, false, false] },
                { label: 'Add Comments', perms: [true, true, true, true, false] },
                { label: 'Assign Follow-up', perms: [true, false, true, false, false] },
                { label: 'Change Status', perms: [true, false, true, true, false] },
                { label: 'Manage Users', perms: [true, false, false, false, false] },
              ].map((row) => (
                <tr key={row.label} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 text-slate-700 font-medium">{row.label}</td>
                  {row.perms.map((allowed, i) => (
                    <td key={i} className="px-4 py-3 text-center">
                      {allowed ? (
                        <span className="text-emerald-500 text-base">✓</span>
                      ) : (
                        <span className="text-slate-200 text-base">✗</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
