'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { ShoppingCart, FileCheck, PackagePlus, ArrowRight, Plus, Trash2, CheckCircle2, Check } from 'lucide-react';
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

export default function ProcurementPage() {
  const [activeTab, setActiveTab] = useState<'MR' | 'PO' | 'WORKFLOW'>('MR');
  const [mrs, setMrs] = useState<any[]>([]);
  const [pos, setPos] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [activeMR, setActiveMR] = useState<any | null>(null);

  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // New PO Modal
  const [showPoModal, setShowPoModal] = useState(false);
  const [poForm, setPoForm] = useState({
    vendorId: '',
    description: 'UltraTech Super PPC Cement & TMT 550D Steel',
    quantity: 200,
    unit: 'BAG',
    unitRateRupees: 385,
    paymentTerms: '30 Days Net from Delivery',
  });

  const fetchData = useCallback(() => {
    fetch('/api/procurement/requisitions').then(r => r.json()).then(d => setMrs(Array.isArray(d) ? d : [])).catch(() => {});
    fetch('/api/procurement/purchase-orders').then(r => r.json()).then(d => setPos(Array.isArray(d) ? d : [])).catch(() => {});
    fetch('/api/masters/vendors').then(r => r.json()).then(d => setVendors(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleOpenNewMR() {
    setSaveStatus('saving');
    try {
      const res = await fetch('/api/procurement/requisitions/draft', { method: 'POST' });
      const draft = await res.json();
      setActiveMR(draft);
      setSaveStatus('saved');
      setLastSaved(new Date());
      fetchData();
    } catch {
      setSaveStatus('error');
    }
  }

  async function handleMRFieldSave(field: string, value: any) {
    if (!activeMR) return;
    setSaveStatus('saving');
    try {
      const res = await fetch(`/api/procurement/requisitions/${activeMR.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });
      const data = await res.json();
      if (data.mr) {
        setActiveMR(data.mr);
      } else {
        setActiveMR((prev: any) => ({ ...prev, [field]: value }));
      }
      setSaveStatus('saved');
      setLastSaved(new Date());
      fetchData();
    } catch {
      setSaveStatus('error');
    }
  }

  async function handleDeleteMR(id: string) {
    if (!confirm('Cancel and delete this material requisition?')) return;
    await fetch(`/api/procurement/requisitions/${id}`, { method: 'DELETE' });
    if (activeMR?.id === id) setActiveMR(null);
    fetchData();
  }

  async function handleSavePo(e: React.FormEvent) {
    e.preventDefault();
    try {
      await fetch('/api/procurement/purchase-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(poForm),
      });
      setShowPoModal(false);
      fetchData();
    } catch {}
  }

  async function handleMarkPoReceived(poId: string) {
    try {
      await fetch('/api/procurement/purchase-orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: poId, status: 'RECEIVED' }),
      });
      fetchData();
    } catch {}
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded">PROCUREMENT</span>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
              Zero-Click AutoSave
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-1">Procurement & Material Indents</h1>
          <p className="text-xs text-slate-500">
            Material Requisitions (MR), Purchase Orders (PO), and Goods Receipt Notes (GRN) with live field auto-saving.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'MR' ? (
            <Button onClick={handleOpenNewMR} icon={<Plus className="w-4 h-4" />}>
              New Requisition (AutoSave)
            </Button>
          ) : (
            <Button onClick={() => setShowPoModal(true)} icon={<Plus className="w-4 h-4" />}>
              Create Purchase Order
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard label="Active Requisitions" value={`${mrs.length} Indents`} subtext="Civil & Interior MRs" icon={<PackagePlus className="w-4 h-4" />} colorClass="text-amber-600" />
        <StatCard label="Purchase Orders" value={`${pos.length} Issued`} subtext="P2P Pipeline" icon={<ShoppingCart className="w-4 h-4" />} colorClass="text-blue-600" />
        <StatCard label="GRN Inspections" value="98.5% Pass" subtext="Quality Control Accepted" icon={<FileCheck className="w-4 h-4" />} colorClass="text-emerald-600" />
        <StatCard label="Average Delivery" value="4.2 Days" subtext="Order to Site Gate" icon={<ArrowRight className="w-4 h-4" />} />
      </div>

      <div className="flex border-b border-slate-200 gap-6 text-xs font-semibold">
        {(['MR', 'PO', 'WORKFLOW'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2.5 transition-colors border-b-2 -mb-px ${
              activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab === 'MR' ? `Material Requisitions (${mrs.length})` : tab === 'PO' ? `Purchase Orders (${pos.length})` : 'Procurement-to-Pay Workflow'}
          </button>
        ))}
      </div>

      {activeTab === 'MR' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <DataTable
            columns={[
              {
                key: 'mr_number',
                header: 'MR Number',
                render: (r) => (
                  <button
                    onClick={() => setActiveMR(r)}
                    className="font-mono font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded text-xs transition-colors"
                  >
                    {r.mr_number}
                  </button>
                ),
              },
              {
                key: 'project_name',
                header: 'Project Site',
                render: (r) => (
                  <div onClick={() => setActiveMR(r)} className="cursor-pointer hover:text-blue-600 text-xs font-semibold text-slate-800">
                    {r.project_name || 'Grand Heritage Villas'}
                  </div>
                ),
              },
              {
                key: 'required_date',
                header: 'Required By Date',
                render: (r) => <span className="font-mono text-xs text-slate-600">{r.required_date}</span>,
              },
              {
                key: 'status',
                header: 'Stage',
                render: (r) => (
                  <Badge variant={r.status === 'PO_CREATED' ? 'success' : r.status === 'APPROVED' ? 'info' : 'warning'}>
                    {r.status}
                  </Badge>
                ),
              },
              {
                key: 'actions',
                header: 'Actions',
                render: (r) => (
                  <div className="flex items-center gap-1.5">
                    <Button size="sm" variant="ghost" onClick={() => setActiveMR(r)}>
                      Edit
                    </Button>
                    <button
                      onClick={() => handleDeleteMR(r.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                      title="Delete MR"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ),
              },
            ]}
            data={mrs}
            exportFileName="material-requisitions"
            searchable
            searchPlaceholder="Search requisitions..."
            searchFilter={(item, q) => item.mr_number?.toLowerCase().includes(q) || item.project_name?.toLowerCase().includes(q)}
          />
        </div>
      )}

      {activeTab === 'PO' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <DataTable
            columns={[
              { key: 'po_number', header: 'PO Number', render: (r) => <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-xs">{r.po_number || r.poNumber}</span> },
              { key: 'vendor_name', header: 'Vendor / Supplier', render: (r) => <span className="font-semibold text-slate-800 text-xs">{r.vendor_name || r.vendor}</span> },
              { key: 'project_name', header: 'Project Site', render: (r) => <span className="text-xs text-slate-600">{r.project_name || r.project}</span> },
              { key: 'po_date', header: 'PO Date', render: (r) => <span className="font-mono text-xs text-slate-500">{r.po_date || r.date}</span> },
              { key: 'total_amount_paise', header: 'Order Total', render: (r) => <span className="font-mono font-bold text-xs text-slate-900">{r.total_amount_paise ? formatInr(r.total_amount_paise) : '₹77,000'}</span> },
              { key: 'status', header: 'Status', render: (r) => <Badge variant={r.status === 'RECEIVED' ? 'success' : 'warning'}>{r.status}</Badge> },
              {
                key: 'actions',
                header: 'Action',
                render: (r) => (
                  <div>
                    {r.status !== 'RECEIVED' ? (
                      <button
                        onClick={() => handleMarkPoReceived(r.id)}
                        className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" /> Inward GRN
                      </button>
                    ) : (
                      <span className="text-[10px] text-emerald-600 font-bold">INWARDED</span>
                    )}
                  </div>
                ),
              },
            ]}
            data={pos}
            exportFileName="purchase-orders"
            searchable
            searchPlaceholder="Search purchase orders..."
          />
        </div>
      )}

      {activeTab === 'WORKFLOW' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Connected Procurement-to-Pay (P2P) Flow</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-center text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="font-bold text-slate-800">1. Material Requisition</div>
              <div className="text-[11px] text-slate-500 mt-1">Site Engineer raises indent against BOQ</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="font-bold text-slate-800">2. Purchase Order</div>
              <div className="text-[11px] text-slate-500 mt-1">Purchase Exec generates approved PO</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="font-bold text-slate-800">3. Goods Receipt (GRN)</div>
              <div className="text-[11px] text-slate-500 mt-1">Gate entry QC inspection & stock inward</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="font-bold text-slate-800">4. Vendor Bill Approval</div>
              <div className="text-[11px] text-slate-500 mt-1">3-way match: PO vs GRN vs Vendor Bill</div>
            </div>
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900">
              <div className="font-bold">5. Accounts Payable Voucher</div>
              <div className="text-[11px] text-blue-700 mt-1">General Ledger Dr Material Cr Vendor</div>
            </div>
          </div>
        </div>
      )}

      {/* AutoSave MR Modal */}
      {activeMR && (
        <Modal
          open={!!activeMR}
          onClose={() => setActiveMR(null)}
          title={`Material Requisition Indent: ${activeMR.mr_number}`}
          size="md"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-xs text-slate-500">Indent ID: {activeMR.id.slice(0, 8)}...</span>
              <AutoSaveIndicator status={saveStatus} lastSavedAt={lastSaved} />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Project Site</label>
              <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800">
                {activeMR.project_name || 'The Grand Heritage Villas (Phase 1)'}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Required By Date</label>
                <AutoSaveInput
                  type="date"
                  value={activeMR.required_date || ''}
                  onSave={(val) => handleMRFieldSave('requiredDate', val)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Approval Stage</label>
                <AutoSaveSelect
                  value={activeMR.status || 'DRAFT'}
                  onSave={(val) => handleMRFieldSave('status', val)}
                >
                  <option value="DRAFT">DRAFT INDENT</option>
                  <option value="PENDING_APPROVAL">PENDING SITE HEAD APPROVAL</option>
                  <option value="APPROVED">APPROVED FOR PO</option>
                  <option value="PO_CREATED">PO ISSUED</option>
                </AutoSaveSelect>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200">
              <Button variant="secondary" onClick={() => setActiveMR(null)}>Close</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Create Purchase Order Modal */}
      {showPoModal && (
        <Modal open={showPoModal} onClose={() => setShowPoModal(false)} title="Generate Approved Purchase Order (PO)" size="md">
          <form onSubmit={handleSavePo} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select Approved Vendor *</label>
              <select
                value={poForm.vendorId}
                onChange={(e) => setPoForm({ ...poForm, vendorId: e.target.value })}
                className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-blue-500"
              >
                <option value="">UltraTech Cement Dealership (Mysuru)</option>
                {vendors.map((v: any) => (
                  <option key={v.id} value={v.id}>{v.name} ({v.city || 'Vendor'})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Description of Material *</label>
              <input
                type="text"
                value={poForm.description}
                onChange={(e) => setPoForm({ ...poForm, description: e.target.value })}
                required
                className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity *</label>
                <input
                  type="number"
                  min="1"
                  value={poForm.quantity}
                  onChange={(e) => setPoForm({ ...poForm, quantity: Number(e.target.value) })}
                  required
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Unit (UOM) *</label>
                <select
                  value={poForm.unit}
                  onChange={(e) => setPoForm({ ...poForm, unit: e.target.value })}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="BAG">BAG</option>
                  <option value="TON">TON</option>
                  <option value="SQFT">SQFT</option>
                  <option value="CUM">CUM</option>
                  <option value="NOS">NOS</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Rate / Unit (₹) *</label>
                <input
                  type="number"
                  min="1"
                  value={poForm.unitRateRupees}
                  onChange={(e) => setPoForm({ ...poForm, unitRateRupees: Number(e.target.value) })}
                  required
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs flex justify-between font-bold">
              <span>Total PO Value:</span>
              <span className="font-mono text-emerald-700">
                ₹{((poForm.quantity || 0) * (poForm.unitRateRupees || 0)).toLocaleString('en-IN')}
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <Button variant="secondary" onClick={() => setShowPoModal(false)}>Cancel</Button>
              <Button type="submit">Issue Purchase Order</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
