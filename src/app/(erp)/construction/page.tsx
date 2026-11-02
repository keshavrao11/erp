'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { HardHat, FileSpreadsheet, Users, Hammer, Plus, Trash2, CheckCircle2, Calendar, FileText, AlertCircle } from 'lucide-react';
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
  if (rupees >= 10000000) return `₹${(rupees / 10000000).toFixed(2)} Cr`;
  if (rupees >= 100000) return `₹${(rupees / 100000).toFixed(2)} L`;
  return `₹${rupees.toLocaleString('en-IN')}`;
}

export default function ConstructionPage() {
  const [activeTab, setActiveTab] = useState<'BOQ' | 'DPR' | 'LABOUR' | 'CONTRACTORS'>('BOQ');
  const [boqItems, setBoqItems] = useState<any[]>([]);
  const [dprs, setDprs] = useState<any[]>([]);
  const [labourLogs, setLabourLogs] = useState<any[]>([]);
  const [contractorData, setContractorData] = useState<{ contractors: any[]; bills: any[] }>({ contractors: [], bills: [] });

  // BOQ Modal
  const [activeBoq, setActiveBoq] = useState<any | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // New DPR Modal
  const [showDprModal, setShowDprModal] = useState(false);
  const [dprForm, setDprForm] = useState({
    weather: 'Clear, 29°C',
    progress: 40,
    summary: '',
    status: 'SUBMITTED',
  });

  // New Labour Modal
  const [showLabourModal, setShowLabourModal] = useState(false);
  const [labourForm, setLabourForm] = useState({
    tradeCategory: 'MASON',
    contractorName: 'Cauvery Civil Works',
    countPresent: 10,
    wagesPerDayRupees: 950,
  });

  // New Contractor Bill Modal
  const [showBillModal, setShowBillModal] = useState(false);
  const [billForm, setBillForm] = useState({
    contractorId: '',
    grossRupees: 250000,
  });

  const fetchData = useCallback(() => {
    fetch('/api/construction/boq')
      .then(r => r.json())
      .then(d => setBoqItems(Array.isArray(d) ? d : []))
      .catch(() => {});

    fetch('/api/construction/dpr')
      .then(r => r.json())
      .then(d => setDprs(Array.isArray(d) ? d : []))
      .catch(() => {});

    fetch('/api/construction/labour')
      .then(r => r.json())
      .then(d => setLabourLogs(Array.isArray(d) ? d : []))
      .catch(() => {});

    fetch('/api/construction/contractors')
      .then(r => r.json())
      .then(d => {
        if (d.bills) setContractorData(d);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // BOQ Actions
  async function handleAddBoq() {
    setSaveStatus('saving');
    try {
      const res = await fetch('/api/construction/boq', { method: 'POST' });
      const item = await res.json();
      setActiveBoq(item);
      setSaveStatus('saved');
      setLastSaved(new Date());
      fetchData();
    } catch {
      setSaveStatus('error');
    }
  }

  async function handleBoqFieldSave(field: string, value: any) {
    if (!activeBoq) return;
    setSaveStatus('saving');
    try {
      const res = await fetch('/api/construction/boq', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: activeBoq.id, [field]: value }),
      });
      const data = await res.json();
      if (data.item) {
        setActiveBoq(data.item);
      } else {
        setActiveBoq((prev: any) => ({ ...prev, [field]: value }));
      }
      setSaveStatus('saved');
      setLastSaved(new Date());
      fetchData();
    } catch {
      setSaveStatus('error');
    }
  }

  async function handleDeleteBoq(id: string) {
    if (!confirm('Delete this BOQ package item?')) return;
    await fetch(`/api/construction/boq?id=${id}`, { method: 'DELETE' });
    if (activeBoq?.id === id) setActiveBoq(null);
    fetchData();
  }

  // DPR Submission
  async function handleSaveDpr(e: React.FormEvent) {
    e.preventDefault();
    try {
      await fetch('/api/construction/dpr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weather: dprForm.weather,
          overallProgressPercent: Number(dprForm.progress),
          summary: dprForm.summary,
          status: dprForm.status,
        }),
      });
      setShowDprModal(false);
      setDprForm({ weather: 'Clear, 29°C', progress: 40, summary: '', status: 'SUBMITTED' });
      fetchData();
    } catch {}
  }

  // Labour Submission
  async function handleSaveLabour(e: React.FormEvent) {
    e.preventDefault();
    try {
      await fetch('/api/construction/labour', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(labourForm),
      });
      setShowLabourModal(false);
      fetchData();
    } catch {}
  }

  // Contractor Bill Submission
  async function handleSaveContractorBill(e: React.FormEvent) {
    e.preventDefault();
    try {
      await fetch('/api/construction/contractors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(billForm),
      });
      setShowBillModal(false);
      fetchData();
    } catch {}
  }

  const totalLabourHeads = labourLogs.reduce((s, l) => s + (l.count_present || 0), 0);
  const totalLabourWages = labourLogs.reduce((s, l) => s + (l.total_wages_paise || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded">CONSTRUCTION</span>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
              Zero-Click AutoSave
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-1">
            Construction Management & Site Operations
          </h1>
          <p className="text-xs text-slate-500">
            Bill of Quantities (BOQ), Daily Progress Reports (DPR), site labor attendance, and contractor billing sheets
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'BOQ' && (
            <Button size="sm" onClick={handleAddBoq} icon={<Plus className="w-4 h-4" />}>
              Add BOQ Item (AutoSave)
            </Button>
          )}
          {activeTab === 'DPR' && (
            <Button size="sm" onClick={() => setShowDprModal(true)} icon={<Plus className="w-4 h-4" />}>
              Log Daily Progress (DPR)
            </Button>
          )}
          {activeTab === 'LABOUR' && (
            <Button size="sm" onClick={() => setShowLabourModal(true)} icon={<Plus className="w-4 h-4" />}>
              Record Labour Attendance
            </Button>
          )}
          {activeTab === 'CONTRACTORS' && (
            <Button size="sm" onClick={() => setShowBillModal(true)} icon={<Plus className="w-4 h-4" />}>
              Generate Contractor Bill
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard label="Physical Milestone" value="38.5%" subtext="Plinth Stage Complete" icon={<HardHat className="w-4 h-4" />} colorClass="text-blue-600" />
        <StatCard label="Total BOQ Packages" value={`${boqItems.length} Packages`} subtext="Civil & Structural" icon={<FileSpreadsheet className="w-4 h-4" />} />
        <StatCard label="Daily Site Manpower" value={`${totalLabourHeads || 42} Workers`} subtext={`Total: ${formatInr(totalLabourWages || 3460000)}`} icon={<Users className="w-4 h-4" />} colorClass="text-emerald-600" />
        <StatCard label="Contractor Bills" value={`${contractorData.bills.length} Bills`} subtext="With 2% TDS & 5% Retention" icon={<Hammer className="w-4 h-4" />} colorClass="text-amber-600" />
      </div>

      <div className="flex border-b border-slate-200 gap-6 text-xs font-semibold">
        {(['BOQ', 'DPR', 'LABOUR', 'CONTRACTORS'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2.5 transition-colors border-b-2 -mb-px ${
              activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab === 'BOQ'
              ? `Bill of Quantities (${boqItems.length})`
              : tab === 'DPR'
              ? `Daily Progress Reports (${dprs.length})`
              : tab === 'LABOUR'
              ? `Labour Headcount & Wages (${labourLogs.length})`
              : `Contractor Bills (${contractorData.bills.length})`}
          </button>
        ))}
      </div>

      {/* BOQ Tab */}
      {activeTab === 'BOQ' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <DataTable
            columns={[
              {
                key: 'work_package',
                header: 'Work Package',
                render: (r) => (
                  <button onClick={() => setActiveBoq(r)} className="font-semibold text-slate-800 hover:text-blue-600 text-xs text-left">
                    {r.work_package}
                  </button>
                ),
              },
              { key: 'description', header: 'Scope Description', render: (r) => <span className="text-xs text-slate-600 truncate max-w-xs">{r.description}</span> },
              { key: 'unit', header: 'Unit', render: (r) => <span className="font-mono text-xs">{r.unit}</span> },
              { key: 'quantity', header: 'Quantity', render: (r) => <span className="font-mono font-medium text-xs">{r.quantity}</span> },
              { key: 'rate_paise', header: 'Rate/Unit', render: (r) => <span className="font-mono text-xs">{formatInr(r.rate_paise)}</span> },
              { key: 'amount_paise', header: 'Total Value', render: (r) => <span className="font-mono font-bold text-slate-900 text-xs">{formatInr(r.amount_paise)}</span> },
              {
                key: 'actions',
                header: 'Actions',
                render: (r) => (
                  <div className="flex items-center gap-1.5">
                    <Button size="sm" variant="ghost" onClick={() => setActiveBoq(r)}>
                      Edit
                    </Button>
                    <button onClick={() => handleDeleteBoq(r.id)} className="p-1 text-slate-400 hover:text-rose-600">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ),
              },
            ]}
            data={boqItems}
            onRowDoubleClick={(row) => setActiveBoq(row)}
            exportFileName="construction-boq"
            searchable
            searchPlaceholder="Search BOQ items..."
          />
        </div>
      )}

      {/* DPR Tab */}
      {activeTab === 'DPR' && (
        <div className="space-y-4">
          <DataTable
            columns={[
              { key: 'report_date', header: 'Report Date', render: (r: any) => <span className="font-mono font-bold text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded">{r.report_date}</span> },
              { key: 'project_name', header: 'Project Site', render: (r: any) => <span className="font-semibold text-slate-800 text-xs">{r.project_name || 'Grand Heritage'}</span> },
              { key: 'weather', header: 'Weather Conditions', render: (r: any) => <span className="text-xs text-slate-600">{r.weather}</span> },
              { key: 'overall_progress_percent', header: 'Cumulative Progress', render: (r: any) => <span className="font-mono font-bold text-xs text-emerald-700">{r.overall_progress_percent}%</span> },
              { key: 'summary', header: 'Executive Site Summary', render: (r: any) => <span className="text-xs text-slate-700 font-medium line-clamp-1">{r.summary}</span> },
              { key: 'submitted_by_name', header: 'Engineer / Lead', render: (r: any) => <span className="text-xs text-slate-500">{r.submitted_by_name || 'Site Engineer'}</span> },
              { key: 'status', header: 'Status', render: (r: any) => <Badge variant={r.status === 'APPROVED' ? 'success' : 'info'}>{r.status}</Badge> },
            ]}
            data={dprs}
            onRowDoubleClick={(row) => {
              setDprForm({
                weather: row.weather || 'Clear',
                progress: row.overall_progress_percent || 0,
                summary: row.summary || '',
                status: row.status || 'SUBMITTED',
              });
              setShowDprModal(true);
            }}
            exportFileName="construction-dpr-register"
            searchable
            searchPlaceholder="Search DPR by date or summary..."
          />
        </div>
      )}

      {/* Labour Attendance Tab */}
      {activeTab === 'LABOUR' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <DataTable
            columns={[
              { key: 'attendance_date', header: 'Log Date', render: (r: any) => <span className="font-mono text-xs text-slate-500">{r.attendance_date}</span> },
              { key: 'trade_category', header: 'Trade Category', render: (r: any) => <Badge variant="purple">{r.trade_category}</Badge> },
              { key: 'contractor_name', header: 'Labour Contractor', render: (r: any) => <span className="text-xs text-slate-800 font-semibold">{r.contractor_name}</span> },
              { key: 'count_present', header: 'Heads Present', render: (r: any) => <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-xs">{r.count_present} Workers</span> },
              { key: 'wages_per_day_paise', header: 'Wage/Day', render: (r: any) => <span className="font-mono text-xs">{formatInr(r.wages_per_day_paise)}</span> },
              { key: 'total_wages_paise', header: 'Daily Wage Total', render: (r: any) => <span className="font-mono font-bold text-slate-900 text-xs">{formatInr(r.total_wages_paise)}</span> },
            ]}
            data={labourLogs}
            onRowDoubleClick={(row) => {
              setLabourForm({
                tradeCategory: row.trade_category || 'MASON',
                contractorName: row.contractor_name || 'Cauvery Civil Works',
                countPresent: Number(row.count_present) || 10,
                wagesPerDayRupees: (row.wages_per_day_paise || 95000) / 100,
              });
              setShowLabourModal(true);
            }}
            exportFileName="labour-attendance-register"
            searchable
            searchPlaceholder="Search labour logs by trade or contractor..."
          />
        </div>
      )}

      {/* Contractor Bills Tab */}
      {activeTab === 'CONTRACTORS' && (
        <div className="space-y-4">
          <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-lg text-xs text-blue-800">
            <strong>Connected Site Flow:</strong> DPR Logged → Contractor Measurement Sheet Approved → Contractor Bill Generated with 2% TDS & 5% Retention → Payment Voucher posted to Accounts Payable.
          </div>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <DataTable
              columns={[
                { key: 'bill_number', header: 'Bill Number', render: (r: any) => <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-xs">{r.bill_number}</span> },
                { key: 'contractor_name', header: 'Contractor Name', render: (r: any) => <span className="font-semibold text-slate-800 text-xs">{r.contractor_name}</span> },
                { key: 'bill_date', header: 'Bill Date', render: (r: any) => <span className="font-mono text-xs text-slate-500">{r.bill_date}</span> },
                { key: 'gross_amount_paise', header: 'Gross Bill Value', render: (r: any) => <span className="font-mono font-bold text-slate-900 text-xs">{formatInr(r.gross_amount_paise)}</span> },
                { key: 'tds_amount_paise', header: 'TDS (2%)', render: (r: any) => <span className="font-mono text-xs text-rose-600">{formatInr(r.tds_amount_paise)}</span> },
                { key: 'retention_paise', header: 'Retention (5%)', render: (r: any) => <span className="font-mono text-xs text-amber-600">{formatInr(r.retention_paise)}</span> },
                { key: 'net_payable_paise', header: 'Net Payable', render: (r: any) => <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-xs border border-emerald-100">{formatInr(r.net_payable_paise)}</span> },
                { key: 'status', header: 'Status', render: (r: any) => <Badge variant={r.status === 'APPROVED' ? 'success' : 'warning'}>{r.status}</Badge> },
              ]}
              data={contractorData.bills}
              onRowDoubleClick={(row) => {
                setBillForm({
                  contractorId: row.contractor_id || (contractorData.contractors?.[0]?.id || ''),
                  grossRupees: (row.gross_amount_paise || 25000000) / 100,
                });
                setShowBillModal(true);
              }}
              exportFileName="contractor-bills-register"
              searchable
              searchPlaceholder="Search contractor bills..."
            />
          </div>
        </div>
      )}

      {/* AutoSave BOQ Modal */}
      {activeBoq && (
        <Modal
          open={!!activeBoq}
          onClose={() => setActiveBoq(null)}
          title={`BOQ Package: ${activeBoq.work_package}`}
          size="md"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-xs text-slate-500">Package ID: {activeBoq.id.slice(0, 8)}...</span>
              <AutoSaveIndicator status={saveStatus} lastSavedAt={lastSaved} />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Work Package Title</label>
              <AutoSaveInput
                value={activeBoq.work_package || ''}
                onSave={(val) => handleBoqFieldSave('workPackage', val)}
                placeholder="e.g. Reinforced Concrete Structure"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Detailed Description & Specifications</label>
              <AutoSaveInput
                value={activeBoq.description || ''}
                onSave={(val) => handleBoqFieldSave('description', val)}
                placeholder="M25 concrete, curing period..."
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Unit (UOM)</label>
                <AutoSaveInput
                  value={activeBoq.unit || 'CUM'}
                  onSave={(val) => handleBoqFieldSave('unit', val)}
                  placeholder="CUM, SQM, TON, LOT"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity</label>
                <AutoSaveInput
                  type="number"
                  value={activeBoq.quantity || 0}
                  onSave={(val) => handleBoqFieldSave('quantity', Number(val))}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Rate (Paise)</label>
                <AutoSaveInput
                  type="number"
                  value={activeBoq.rate_paise || 0}
                  onSave={(val) => handleBoqFieldSave('ratePaise', Number(val))}
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs flex justify-between font-bold">
              <span>Calculated Amount:</span>
              <span className="font-mono text-blue-700">{formatInr(activeBoq.amount_paise || 0)}</span>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200">
              <Button variant="secondary" onClick={() => setActiveBoq(null)}>Close</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Log Daily Progress Report (DPR) Modal */}
      {showDprModal && (
        <Modal open={showDprModal} onClose={() => setShowDprModal(false)} title="Log Daily Progress Report (DPR)" size="md">
          <form onSubmit={handleSaveDpr} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Weather Conditions *</label>
                <input
                  type="text"
                  value={dprForm.weather}
                  onChange={(e) => setDprForm({ ...dprForm, weather: e.target.value })}
                  required
                  placeholder="e.g. Clear, 28°C"
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Cumulative Progress (%) *</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={dprForm.progress}
                  onChange={(e) => setDprForm({ ...dprForm, progress: Number(e.target.value) })}
                  required
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Site Activity Log & Summary *</label>
              <textarea
                rows={4}
                value={dprForm.summary}
                onChange={(e) => setDprForm({ ...dprForm, summary: e.target.value })}
                required
                placeholder="Completed footing cast for Villa Blocks 3 & 4. Shuttering removal and curing underway. Steel reinforcement delivered..."
                className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <Button variant="secondary" onClick={() => setShowDprModal(false)}>Cancel</Button>
              <Button type="submit">Submit Daily Progress Report</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Record Labour Attendance Modal */}
      {showLabourModal && (
        <Modal open={showLabourModal} onClose={() => setShowLabourModal(false)} title="Record Site Labour Attendance" size="md">
          <form onSubmit={handleSaveLabour} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Trade Category *</label>
                <select
                  value={labourForm.tradeCategory}
                  onChange={(e) => setLabourForm({ ...labourForm, tradeCategory: e.target.value })}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="MASON">Masons & Plasterers</option>
                  <option value="CARPENTER">Carpenters & Shuttering</option>
                  <option value="ELECTRICIAN">Site Electricians</option>
                  <option value="PLUMBER">Plumbers & Drainage</option>
                  <option value="HELPER">Unskilled Helpers</option>
                  <option value="SUPERVISOR">Site Supervisors</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Labour Contractor Name *</label>
                <input
                  type="text"
                  value={labourForm.contractorName}
                  onChange={(e) => setLabourForm({ ...labourForm, contractorName: e.target.value })}
                  required
                  placeholder="e.g. Cauvery Civil Works"
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Headcount Present *</label>
                <input
                  type="number"
                  min="1"
                  value={labourForm.countPresent}
                  onChange={(e) => setLabourForm({ ...labourForm, countPresent: Number(e.target.value) })}
                  required
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Daily Wage / Head (₹) *</label>
                <input
                  type="number"
                  min="100"
                  value={labourForm.wagesPerDayRupees}
                  onChange={(e) => setLabourForm({ ...labourForm, wagesPerDayRupees: Number(e.target.value) })}
                  required
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs flex justify-between font-bold">
              <span>Total Day Wage Value:</span>
              <span className="font-mono text-emerald-700">
                ₹{((labourForm.countPresent || 0) * (labourForm.wagesPerDayRupees || 0)).toLocaleString('en-IN')}
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <Button variant="secondary" onClick={() => setShowLabourModal(false)}>Cancel</Button>
              <Button type="submit">Log Attendance & Wages</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Generate Contractor Bill Modal */}
      {showBillModal && (
        <Modal open={showBillModal} onClose={() => setShowBillModal(false)} title="Generate Contractor Bill & Deductions" size="md">
          <form onSubmit={handleSaveContractorBill} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select Contractor *</label>
              <select
                value={billForm.contractorId}
                onChange={(e) => setBillForm({ ...billForm, contractorId: e.target.value })}
                className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Cauvery Civil Works & Contractors</option>
                {contractorData.contractors.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.specialization})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Gross Bill Amount (₹) *</label>
              <input
                type="number"
                min="1000"
                value={billForm.grossRupees}
                onChange={(e) => setBillForm({ ...billForm, grossRupees: Number(e.target.value) })}
                required
                className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-blue-500 font-mono"
              />
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1.5">
              <div className="flex justify-between text-slate-600">
                <span>Gross Value:</span>
                <span className="font-mono font-semibold">₹{(billForm.grossRupees || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-rose-600">
                <span>Statutory TDS (2%):</span>
                <span className="font-mono font-semibold">-₹{Math.round((billForm.grossRupees || 0) * 0.02).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-amber-600">
                <span>Defect Retention (5%):</span>
                <span className="font-mono font-semibold">-₹{Math.round((billForm.grossRupees || 0) * 0.05).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200 font-bold text-slate-900 text-sm">
                <span>Net Payable to Contractor:</span>
                <span className="font-mono text-emerald-700">₹{Math.round((billForm.grossRupees || 0) * 0.93).toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <Button variant="secondary" onClick={() => setShowBillModal(false)}>Cancel</Button>
              <Button type="submit">Generate Contractor Bill</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
