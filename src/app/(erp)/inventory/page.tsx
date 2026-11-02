'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Boxes, PackageCheck, AlertTriangle, ArrowUpDown, Plus, Trash2, CheckCircle2 } from 'lucide-react';
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

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<'STOCK' | 'ISSUES'>('STOCK');
  const [materials, setMaterials] = useState<any[]>([]);
  const [issues, setIssues] = useState<any[]>([]);

  // Add Material Modal
  const [activeMaterial, setActiveMaterial] = useState<any | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Material Issue Modal
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issueForm, setIssueForm] = useState({
    materialId: '',
    quantity: 50,
    rateRupees: 385,
    siteLocation: 'Villa Block 04 Foundation',
  });

  const fetchData = useCallback(() => {
    fetch('/api/masters/materials')
      .then(r => r.json())
      .then(d => setMaterials(Array.isArray(d) ? d : []))
      .catch(() => {});

    fetch('/api/inventory/issues')
      .then(r => r.json())
      .then(d => setIssues(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleOpenNewMaterial() {
    setSaveStatus('saving');
    try {
      const res = await fetch('/api/masters/materials/draft', { method: 'POST' });
      const draft = await res.json();
      setActiveMaterial(draft);
      setSaveStatus('saved');
      setLastSaved(new Date());
      fetchData();
    } catch {
      setSaveStatus('error');
    }
  }

  async function handleMaterialFieldSave(field: string, value: any) {
    if (!activeMaterial) return;
    setSaveStatus('saving');
    try {
      const res = await fetch(`/api/masters/materials/${activeMaterial.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });
      const data = await res.json();
      if (data.material) {
        setActiveMaterial(data.material);
      } else {
        setActiveMaterial((prev: any) => ({ ...prev, [field]: value }));
      }
      setSaveStatus('saved');
      setLastSaved(new Date());
      fetchData();
    } catch {
      setSaveStatus('error');
    }
  }

  async function handleSaveIssue(e: React.FormEvent) {
    e.preventDefault();
    try {
      await fetch('/api/inventory/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(issueForm),
      });
      setShowIssueModal(false);
      fetchData();
    } catch {}
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded">INVENTORY</span>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
              Zero-Click AutoSave
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-1">Stock Ledger & Site Inventory</h1>
          <p className="text-xs text-slate-500">
            Real-time material stock balances, site issue notes, minimum re-order thresholds, and inventory valuation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowIssueModal(true)} icon={<ArrowUpDown className="w-4 h-4" />}>
            Material Issue Note
          </Button>
          <Button size="sm" onClick={handleOpenNewMaterial} icon={<Plus className="w-4 h-4" />}>
            Add Material Master
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard label="Total Material SKUs" value={`${materials.length} SKUs`} subtext="Civil & Interior Finishes" icon={<Boxes className="w-4 h-4" />} />
        <StatCard label="Stock Valuation" value="₹12.45 L" subtext="At Standard Cost" icon={<PackageCheck className="w-4 h-4" />} colorClass="text-emerald-600" />
        <StatCard label="Stock Health" value="100% Above Min" subtext="No Shortage Reorders" icon={<AlertTriangle className="w-4 h-4" />} colorClass="text-blue-600" />
        <StatCard label="Site Issues Recorded" value={`${issues.length} Notes`} subtext="Consumption logged" icon={<ArrowUpDown className="w-4 h-4" />} colorClass="text-purple-600" />
      </div>

      <div className="flex border-b border-slate-200 gap-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('STOCK')}
          className={`pb-2.5 transition-colors border-b-2 -mb-px ${
            activeTab === 'STOCK' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Perpetual Stock Ledger ({materials.length})
        </button>
        <button
          onClick={() => setActiveTab('ISSUES')}
          className={`pb-2.5 transition-colors border-b-2 -mb-px ${
            activeTab === 'ISSUES' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Site Issue Notes & Consumption ({issues.length})
        </button>
      </div>

      {activeTab === 'STOCK' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <DataTable
            columns={[
              {
                key: 'item_code',
                header: 'Material Code',
                render: (r: any) => (
                  <button onClick={() => setActiveMaterial(r)} className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-xs hover:underline">
                    {r.item_code}
                  </button>
                ),
              },
              { key: 'name', header: 'Material Name', render: (r: any) => <span className="font-semibold text-slate-800 text-xs">{r.name}</span> },
              { key: 'category', header: 'Category', render: (r: any) => <span className="text-xs text-slate-600">{r.category || 'Civil Materials'}</span> },
              { key: 'uom', header: 'UOM', render: (r: any) => <span className="font-mono text-xs">{r.uom}</span> },
              { key: 'standard_cost_paise', header: 'Standard Unit Cost', render: (r: any) => <span className="font-mono text-xs font-medium text-slate-900">{formatInr(r.standard_cost_paise || 38500)}</span> },
              { key: 'min_stock_level', header: 'Safety Threshold', render: (r: any) => <span className="font-mono text-xs text-slate-500">{r.min_stock_level || 50} {r.uom}</span> },
              { key: 'hsn_code', header: 'HSN / GST', render: (r: any) => <span className="font-mono text-[11px] text-slate-500">{r.hsn_code || '6810'} ({r.gst_rate || 18}%)</span> },
            ]}
            data={materials}
            exportFileName="inventory-stock-ledger"
            searchable
            searchPlaceholder="Search materials by code or name..."
          />
        </div>
      )}

      {activeTab === 'ISSUES' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <DataTable
            columns={[
              { key: 'reference_id', header: 'Issue Note Ref', render: (r: any) => <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-xs">{r.reference_id || 'MIN-001'}</span> },
              { key: 'material_name', header: 'Material Issued', render: (r: any) => <span className="font-semibold text-slate-800 text-xs">{r.material_name}</span> },
              { key: 'project_name', header: 'Site Location', render: (r: any) => <span className="text-xs text-slate-600">{r.project_name || 'Grand Heritage Phase 1'}</span> },
              { key: 'quantity', header: 'Quantity Issued', render: (r: any) => <span className="font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded text-xs">{Math.abs(r.quantity)}</span> },
              { key: 'total_cost_paise', header: 'Consumption Cost', render: (r: any) => <span className="font-mono font-bold text-slate-900 text-xs">{formatInr(r.total_cost_paise)}</span> },
              { key: 'created_at', header: 'Timestamp', render: (r: any) => <span className="font-mono text-xs text-slate-500">{new Date(r.created_at).toLocaleDateString()}</span> },
            ]}
            data={issues}
            exportFileName="site-material-issues"
            searchable
            searchPlaceholder="Search issue notes..."
          />
        </div>
      )}

      {/* AutoSave Material Modal */}
      {activeMaterial && (
        <Modal open={!!activeMaterial} onClose={() => setActiveMaterial(null)} title={`Material Master: ${activeMaterial.item_code}`} size="md">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-xs text-slate-500">SKU ID: {activeMaterial.id.slice(0, 8)}...</span>
              <AutoSaveIndicator status={saveStatus} lastSavedAt={lastSaved} />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Material Name *</label>
              <AutoSaveInput
                value={activeMaterial.name || ''}
                onSave={(val) => handleMaterialFieldSave('name', val)}
                placeholder="e.g. UltraTech Super PPC Cement"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Unit of Measure (UOM) *</label>
                <AutoSaveSelect
                  value={activeMaterial.uom || 'BAG'}
                  onSave={(val) => handleMaterialFieldSave('uom', val)}
                >
                  <option value="BAG">BAG (Bags)</option>
                  <option value="TON">TON (Metric Tons)</option>
                  <option value="SQFT">SQFT (Square Feet)</option>
                  <option value="CUM">CUM (Cubic Meters)</option>
                  <option value="NOS">NOS (Pieces)</option>
                  <option value="LOT">LOT (Lumpsum)</option>
                </AutoSaveSelect>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
                <AutoSaveSelect
                  value={activeMaterial.category || 'CIVIL'}
                  onSave={(val) => handleMaterialFieldSave('category', val)}
                >
                  <option value="CIVIL">Civil Materials</option>
                  <option value="INTERIORS">Interior Finishes</option>
                  <option value="PLUMBING">Plumbing & Sanitary</option>
                  <option value="ELECTRICAL">Electrical & Lighting</option>
                </AutoSaveSelect>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Standard Cost (Paise)</label>
                <AutoSaveInput
                  type="number"
                  value={activeMaterial.standard_cost_paise || 0}
                  onSave={(val) => handleMaterialFieldSave('standardCostPaise', Number(val))}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Safety Threshold (Min)</label>
                <AutoSaveInput
                  type="number"
                  value={activeMaterial.min_stock_level || 50}
                  onSave={(val) => handleMaterialFieldSave('minStockLevel', Number(val))}
                />
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200">
              <Button variant="secondary" onClick={() => setActiveMaterial(null)}>Close</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Material Issue Note Modal */}
      {showIssueModal && (
        <Modal open={showIssueModal} onClose={() => setShowIssueModal(false)} title="Issue Material to Site (MIN)" size="md">
          <form onSubmit={handleSaveIssue} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select Material SKU *</label>
              <select
                value={issueForm.materialId}
                onChange={(e) => setIssueForm({ ...issueForm, materialId: e.target.value })}
                className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Select Material...</option>
                {materials.map((m: any) => (
                  <option key={m.id} value={m.id}>{m.item_code} - {m.name} ({m.uom})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity to Issue *</label>
                <input
                  type="number"
                  min="1"
                  value={issueForm.quantity}
                  onChange={(e) => setIssueForm({ ...issueForm, quantity: Number(e.target.value) })}
                  required
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Unit Valuation Rate (₹) *</label>
                <input
                  type="number"
                  min="1"
                  value={issueForm.rateRupees}
                  onChange={(e) => setIssueForm({ ...issueForm, rateRupees: Number(e.target.value) })}
                  required
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Site Location & Purpose *</label>
              <input
                type="text"
                value={issueForm.siteLocation}
                onChange={(e) => setIssueForm({ ...issueForm, siteLocation: e.target.value })}
                required
                placeholder="e.g. Villa Block 04 Foundation Cast"
                className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <Button variant="secondary" onClick={() => setShowIssueModal(false)}>Cancel</Button>
              <Button type="submit">Confirm Material Issue</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
