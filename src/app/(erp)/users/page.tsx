'use client';
import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  UserPlus,
  Key,
  CheckCircle2,
  Lock,
  Building,
  Trash2,
  Edit3,
  Copy,
  Check,
  Eye,
  EyeOff,
  Sparkles,
  Layers,
  LayoutDashboard,
  CheckSquare,
  Square,
  AlertCircle,
  RotateCcw,
  ExternalLink,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { StatCard } from '@/components/ui/StatCard';
import { DataTable } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { ALL_MODULES, DEPARTMENT_MODULE_MAP, ModuleCode } from '@/lib/auth/constants';

const ORGANIZATIONS = [
  'Proficient Transforms HQ',
  'Mysuru Regional Hub',
  'Bangalore Urban Division',
  'Hyderabad Operations Office',
];

const DASHBOARD_VIEWS = [
  { code: 'DASHBOARD', label: 'Executive Consolidated Dashboard' },
  { code: 'CRM', label: 'Sales & CRM Pipeline' },
  { code: 'PROJECTS', label: 'Project Portfolio & Milestones' },
  { code: 'CONSTRUCTION', label: 'Site Execution & DPR Hub' },
  { code: 'ACCOUNTS', label: 'Financial Accounts & General Ledger' },
  { code: 'HR', label: 'HR, Attendance & Payroll Hub' },
];

const DEMO_CREDENTIALS = [
  { role: 'Super Admin', u: 'admin', p: 'admin123', dept: 'All Departments', modules: '15 Modules (Full Access)' },
  { role: 'Sales & CRM', u: 'sales_user', p: 'sales123', dept: 'Sales', modules: 'Dashboard, CRM, Masters, Docs' },
  { role: 'Procurement Specialist', u: 'purchase_user', p: 'purchase123', dept: 'Purchase', modules: 'Dashboard, Procurement, Masters, Docs' },
  { role: 'Chief Accountant', u: 'accounts_user', p: 'accounts123', dept: 'Accounts', modules: 'Dashboard, Accounts, Reports, Masters, Docs' },
  { role: 'HR Administrator', u: 'hr_user', p: 'hr123', dept: 'HR', modules: 'Dashboard, HR, Users, Docs' },
  { role: 'Inventory Manager', u: 'inventory_user', p: 'inventory123', dept: 'Inventory', modules: 'Dashboard, Inventory, Masters, Docs' },
  { role: 'Operations Head', u: 'ops_user', p: 'ops123', dept: 'Operations', modules: 'Dashboard, Projects, Construction, Interiors, Land, Docs' },
];

export default function UsersPage() {
  const [activeTab, setActiveTab] = useState<'USERS' | 'MATRIX' | 'CREDS'>('USERS');
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected User for Individual Configuration Pop-up
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [copiedUser, setCopiedUser] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Modal Form State
  const [userForm, setUserForm] = useState({
    id: '',
    username: '',
    fullName: '',
    email: '',
    phone: '',
    password: '',
    departmentId: '',
    roleId: '',
    orgName: 'Proficient Transforms HQ',
    defaultDashboard: 'DASHBOARD',
    customModules: [] as string[],
    isActive: true,
  });

  const fetchData = useCallback(() => {
    fetch('/api/users')
      .then((r) => r.json())
      .then((d) => {
        setUsers(Array.isArray(d.users) ? d.users : []);
        setRoles(Array.isArray(d.roles) ? d.roles : []);
        setDepartments(Array.isArray(d.departments) ? d.departments : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Open User Configuration Pop-up (triggered on DOUBLE CLICK or Edit)
  function handleOpenUserModal(user: any) {
    let parsedModules: string[] = [];
    if (user.custom_modules) {
      try {
        parsedModules = JSON.parse(user.custom_modules);
      } catch {}
    }
    if (parsedModules.length === 0 && user.department_code && DEPARTMENT_MODULE_MAP[user.department_code]) {
      parsedModules = [...DEPARTMENT_MODULE_MAP[user.department_code]];
    }

    setUserForm({
      id: user.id,
      username: user.username,
      fullName: user.full_name,
      email: user.email,
      phone: user.phone || '',
      password: '',
      departmentId: user.department_id || (departments[0]?.id || ''),
      roleId: user.role_id || (roles[0]?.id || ''),
      orgName: user.org_name || 'Proficient Transforms HQ',
      defaultDashboard: user.default_dashboard || 'DASHBOARD',
      customModules: parsedModules,
      isActive: user.is_active === 1 || user.is_active === true,
    });
    setSelectedUser(user);
    setIsCreatingNew(false);
    setFormError(null);
    setFormSuccess(null);
    setShowPassword(false);
    setShowConfigModal(true);
  }

  // Open Create New User Pop-up
  function handleOpenCreateUser() {
    setUserForm({
      id: '',
      username: '',
      fullName: '',
      email: '',
      phone: '',
      password: generateRandomPassword(),
      departmentId: departments[0]?.id || '',
      roleId: roles[0]?.id || '',
      orgName: 'Proficient Transforms HQ',
      defaultDashboard: 'DASHBOARD',
      customModules: [...(DEPARTMENT_MODULE_MAP['SALES'] || ['DASHBOARD', 'CRM'])],
      isActive: true,
    });
    setSelectedUser(null);
    setIsCreatingNew(true);
    setFormError(null);
    setFormSuccess(null);
    setShowPassword(true);
    setShowConfigModal(true);
  }

  function generateRandomPassword() {
    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789!@#$%';
    let pass = '';
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
  }

  // Save User Configuration (Create or Patch)
  async function handleSaveUserConfig(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    try {
      if (isCreatingNew) {
        if (!userForm.username || !userForm.fullName || !userForm.email || !userForm.password) {
          throw new Error('Please fill in username, full name, email, and password');
        }
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userForm),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to create user');
        setFormSuccess('User account successfully created and permissions initialized!');
      } else {
        const payload: any = {
          id: userForm.id,
          fullName: userForm.fullName,
          email: userForm.email,
          phone: userForm.phone,
          departmentId: userForm.departmentId,
          roleId: userForm.roleId,
          orgName: userForm.orgName,
          defaultDashboard: userForm.defaultDashboard,
          customModules: userForm.customModules,
          isActive: userForm.isActive,
        };
        if (userForm.password.trim()) {
          payload.password = userForm.password;
        }

        const res = await fetch('/api/users', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update user');
        setFormSuccess('User configuration and module entitlements saved!');
      }

      fetchData();
      setTimeout(() => {
        setShowConfigModal(false);
      }, 900);
    } catch (err: any) {
      setFormError(err.message);
    }
  }

  async function handleToggleStatus(userId: string, currentStatus: number) {
    try {
      await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, isActive: currentStatus === 1 ? false : true }),
      });
      fetchData();
    } catch {}
  }

  // Toggle module access checkbox in form
  function handleToggleModule(moduleCode: string) {
    setUserForm((prev) => {
      const exists = prev.customModules.includes(moduleCode);
      const next = exists
        ? prev.customModules.filter((m) => m !== moduleCode)
        : [...prev.customModules, moduleCode];
      return { ...prev, customModules: next };
    });
  }

  // Toggle module access directly in the SaaS Matrix tab
  async function handleToggleMatrixModule(userId: string, moduleCode: string, currentModules: string[], deptCode: string) {
    let effective = currentModules.length > 0 ? [...currentModules] : [...(DEPARTMENT_MODULE_MAP[deptCode] || ['DASHBOARD'])];
    if (effective.includes(moduleCode)) {
      effective = effective.filter((m) => m !== moduleCode);
    } else {
      effective.push(moduleCode);
    }

    try {
      await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, customModules: effective }),
      });
      fetchData();
    } catch {}
  }

  function handleSelectAllModules() {
    setUserForm((prev) => ({ ...prev, customModules: [...ALL_MODULES] }));
  }

  function handleResetToDeptDefaults() {
    const dept = departments.find((d) => d.id === userForm.departmentId);
    const defaults = dept?.code && DEPARTMENT_MODULE_MAP[dept.code] ? [...DEPARTMENT_MODULE_MAP[dept.code]] : ['DASHBOARD'];
    setUserForm((prev) => ({ ...prev, customModules: defaults }));
  }

  function copyToClipboard(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedUser(id);
    setTimeout(() => setCopiedUser(null), 2000);
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              SaaS User Management &amp; Department Access Control
            </h1>
            <span className="text-[10px] font-mono bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full border border-blue-200">
              SUPER ADMIN CONSOLE
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure individual user organizations, department settlements, and SaaS module entitlement checkboxes. Double-click any user row to configure.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleOpenCreateUser} icon={<UserPlus className="w-4 h-4" />}>
            New User Account
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard label="Total Enterprise Users" value={`${users.length} Users`} subtext="Configured in SQLite" icon={<ShieldCheck className="w-4 h-4" />} />
        <StatCard label="Active Departments" value="6 Core Depts" subtext="Sales, Purchase, Accounts, HR, Inv, Ops" icon={<Building className="w-4 h-4" />} colorClass="text-blue-600" />
        <StatCard label="Multi-Tenant Orgs" value="4 Branches" subtext="HQ, Mysuru, Blr, Hyd" icon={<Layers className="w-4 h-4" />} colorClass="text-purple-600" />
        <StatCard label="Entitlement Engine" value="SaaS Granular" subtext="Checkbox Access Matrix" icon={<Lock className="w-4 h-4" />} colorClass="text-emerald-600" />
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex items-center justify-between">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('USERS')}
            className={`pb-3 text-xs font-bold transition-all relative ${
              activeTab === 'USERS'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            User Accounts Directory &amp; Setup ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('MATRIX')}
            className={`pb-3 text-xs font-bold transition-all relative ${
              activeTab === 'MATRIX'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            SaaS Module Access Matrix (Checkboxes)
          </button>
          <button
            onClick={() => setActiveTab('CREDS')}
            className={`pb-3 text-xs font-bold transition-all relative ${
              activeTab === 'CREDS'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Department Credentials &amp; 1-Click Fill
          </button>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-blue-600 font-medium bg-blue-50 border border-blue-200/60 px-2.5 py-1 rounded-full">
          <span>💡 Double-click any row to open user configuration</span>
        </div>
      </div>

      {/* TAB 1: USERS DIRECTORY */}
      {activeTab === 'USERS' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xs font-bold text-slate-800">Assigned Enterprise Users</h2>
              <p className="text-[11px] text-slate-500">
                Double-click any row to open their individual organization, department, and module popup.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-mono">Auto-sync with SQLite</span>
            </div>
          </div>
          <DataTable
            columns={[
              {
                key: 'username',
                header: 'User Account',
                render: (r: any) => (
                  <div>
                    <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-xs">
                      {r.username}
                    </span>
                    <div className="text-[10px] text-slate-400 mt-0.5">{r.email}</div>
                  </div>
                ),
              },
              {
                key: 'full_name',
                header: 'Full Name',
                render: (r: any) => (
                  <div>
                    <span className="font-semibold text-slate-800 text-xs">{r.full_name}</span>
                    {r.phone && <div className="text-[10px] text-slate-400">{r.phone}</div>}
                  </div>
                ),
              },
              {
                key: 'org_name',
                header: 'Organization / Branch',
                render: (r: any) => (
                  <span className="text-xs text-slate-700 font-medium bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {r.org_name || 'Proficient Transforms HQ'}
                  </span>
                ),
              },
              {
                key: 'department_name',
                header: 'Department',
                render: (r: any) => (
                  <Badge
                    variant={
                      r.department_code === 'SALES'
                        ? 'purple'
                        : r.department_code === 'PURCHASE'
                        ? 'warning'
                        : r.department_code === 'ACCOUNTS'
                        ? 'success'
                        : 'default'
                    }
                  >
                    {r.department_name || r.department_code || 'Operations'}
                  </Badge>
                ),
              },
              {
                key: 'roles',
                header: 'Assigned Role',
                render: (r: any) => (
                  <span className="text-xs font-medium text-slate-700">
                    {r.role_name || r.role_code || 'SUPER_ADMIN'}
                  </span>
                ),
              },
              {
                key: 'custom_modules',
                header: 'Module Entitlements',
                render: (r: any) => {
                  let count = 0;
                  if (r.custom_modules) {
                    try {
                      count = JSON.parse(r.custom_modules).length;
                    } catch {}
                  } else if (r.department_code && DEPARTMENT_MODULE_MAP[r.department_code]) {
                    count = DEPARTMENT_MODULE_MAP[r.department_code].length;
                  } else if (r.username === 'admin') {
                    count = 15;
                  }
                  return (
                    <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                      {count} / 15 Modules
                    </span>
                  );
                },
              },
              {
                key: 'is_active',
                header: 'Status',
                render: (r: any) => (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleStatus(r.id, r.is_active);
                    }}
                    className="cursor-pointer"
                    title="Click to toggle status"
                  >
                    <Badge variant={r.is_active ? 'success' : 'danger'}>
                      {r.is_active ? 'ACTIVE' : 'SUSPENDED'}
                    </Badge>
                  </button>
                ),
              },
              {
                key: 'actions',
                header: 'Actions',
                render: (r: any) => (
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleOpenUserModal(r)}
                      className="px-2 py-1 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded transition-colors flex items-center gap-1"
                      title="Configure User & SaaS Entitlements"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Configure</span>
                    </button>
                  </div>
                ),
              },
            ]}
            data={users}
            onRowDoubleClick={(row) => handleOpenUserModal(row)}
            doubleClickHint="Double-click to open user configuration and permissions"
            exportFileName="saas-users-directory"
            searchable
            searchPlaceholder="Search users by name, username, department, or organization..."
          />
        </div>
      )}

      {/* TAB 2: SAAS MODULE ACCESS MATRIX (CHECKBOXES) */}
      {activeTab === 'MATRIX' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xs font-bold text-slate-800">SaaS Granular Module Access Matrix</h2>
              <p className="text-[11px] text-slate-500">
                Click any checkbox to instantly grant or revoke module access for that user. Changes are persisted automatically.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500 font-mono">15 Core ERP Modules</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider">
                  <th className="px-4 py-3 sticky left-0 bg-slate-100 z-10 min-w-[180px]">User &amp; Dept</th>
                  {ALL_MODULES.map((m) => (
                    <th key={m} className="px-2 py-3 text-center min-w-[75px]" title={m}>
                      <span className="text-[10px]">{m.replace('_', ' ')}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => {
                  let effective: string[] = [];
                  if (u.custom_modules) {
                    try {
                      effective = JSON.parse(u.custom_modules);
                    } catch {}
                  } else if (u.department_code && DEPARTMENT_MODULE_MAP[u.department_code]) {
                    effective = DEPARTMENT_MODULE_MAP[u.department_code];
                  } else if (u.username === 'admin') {
                    effective = ALL_MODULES;
                  }

                  const isSuperAdminUser = u.username === 'admin';

                  return (
                    <tr key={u.id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="px-4 py-2.5 font-semibold text-slate-800 sticky left-0 bg-white hover:bg-blue-50/40 z-10 border-r border-slate-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-bold text-slate-900">{u.full_name}</div>
                            <div className="font-mono text-[10px] text-blue-600">@{u.username}</div>
                          </div>
                          <Badge variant="purple" className="text-[9px]">
                            {u.department_code || 'OPS'}
                          </Badge>
                        </div>
                      </td>
                      {ALL_MODULES.map((mod) => {
                        const isChecked = isSuperAdminUser || effective.includes(mod);
                        return (
                          <td key={mod} className="px-2 py-2.5 text-center">
                            <button
                              type="button"
                              disabled={isSuperAdminUser}
                              onClick={() => handleToggleMatrixModule(u.id, mod, effective, u.department_code)}
                              className={`p-1.5 rounded transition-all ${
                                isSuperAdminUser
                                  ? 'text-blue-600 opacity-60 cursor-not-allowed'
                                  : isChecked
                                  ? 'text-blue-600 hover:bg-blue-100'
                                  : 'text-slate-300 hover:text-slate-600 hover:bg-slate-100'
                              }`}
                              title={`${u.username} ${isChecked ? 'has access to' : 'does not have access to'} ${mod}`}
                            >
                              {isChecked ? (
                                <CheckSquare className="w-4 h-4 text-blue-600" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-300" />
                              )}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: DEPARTMENT CREDENTIALS & 1-CLICK ACCESS */}
      {activeTab === 'CREDS' && (
        <div className="space-y-4">
          <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-blue-900">Department Credential Directory &amp; Fast Switch</h3>
              <p className="text-[11px] text-blue-700 mt-0.5">
                Super Admins can copy credentials or test login with 1-click for each departmental persona.
              </p>
            </div>
            <a
              href="/login"
              target="_blank"
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              <span>Open Login Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {DEMO_CREDENTIALS.map((c) => (
              <div
                key={c.u}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:border-blue-400 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-900">{c.role}</span>
                    <Badge variant="purple">{c.dept}</Badge>
                  </div>
                  <div className="space-y-1.5 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 font-mono">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Username:</span>
                      <span className="font-bold text-blue-700">{c.u}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Password:</span>
                      <span className="text-slate-700">{c.p}</span>
                    </div>
                  </div>
                  <div className="mt-2.5 text-[11px] text-slate-500">
                    <strong>Allowed Scope:</strong> {c.modules}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                  <button
                    onClick={() => copyToClipboard(`${c.u} / ${c.p}`, c.u)}
                    className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                  >
                    {copiedUser === c.u ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span>Copy Creds</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      const user = users.find((u) => u.username === c.u);
                      if (user) handleOpenUserModal(user);
                    }}
                    className="py-1.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold transition-colors"
                  >
                    Configure
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* INDIVIDUAL USER SETUP & SAAS ENTITLEMENTS POP-UP MODAL */}
      {showConfigModal && (
        <Modal
          open={showConfigModal}
          onClose={() => setShowConfigModal(false)}
          title={isCreatingNew ? 'Create New User Account' : `Configure User: ${userForm.fullName || userForm.username}`}
          size="lg"
        >
          <form onSubmit={handleSaveUserConfig} className="space-y-5">
            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}
            {formSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-lg flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            {/* Section 1: User Identity */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                1. User Identity &amp; Credentials
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Username *</label>
                  <input
                    type="text"
                    value={userForm.username}
                    onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                    disabled={!isCreatingNew}
                    required
                    placeholder="e.g. j.sharma"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Legal Name *</label>
                  <input
                    type="text"
                    value={userForm.fullName}
                    onChange={(e) => setUserForm({ ...userForm, fullName: e.target.value })}
                    required
                    placeholder="e.g. Jagadish Sharma"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Work Email Address *</label>
                  <input
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    required
                    placeholder="e.g. j.sharma@proficienttransforms.com"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    value={userForm.phone}
                    onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                    placeholder="+91 98450 12345"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Password field with Generator */}
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    {isCreatingNew ? 'Initial Password *' : 'Reset / Change Password (Leave blank to keep current)'}
                  </label>
                  <button
                    type="button"
                    onClick={() => setUserForm({ ...userForm, password: generateRandomPassword() })}
                    className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Generate Strong Password</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    required={isCreatingNew}
                    placeholder={isCreatingNew ? 'Enter or generate password' : 'Enter new password to reset'}
                    className="w-full border border-slate-300 rounded-lg pl-3 pr-10 py-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Section 2: Organization & Department Settlement */}
            <div className="pt-3 border-t border-slate-200">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                2. Organization, Department &amp; Landing Settlement
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Operating Organization / Branch
                  </label>
                  <select
                    value={userForm.orgName}
                    onChange={(e) => setUserForm({ ...userForm, orgName: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  >
                    {ORGANIZATIONS.map((org) => (
                      <option key={org} value={org}>
                        {org}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Primary Department *
                  </label>
                  <select
                    value={userForm.departmentId}
                    onChange={(e) => {
                      const newDeptId = e.target.value;
                      const dept = departments.find((d) => d.id === newDeptId);
                      const defaults = dept?.code && DEPARTMENT_MODULE_MAP[dept.code] ? [...DEPARTMENT_MODULE_MAP[dept.code]] : ['DASHBOARD'];
                      setUserForm({
                        ...userForm,
                        departmentId: newDeptId,
                        customModules: defaults,
                      });
                    }}
                    required
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Assigned Role
                  </label>
                  <select
                    value={userForm.roleId}
                    onChange={(e) => setUserForm({ ...userForm, roleId: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Default Landing Dashboard
                  </label>
                  <select
                    value={userForm.defaultDashboard}
                    onChange={(e) => setUserForm({ ...userForm, defaultDashboard: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  >
                    {DASHBOARD_VIEWS.map((dv) => (
                      <option key={dv.code} value={dv.code}>
                        {dv.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Section 3: SaaS Module Entitlement Checkboxes */}
            <div className="pt-3 border-t border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    3. SaaS Module Entitlements ({userForm.customModules.length} / 15 Selected)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Select exactly which module tabs this user will see in their sidebar navigation.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAllModules}
                    className="text-[10px] text-blue-600 hover:underline font-semibold"
                  >
                    Select All
                  </button>
                  <span className="text-slate-300">·</span>
                  <button
                    type="button"
                    onClick={handleResetToDeptDefaults}
                    className="text-[10px] text-slate-500 hover:underline font-medium"
                  >
                    Dept Defaults
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                {ALL_MODULES.map((mod) => {
                  const isChecked = userForm.customModules.includes(mod);
                  return (
                    <label
                      key={mod}
                      onClick={() => handleToggleModule(mod)}
                      className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-all select-none ${
                        isChecked
                          ? 'bg-blue-50/80 border-blue-400 text-blue-900 font-semibold'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-blue-600 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-300 shrink-0" />
                      )}
                      <span className="truncate">{mod.replace('_', ' ')}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Section 4: Status and Action Buttons */}
            <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={userForm.isActive}
                  onChange={(e) => setUserForm({ ...userForm, isActive: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                <span className="text-xs font-semibold text-slate-700">User Account Active</span>
              </label>

              <div className="flex items-center gap-2">
                <Button variant="outline" type="button" onClick={() => setShowConfigModal(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {isCreatingNew ? 'Create User' : 'Save Configuration'}
                </Button>
              </div>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
