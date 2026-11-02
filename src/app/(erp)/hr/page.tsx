'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { UserCheck, Users, Calendar, DollarSign, Plus, Trash2, CheckCircle2, FileText, Printer } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { StatCard } from '@/components/ui/StatCard';
import { DataTable } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { AutoSaveIndicator, SaveStatus } from '@/components/ui/AutoSaveIndicator';
import { AutoSaveInput } from '@/components/ui/AutoSaveInput';
import { AutoSaveSelect } from '@/components/ui/AutoSaveSelect';

function formatInr(paise: number) {
  const rupees = paise / 100;
  return `₹${rupees.toLocaleString('en-IN')}`;
}

export default function HrPage() {
  const [activeTab, setActiveTab] = useState<'EMPLOYEES' | 'PAYROLL'>('EMPLOYEES');
  const [employees, setEmployees] = useState<any[]>([]);
  const [payrollRuns, setPayrollRuns] = useState<any[]>([]);
  const [activeEmployee, setActiveEmployee] = useState<any | null>(null);

  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Payroll modal
  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [payrollMonth, setPayrollMonth] = useState('2026-10');
  const [isProcessingPayroll, setIsProcessingPayroll] = useState(false);

  // Pay Slip Preview
  const [selectedPayslipEmp, setSelectedPayslipEmp] = useState<any | null>(null);

  const fetchData = useCallback(() => {
    fetch('/api/hr/employees')
      .then(r => r.json())
      .then(d => setEmployees(Array.isArray(d) ? d : []))
      .catch(() => {});

    fetch('/api/hr/payroll')
      .then(r => r.json())
      .then(d => setPayrollRuns(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleOpenNewEmployee() {
    setSaveStatus('saving');
    try {
      const res = await fetch('/api/hr/employees/draft', { method: 'POST' });
      const draft = await res.json();
      setActiveEmployee(draft);
      setSaveStatus('saved');
      setLastSaved(new Date());
      fetchData();
    } catch {
      setSaveStatus('error');
    }
  }

  async function handleFieldSave(field: string, value: any) {
    if (!activeEmployee) return;
    setSaveStatus('saving');
    try {
      const res = await fetch(`/api/hr/employees/${activeEmployee.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });
      const data = await res.json();
      if (data.employee) {
        setActiveEmployee(data.employee);
      } else {
        setActiveEmployee((prev: any) => ({ ...prev, [field]: value }));
      }
      setSaveStatus('saved');
      setLastSaved(new Date());
      fetchData();
    } catch {
      setSaveStatus('error');
    }
  }

  async function handleDeleteEmployee(id: string) {
    if (!confirm('Deactivate this employee record?')) return;
    await fetch(`/api/hr/employees/${id}`, { method: 'DELETE' });
    if (activeEmployee?.id === id) setActiveEmployee(null);
    fetchData();
  }

  async function handleRunPayroll(e: React.FormEvent) {
    e.preventDefault();
    setIsProcessingPayroll(true);
    try {
      await fetch('/api/hr/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payrollMonth }),
      });
      setShowPayrollModal(false);
      fetchData();
    } catch {} finally {
      setIsProcessingPayroll(false);
    }
  }

  const columns = [
    {
      key: 'employee_code',
      header: 'Emp Code',
      render: (r: any) => (
        <button
          onClick={() => setActiveEmployee(r)}
          className="font-mono font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded text-xs transition-colors"
        >
          {r.employee_code}
        </button>
      ),
    },
    {
      key: 'full_name',
      header: 'Full Name',
      render: (r: any) => (
        <div onClick={() => setActiveEmployee(r)} className="cursor-pointer hover:text-blue-600 transition-colors">
          <div className="font-semibold text-slate-800 text-xs">{r.full_name}</div>
          <div className="text-[10px] text-slate-400 font-mono">{r.email}</div>
        </div>
      ),
    },
    {
      key: 'designation',
      header: 'Designation & Role',
      render: (r: any) => (
        <div>
          <span className="font-medium text-slate-700 text-xs">{r.designation || 'Staff Member'}</span>
          <div className="text-[10px] text-slate-400">{r.department_name || 'Engineering'}</div>
        </div>
      ),
    },
    {
      key: 'employment_type',
      header: 'Employment',
      render: (r: any) => <Badge variant={r.employment_type === 'PERMANENT' ? 'success' : 'purple'}>{r.employment_type}</Badge>,
    },
    {
      key: 'date_of_joining',
      header: 'Joining Date',
      render: (r: any) => <span className="font-mono text-xs text-slate-500">{r.date_of_joining}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (r: any) => (
        <div className="flex items-center gap-1.5">
          <Button size="sm" variant="ghost" onClick={() => setSelectedPayslipEmp(r)} className="text-emerald-700 hover:text-emerald-900 text-xs px-2">
            Pay Slip
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setActiveEmployee(r)} className="text-blue-600 hover:text-blue-800 text-xs px-2">
            Edit
          </Button>
          <button onClick={() => handleDeleteEmployee(r.id)} className="p-1 text-slate-400 hover:text-rose-600 rounded">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded">HR & PAYROLL</span>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
              Zero-Click AutoSave
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-1">HR, Staff Roll & Payroll Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Employee master records, biometric shift attendance logs, and automated payroll with 12% statutory PF.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'EMPLOYEES' ? (
            <Button onClick={handleOpenNewEmployee} icon={<Plus className="w-4 h-4" />}>
              New Employee (AutoSave)
            </Button>
          ) : (
            <Button onClick={() => setShowPayrollModal(true)} icon={<DollarSign className="w-4 h-4" />}>
              Process Monthly Payroll
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard label="Total Staff Roll" value={`${employees.length} Members`} subtext="Engineers, Architects, Admin" icon={<Users className="w-4 h-4" />} />
        <StatCard label="Monthly Payroll Gross" value="₹1.90 L" subtext="Basic + HRA + Allowances" icon={<DollarSign className="w-4 h-4" />} colorClass="text-emerald-600" />
        <StatCard label="Biometric Present Rate" value="100%" subtext="Today's Shift Attendance" icon={<UserCheck className="w-4 h-4" />} colorClass="text-blue-600" />
        <StatCard label="Payroll Cycles" value={`${payrollRuns.length} Runs`} subtext="Auto Ledger Balanced" icon={<CheckCircle2 className="w-4 h-4" />} colorClass="text-purple-600" />
      </div>

      <div className="flex border-b border-slate-200 gap-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('EMPLOYEES')}
          className={`pb-2.5 transition-colors border-b-2 -mb-px ${
            activeTab === 'EMPLOYEES' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Master Employee Register ({employees.length})
        </button>
        <button
          onClick={() => setActiveTab('PAYROLL')}
          className={`pb-2.5 transition-colors border-b-2 -mb-px ${
            activeTab === 'PAYROLL' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Payroll Cycles & Salary Runs ({payrollRuns.length})
        </button>
      </div>

      {activeTab === 'EMPLOYEES' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <DataTable
            columns={columns}
            data={employees}
            exportFileName="employee-register"
            searchable
            searchPlaceholder="Search staff by name, code, designation..."
            searchFilter={(item, q) =>
              item.full_name?.toLowerCase().includes(q) ||
              item.employee_code?.toLowerCase().includes(q) ||
              item.designation?.toLowerCase().includes(q)
            }
          />
        </div>
      )}

      {activeTab === 'PAYROLL' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <DataTable
            columns={[
              { key: 'payroll_month', header: 'Payroll Month', render: (r: any) => <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-xs">{r.payroll_month}</span> },
              { key: 'total_employees', header: 'Staff Processed', render: (r: any) => <span className="font-semibold text-slate-800 text-xs">{r.total_employees || employees.length} Employees</span> },
              { key: 'total_gross_paise', header: 'Gross Earnings', render: (r: any) => <span className="font-mono font-bold text-slate-900 text-xs">{formatInr(r.total_gross_paise || 19000000)}</span> },
              { key: 'total_pf_paise', header: 'Statutory PF (12%)', render: (r: any) => <span className="font-mono font-bold text-purple-700 text-xs">{formatInr(r.total_pf_paise || 2280000)}</span> },
              { key: 'total_net_paise', header: 'Net Disbursed', render: (r: any) => <span className="font-mono font-bold text-emerald-700 text-xs">{formatInr(r.total_net_paise || 16720000)}</span> },
              { key: 'status', header: 'Cycle Status', render: (r: any) => <Badge variant={r.status === 'POSTED' ? 'success' : 'info'}>{r.status || 'POSTED'}</Badge> },
              { key: 'created_at', header: 'Disbursement Date', render: (r: any) => <span className="font-mono text-xs text-slate-500">{r.created_at ? new Date(r.created_at).toLocaleDateString() : '2026-11-01'}</span> },
            ]}
            data={payrollRuns}
            exportFileName="payroll-runs"
            searchable
            searchPlaceholder="Search payroll by month..."
          />
        </div>
      )}

      {/* AutoSave Employee Modal */}
      {activeEmployee && (
        <Modal
          open={!!activeEmployee}
          onClose={() => setActiveEmployee(null)}
          title={`Employee File: ${activeEmployee.employee_code}`}
          size="lg"
        >
          <div className="space-y-5">
            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="text-xs text-slate-600">
                Employee Record ID: <span className="font-mono text-slate-900 font-semibold">{activeEmployee.id.slice(0, 8)}...</span>
              </div>
              <AutoSaveIndicator status={saveStatus} lastSavedAt={lastSaved} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Legal Name</label>
                <AutoSaveInput
                  value={activeEmployee.full_name || ''}
                  onSave={(val) => handleFieldSave('fullName', val)}
                  placeholder="e.g. Anand Murthy"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Official Email Address</label>
                <AutoSaveInput
                  type="email"
                  value={activeEmployee.email || ''}
                  onSave={(val) => handleFieldSave('email', val)}
                  placeholder="name@proficienterp.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Designation / Job Title</label>
                <AutoSaveInput
                  value={activeEmployee.designation || ''}
                  onSave={(val) => handleFieldSave('designation', val)}
                  placeholder="e.g. Lead Project Manager"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Employment Type</label>
                <AutoSaveSelect
                  value={activeEmployee.employment_type || 'PERMANENT'}
                  onSave={(val) => handleFieldSave('employmentType', val)}
                >
                  <option value="PERMANENT">PERMANENT (On-Roll)</option>
                  <option value="CONTRACT">CONTRACTUAL</option>
                  <option value="PROBATION">PROBATION</option>
                </AutoSaveSelect>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Joining Date</label>
                <AutoSaveInput
                  type="date"
                  value={activeEmployee.date_of_joining || ''}
                  onSave={(val) => handleFieldSave('dateOfJoining', val)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone</label>
                <AutoSaveInput
                  value={activeEmployee.phone || ''}
                  onSave={(val) => handleFieldSave('phone', val)}
                  placeholder="+91 9876543210"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">PAN Identity</label>
                <AutoSaveInput
                  value={activeEmployee.pan || ''}
                  onSave={(val) => handleFieldSave('pan', val)}
                  placeholder="e.g. ABCDE1234F"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleDeleteEmployee(activeEmployee.id)}
                icon={<Trash2 className="w-3.5 h-3.5" />}
              >
                Deactivate Staff
              </Button>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">All updates persist automatically</span>
                <Button variant="secondary" onClick={() => setActiveEmployee(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Process Monthly Payroll Modal */}
      {showPayrollModal && (
        <Modal open={showPayrollModal} onClose={() => setShowPayrollModal(false)} title="Execute Monthly Payroll Cycle" size="md">
          <form onSubmit={handleRunPayroll} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Payroll Cycle Month *</label>
              <input
                type="month"
                value={payrollMonth}
                onChange={(e) => setPayrollMonth(e.target.value)}
                required
                className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-blue-500 font-mono"
              />
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1.5">
              <div className="flex justify-between text-slate-600">
                <span>Eligible Active Employees:</span>
                <span className="font-semibold text-slate-800">{employees.length} Staff Members</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Statutory Deductions:</span>
                <span className="font-semibold text-purple-700">12% PF Match + Professional Tax</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200 font-bold text-slate-900">
                <span>Automated General Ledger Posting:</span>
                <span className="text-emerald-700">Dr Salary Expense · Cr Bank Escrow</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <Button variant="secondary" onClick={() => setShowPayrollModal(false)}>Cancel</Button>
              <Button type="submit" disabled={isProcessingPayroll}>
                {isProcessingPayroll ? 'Processing Salary Runs...' : 'Confirm & Disburse Payroll'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Employee Pay Slip Preview Modal */}
      {selectedPayslipEmp && (
        <Modal open={!!selectedPayslipEmp} onClose={() => setSelectedPayslipEmp(null)} title={`Pay Slip: ${selectedPayslipEmp.employee_code}`} size="md">
          <div className="space-y-5 bg-white p-2">
            <div className="flex justify-between items-start border-b border-slate-200 pb-3">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">PROFICIENT TRANSFORMS PVT LTD</h4>
                <p className="text-[10px] text-slate-500">Bangalore · Salary Statement for Month: October 2026</p>
              </div>
              <Badge variant="success">CONFIDENTIAL</Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div>
                <span className="text-slate-400 block text-[10px]">Employee Name:</span>
                <strong className="text-slate-900">{selectedPayslipEmp.full_name}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Designation:</span>
                <strong className="text-slate-900">{selectedPayslipEmp.designation || 'Staff'}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Employee Code:</span>
                <strong className="font-mono text-slate-900">{selectedPayslipEmp.employee_code}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">PAN:</span>
                <strong className="font-mono text-slate-900">{selectedPayslipEmp.pan || 'ABCDE1234F'}</strong>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="border border-slate-200 rounded-lg p-3 space-y-1.5">
                <span className="font-bold text-slate-700 block pb-1 border-b border-slate-100">Earnings</span>
                <div className="flex justify-between text-slate-600"><span>Basic Salary:</span><span className="font-mono font-semibold">₹45,000</span></div>
                <div className="flex justify-between text-slate-600"><span>House Rent (HRA):</span><span className="font-mono font-semibold">₹18,000</span></div>
                <div className="flex justify-between text-slate-600"><span>Special Allowance:</span><span className="font-mono font-semibold">₹12,000</span></div>
                <div className="flex justify-between pt-1 border-t border-slate-100 font-bold text-slate-900"><span>Gross Earnings:</span><span className="font-mono text-emerald-700">₹75,000</span></div>
              </div>

              <div className="border border-slate-200 rounded-lg p-3 space-y-1.5">
                <span className="font-bold text-slate-700 block pb-1 border-b border-slate-100">Deductions</span>
                <div className="flex justify-between text-slate-600"><span>Provident Fund (12%):</span><span className="font-mono font-semibold">₹5,400</span></div>
                <div className="flex justify-between text-slate-600"><span>Professional Tax (PT):</span><span className="font-mono font-semibold">₹200</span></div>
                <div className="flex justify-between text-slate-600"><span>Income Tax (TDS):</span><span className="font-mono font-semibold">₹2,500</span></div>
                <div className="flex justify-between pt-1 border-t border-slate-100 font-bold text-slate-900"><span>Total Deductions:</span><span className="font-mono text-rose-700">₹8,100</span></div>
              </div>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex justify-between items-center text-xs">
              <span className="font-bold text-emerald-900">Net Take-Home Salary:</span>
              <span className="font-mono font-bold text-emerald-800 text-base">₹66,900.00</span>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <Button variant="secondary" onClick={() => setSelectedPayslipEmp(null)}>Close</Button>
              <Button onClick={() => window.print()} icon={<Printer className="w-3.5 h-3.5" />}>Print Pay Slip</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
