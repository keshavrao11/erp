'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, UserPlus, Key, CheckCircle2, Lock, Building, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { StatCard } from '@/components/ui/StatCard';
import { DataTable } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [form, setForm] = useState({
    username: '',
    fullName: '',
    email: '',
    phone: '',
    password: '',
    departmentId: '',
    roleId: '',
  });

  const fetchData = useCallback(() => {
    fetch('/api/users')
      .then(r => r.json())
      .then(d => {
        setUsers(Array.isArray(d.users) ? d.users : []);
        setRoles(Array.isArray(d.roles) ? d.roles : []);
        setDepartments(Array.isArray(d.departments) ? d.departments : []);
        if (d.departments?.length > 0 && !form.departmentId) {
          setForm(prev => ({
            ...prev,
            departmentId: d.departments[0].id,
            roleId: d.roles?.[0]?.id || '',
          }));
        }
      })
      .catch(() => {});
  }, [form.departmentId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create user');
      }
      setShowModal(false);
      setForm({ username: '', fullName: '', email: '', phone: '', password: '', departmentId: departments[0]?.id || '', roleId: roles[0]?.id || '' });
      fetchData();
    } catch (err: any) {
      setFormError(err.message);
    }
  }

  async function handleToggleUserStatus(userId: string, currentStatus: number) {
    try {
      await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, isActive: currentStatus === 1 ? false : true }),
      });
      fetchData();
    } catch {}
  }

  const rolesMatrix = [
    { role: 'Super Admin', code: 'SUPER_ADMIN', dept: 'All Departments', desc: 'Unrestricted enterprise control & database admin', limit: 'Unlimited' },
    { role: 'Sales Lead', code: 'CRM', dept: 'Sales', desc: 'Customer leads, site visits & quotation builder', limit: '₹50 L' },
    { role: 'Purchase Exec', code: 'PURCHASE_EXECUTIVE', dept: 'Purchase', desc: 'Material requisitions, PO creation & GRN inward', limit: '₹1 Cr' },
    { role: 'Accountant', code: 'ACCOUNTANT', dept: 'Accounts', desc: 'General ledger vouchers, trial balance & reconciliation', limit: '₹5 Cr' },
    { role: 'HR Admin', code: 'HR_ADMIN', dept: 'HR', desc: 'Employee records, shift attendance & payroll runs', limit: '₹1 Cr' },
    { role: 'Stores Manager', code: 'INVENTORY_MANAGER', dept: 'Inventory', desc: 'Stock ledger, material issues & safety thresholds', limit: '₹50 L' },
    { role: 'Operations Head', code: 'PROJECT_MANAGER', dept: 'Operations', desc: 'Milestones, DPR approvals & construction oversight', limit: '₹2.5 Cr' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Security & Role-Based Access Control (RBAC)</h1>
          <p className="text-xs text-slate-500">
            Multi-dimensional server RBAC checking department, module, and role-level authorization boundaries
          </p>
        </div>
        <Button onClick={() => setShowModal(true)} icon={<UserPlus className="w-4 h-4" />}>
          Create User Account
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard label="Active User Accounts" value={`${users.length} Users`} subtext="Assigned by Department" icon={<ShieldCheck className="w-4 h-4" />} />
        <StatCard label="Department Workspaces" value="6 Core Depts" subtext="Sales, Purchase, Accounts, HR, Inv, Ops" icon={<Building className="w-4 h-4" />} colorClass="text-blue-600" />
        <StatCard label="System RBAC Roles" value={`${roles.length} Roles`} subtext="Hierarchical Permissions" icon={<Lock className="w-4 h-4" />} colorClass="text-purple-600" />
        <StatCard label="Audit Logging" value="SQLite Triggers" subtext="Immutable Ledger Entries" icon={<Key className="w-4 h-4" />} colorClass="text-emerald-600" />
      </div>

      {/* Users List */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800">User Accounts Directory ({users.length})</span>
          <Badge variant="success">All Department Accounts Ready</Badge>
        </div>
        <DataTable
          columns={[
            {
              key: 'username',
              header: 'Username',
              render: (r: any) => (
                <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-xs">
                  {r.username}
                </span>
              ),
            },
            { key: 'full_name', header: 'Full Name', render: (r: any) => <span className="font-semibold text-slate-800 text-xs">{r.full_name}</span> },
            { key: 'email', header: 'Email Address', render: (r: any) => <span className="text-xs text-slate-600">{r.email}</span> },
            {
              key: 'department_name',
              header: 'Department',
              render: (r: any) => (
                <Badge variant={r.department_code === 'SALES' ? 'purple' : r.department_code === 'PURCHASE' ? 'warning' : r.department_code === 'ACCOUNTS' ? 'success' : 'default'}>
                  {r.department_code || 'OPERATIONS'}
                </Badge>
              ),
            },
            { key: 'roles', header: 'Assigned Role', render: (r: any) => <span className="text-xs font-medium text-slate-700">{r.role_code || r.roles || 'SUPER_ADMIN'}</span> },
            {
              key: 'is_active',
              header: 'Status',
              render: (r: any) => (
                <button
                  onClick={() => handleToggleUserStatus(r.id, r.is_active)}
                  className="cursor-pointer"
                  title="Click to toggle active status"
                >
                  <Badge variant={r.is_active ? 'success' : 'danger'}>
                    {r.is_active ? 'ACTIVE' : 'SUSPENDED'}
                  </Badge>
                </button>
              ),
            },
          ]}
          data={users}
          exportFileName="erp-users-directory"
          searchable
          searchPlaceholder="Search users by name, username, or department..."
        />
      </div>

      {/* 10 Enterprise Roles Matrix */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50">
          <h3 className="text-xs font-bold text-slate-800">Department & Role Permission Hierarchy</h3>
        </div>
        <DataTable
          columns={[
            { key: 'code', header: 'Role Code', render: (r: any) => <span className="font-mono font-bold text-xs">{r.code}</span> },
            { key: 'role', header: 'Role Title', render: (r: any) => <span className="font-semibold text-slate-800 text-xs">{r.role}</span> },
            { key: 'dept', header: 'Department Scope', render: (r: any) => <Badge variant="purple">{r.dept}</Badge> },
            { key: 'desc', header: 'Functional Scope', render: (r: any) => <span className="text-xs text-slate-600">{r.desc}</span> },
            { key: 'limit', header: 'Approval Ceiling', render: (r: any) => <span className="font-mono font-bold text-emerald-700 text-xs">{r.limit}</span> },
          ]}
          data={rolesMatrix}
          exportFileName="rbac-role-matrix"
        />
      </div>

      {/* New User Modal */}
      {showModal && (
        <Modal open={showModal} onClose={() => setShowModal(false)} title="Create New Department User Account" size="md">
          <form onSubmit={handleCreateUser} className="space-y-4">
            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Username *</label>
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  required
                  placeholder="e.g. j.sharma"
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  required
                  placeholder="e.g. Jyothi Sharma"
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  placeholder="user@proficienterp.com"
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Temporary Password *</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  placeholder="Secure password (hashed with Argon2)"
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Department *</label>
                <select
                  value={form.departmentId}
                  onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-blue-500"
                >
                  {departments.map((d: any) => (
                    <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">RBAC Role *</label>
                <select
                  value={form.roleId}
                  onChange={(e) => setForm({ ...form, roleId: e.target.value })}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-blue-500"
                >
                  {roles.map((r: any) => (
                    <option key={r.id} value={r.id}>{r.name} ({r.code})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button type="submit">Create Hashed Account</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
