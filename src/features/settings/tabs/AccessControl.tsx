import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Shield, User as UserIcon, Lock, Users, Check, X } from 'lucide-react';
import { useUsersData } from '../useUsersData';
import { User, UserRole, RolePermissionConfig } from '../../../types';
import UserFormModal from '../components/UserFormModal';
import { usePermissions } from '../../../hooks/usePermissions';
import { useAuthStore } from '../../../store/authStore';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../lib/db';

const AccessControl: React.FC = () => {
  const { users, isLoading, addUser, updateUser, deleteUser } = useUsersData();
  const { isAdmin, isOwner } = usePermissions();
  const { currentUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'directory' | 'permissions'>('directory');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const allRolePermissions = useLiveQuery(() => db.role_permissions.toArray()) || [];

  if (!isAdmin && !isOwner) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-rose-50 rounded-[2rem] border-2 border-rose-100 p-8 text-center">
        <Shield size={48} className="text-rose-500 mb-4" />
        <h3 className="text-lg font-black text-rose-900 uppercase tracking-tight">Access Denied</h3>
        <p className="text-sm font-bold text-rose-700 mt-2">Administrator privileges are required to manage staff accounts.</p>
      </div>
    );
  }

  const handleSaveUser = async (data: Omit<User, 'id'>) => {
    if (editingUser) {
      await updateUser(editingUser.id, data);
    } else {
      await addUser(data);
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (user.id === currentUser?.id) {
      alert("Self-Lockout Prevention: You cannot delete your own administrator account.");
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${user.name}? This will revoke all system access.`)) {
      await deleteUser(user.id);
    }
  };

  const updateRolePermission = async (role: UserRole, field: keyof RolePermissionConfig, value: boolean) => {
    const existing = await db.role_permissions.get(role);
    if (existing) {
      await db.role_permissions.update(role, { [field]: value });
    } else {
      const defaultValue: RolePermissionConfig = {
        role,
        view_animals: false,
        edit_animals: false,
        view_daily_logs: false,
        view_tasks: false,
        view_daily_rounds: false,
        view_medical: false,
        edit_medical: false,
        view_movements: false,
        view_incidents: false,
        view_maintenance: false,
        view_safety_drills: false,
        view_first_aid: false,
        view_timesheets: false,
        view_holidays: false,
        view_missing_records: false,
        generate_reports: false,
        view_settings: false,
        manage_access_control: false,
      };
      await db.role_permissions.add({ ...defaultValue, [field]: value });
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case UserRole.OWNER: return 'bg-purple-100 text-purple-700 border-purple-200';
      case UserRole.ADMIN: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case UserRole.SENIOR_KEEPER: return 'bg-blue-100 text-blue-700 border-blue-200';
      case UserRole.KEEPER: return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const permissionGroups = [
    {
      title: 'Animals & Collection',
      fields: [
        { key: 'view_animals', label: 'Access Animal Directory' },
        { key: 'edit_animals', label: 'Edit Animal Profiles' },
      ]
    },
    {
      title: 'Husbandry & Daily Ops',
      fields: [
        { key: 'view_daily_logs', label: 'Access Daily Logs' },
        { key: 'view_tasks', label: 'Access Tasks Page' },
        { key: 'view_daily_rounds', label: 'Access Daily Rounds' },
      ]
    },
    {
      title: 'Medical & Health',
      fields: [
        { key: 'view_medical', label: 'View Medical Records' },
        { key: 'edit_medical', label: 'Edit Medical Records' },
      ]
    },
    {
      title: 'Logistics',
      fields: [
        { key: 'view_movements', label: 'Access Movements Page' },
      ]
    },
    {
      title: 'Safety & HSE',
      fields: [
        { key: 'view_incidents', label: 'Access Incidents Page' },
        { key: 'view_maintenance', label: 'Access Site Maintenance' },
        { key: 'view_safety_drills', label: 'Access Safety Drills' },
        { key: 'view_first_aid', label: 'Access First Aid Log' },
      ]
    },
    {
      title: 'Staff & HR',
      fields: [
        { key: 'view_timesheets', label: 'Access Timesheets' },
        { key: 'view_holidays', label: 'Access Holidays' },
      ]
    },
    {
      title: 'Compliance & Reports',
      fields: [
        { key: 'view_missing_records', label: 'Access Missing Records' },
        { key: 'generate_reports', label: 'Generate System Reports' },
      ]
    },
    {
      title: 'Administration',
      fields: [
        { key: 'view_settings', label: 'Access System Settings' },
        { key: 'manage_access_control', label: 'Manage Access Control' },
      ]
    }
  ];

  const configurableRoles = [UserRole.SENIOR_KEEPER, UserRole.KEEPER, UserRole.VOLUNTEER];

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
      <div className="flex justify-between items-center border-b-2 border-slate-200 pb-6">
        <div>
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
            <Shield size={24} className="text-emerald-600" /> Staff Access Control
          </h3>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Manage system accounts and granular permissions</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setActiveTab('directory')}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${activeTab === 'directory' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
          >
            <Users size={14} /> Staff Directory
          </button>
          <button 
            onClick={() => setActiveTab('permissions')}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${activeTab === 'permissions' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
          >
            <Lock size={14} /> Role Permissions
          </button>
        </div>
      </div>

      {activeTab === 'directory' ? (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button 
              onClick={() => { setEditingUser(null); setIsModalOpen(true); }}
              className="bg-emerald-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 active:scale-95"
            >
              <Plus size={16} strokeWidth={3} /> Add Staff Member
            </button>
          </div>

          <div className="bg-white rounded-[2rem] border-2 border-slate-200 shadow-sm overflow-hidden">
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50 border-b-2 border-slate-100">
                    <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Staff Member</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">System Role</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {users.map(user => (
                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-5 whitespace-nowrap">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-black text-xs border-2 border-white shadow-sm">
                            {user.initials}
                          </div>
                          <div>
                            <div className="text-sm font-black text-slate-900">{user.name}</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getRoleBadgeColor(user.role)}`}>
                          {user.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => { setEditingUser(user); setIsModalOpen(true); }}
                          className="p-2 text-slate-400 hover:text-emerald-600 bg-white border border-slate-200 rounded-xl shadow-sm transition-all hover:shadow-md"
                          title="Edit Account"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteUser(user)}
                          className="p-2 text-slate-400 hover:text-rose-600 bg-white border border-slate-200 rounded-xl shadow-sm transition-all hover:shadow-md"
                          title="Delete Account"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <div className="p-20 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserIcon size={32} className="text-slate-300" />
                </div>
                <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">No Staff Accounts Found</h4>
                <p className="text-xs text-slate-400 mt-2">Create your first staff member to begin assigning access.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      ) : (
        <div className="bg-white rounded-[2rem] border-2 border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
          <div className="p-8 border-b-2 border-slate-100 bg-slate-50/50">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Permissions Matrix</h4>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Configure granular access levels for staff roles. Admin and Owner roles have absolute access.</p>
          </div>
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50 border-b-2 border-slate-100">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest min-w-[200px] whitespace-nowrap">Permission Flag</th>
                  {configurableRoles.map(role => (
                    <th key={role} className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center whitespace-nowrap">
                      {role.replace('_', ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {permissionGroups.map(group => (
                  <React.Fragment key={group.title}>
                    <tr className="bg-slate-100/50">
                      <td colSpan={configurableRoles.length + 1} className="px-8 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                        --- {group.title} ---
                      </td>
                    </tr>
                    {group.fields.map(field => (
                      <tr key={field.key} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-5 whitespace-nowrap">
                          <div className="text-sm font-black text-slate-900">{field.label}</div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{field.key}</div>
                        </td>
                        {configurableRoles.map(role => {
                          const config = allRolePermissions.find(p => p.role === role);
                          const isChecked = config ? !!(config as RolePermissionConfig)[field.key as keyof RolePermissionConfig] : false;
                          return (
                            <td key={role} className="px-8 py-5 text-center whitespace-nowrap">
                              <button
                                onClick={() => updateRolePermission(role, field.key as keyof RolePermissionConfig, !isChecked)}
                                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all border-2 ${
                                  isChecked 
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-600 shadow-inner' 
                                    : 'bg-slate-50 border-slate-100 text-slate-300 hover:border-slate-200 hover:text-slate-400'
                                }`}
                              >
                                {isChecked ? <Check size={20} strokeWidth={3} /> : <X size={16} />}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <UserFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveUser}
        initialData={editingUser}
      />
    </div>
  );
};

export default AccessControl;
