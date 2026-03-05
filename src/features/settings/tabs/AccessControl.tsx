import React from 'react';
import { useRoleSettings } from '../../../hooks/useRoleSettings';
import { UserRole, RolePermissionConfig } from '../../../types';
import { ShieldCheck, Loader2 } from 'lucide-react';

const permissionLabels: Record<keyof Omit<RolePermissionConfig, 'role'>, string> = {
  view_animals: 'View Animals',
  edit_animals: 'Edit Animals',
  view_daily_logs: 'View Daily Logs',
  view_tasks: 'View Tasks',
  view_daily_rounds: 'View Daily Rounds',
  view_medical: 'View Medical',
  edit_medical: 'Edit Medical',
  view_movements: 'View Movements',
  view_incidents: 'View Incidents',
  view_maintenance: 'View Maintenance',
  view_safety_drills: 'View Safety Drills',
  view_first_aid: 'View First Aid',
  view_timesheets: 'View Timesheets',
  view_holidays: 'View Holidays',
  view_missing_records: 'View Missing Records',
  generate_reports: 'Generate Reports',
  view_settings: 'View Settings',
  manage_access_control: 'Manage Access Control',
};

const AccessControl: React.FC = () => {
  const { roles, handlePermissionChange } = useRoleSettings();

  if (!roles) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const permissionKeys = Object.keys(permissionLabels) as (keyof Omit<RolePermissionConfig, 'role'>)[];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ShieldCheck className="text-emerald-600" size={28} />
        <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Access Control</h2>
      </div>

      <div className="overflow-x-auto bg-white rounded-xl border border-slate-200 shadow-sm">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-4 py-3 font-black text-slate-500 uppercase tracking-widest">Role</th>
              {permissionKeys.map(key => (
                <th key={key} className="px-4 py-3 font-black text-slate-500 uppercase tracking-widest text-center rotate-90 origin-bottom-left whitespace-nowrap">
                  {permissionLabels[key]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.values(UserRole).map(role => {
              const roleConfig = roles.find(r => r.role === role);
              return (
                <tr key={role} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-bold text-slate-900 uppercase tracking-widest">{role}</td>
                  {permissionKeys.map(key => (
                    <td key={key} className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={roleConfig ? roleConfig[key] : false}
                        onChange={(e) => handlePermissionChange(role, key, e.target.checked)}
                        className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                      />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AccessControl;
