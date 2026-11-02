'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Paintbrush, Ruler, CheckSquare, RefreshCw, Plus, FileImage, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
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

export default function InteriorsPage() {
  const [activeTab, setActiveTab] = useState<'REVISIONS' | 'CHANGE_ORDERS' | 'MEASUREMENTS'>('REVISIONS');
  const [revisions, setRevisions] = useState<any[]>([]);
  const [changeOrders, setChangeOrders] = useState<any[]>([]);
  const [activeRevision, setActiveRevision] = useState<any | null>(null);

  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // New Change Order Modal
  const [showCoModal, setShowCoModal] = useState(false);
  const [coForm, setCoForm] = useState({
    description: '',
    reason: 'Client aesthetic upgrade',
    amountRupees: 250000,
  });

  const fetchData = useCallback(() => {
    fetch('/api/interiors/revisions')
      .then(r => r.json())
      .then(d => setRevisions(Array.isArray(d) ? d : []))
      .catch(() => {});

    fetch('/api/interiors/change-orders')
      .then(r => r.json())
      .then(d => setChangeOrders(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleAddRevision() {
    setSaveStatus('saving');
    try {
      const res = await fetch('/api/interiors/revisions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      setActiveRevision(data);
      setSaveStatus('saved');
      setLastSaved(new Date());
      fetchData();
    } catch {
      setSaveStatus('error');
    }
  }

  async function handleRevisionFieldSave(field: string, value: any) {
    if (!activeRevision) return;
    setSaveStatus('saving');
    try {
      const res = await fetch('/api/interiors/revisions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: activeRevision.id, [field]: value }),
      });
      const data = await res.json();
      setActiveRevision(data);
      setSaveStatus('saved');
      setLastSaved(new Date());
      fetchData();
    } catch {
      setSaveStatus('error');
    }
  }

  async function handleDeleteRevision(id: string) {
    if (!confirm('Delete this design revision?')) return;
    await fetch(`/api/interiors/revisions?id=${id}`, { method: 'DELETE' });
    if (activeRevision?.id === id) setActiveRevision(null);
    fetchData();
  }

  async function handleSaveChangeOrder(e: React.FormEvent) {
    e.preventDefault();
    try {
      await fetch('/api/interiors/change-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(coForm),
      });
      setShowCoModal(false);
      setCoForm({ description: '', reason: 'Client aesthetic upgrade', amountRupees: 250000 });
      fetchData();
    } catch {}
  }

  const approvedRevs = revisions.filter(r => r.customer_approved === 1).length;
  const totalCoPaise = changeOrders.reduce((s, co) => s + (co.amount_change_paise || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2.5 py-0.5 rounded">INTERIORS</span>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
              Zero-Click AutoSave
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-1">
            Interior Design & Turnkey Execution Workspace
          </h1>
          <p className="text-xs text-slate-500">
            Site measurements, 3D design revision iterations, client digital sign-offs, and Change Order (CO) tracking
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'REVISIONS' ? (
            <Button size="sm" onClick={handleAddRevision} icon={<Plus className="w-4 h-4" />}>
              New Revision (AutoSave)
            </Button>
          ) : (
            <Button size="sm" onClick={() => setShowCoModal(true)} icon={<Plus className="w-4 h-4" />}>
              New Change Order
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard label="Contract Value" value="₹4.50 Cr" subtext="Penthouse Suite" icon={<Paintbrush className="w-4 h-4" />} colorClass="text-purple-600" />
        <StatCard label="Site Measurement" value="100% Completed" subtext="Laser Scan Verified" icon={<Ruler className="w-4 h-4" />} colorClass="text-emerald-600" />
        <StatCard label="Design Sign-offs" value={`${approvedRevs} of ${revisions.length} Stages`} subtext="Customer Approved" icon={<CheckSquare className="w-4 h-4" />} colorClass="text-blue-600" />
        <StatCard label="Approved Variations" value={formatInr(totalCoPaise || 93000000)} subtext={`${changeOrders.length} Change Orders`} icon={<RefreshCw className="w-4 h-4" />} colorClass="text-amber-600" />
      </div>

      <div className="flex border-b border-slate-200 gap-6 text-xs font-semibold">
        {(['REVISIONS', 'CHANGE_ORDERS', 'MEASUREMENTS'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2.5 transition-colors border-b-2 -mb-px ${
              activeTab === tab ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab === 'REVISIONS' ? `Multi-Phase Design Revisions (${revisions.length})` : tab === 'CHANGE_ORDERS' ? `Change Orders (${changeOrders.length})` : 'Site Measurement Logs'}
          </button>
        ))}
      </div>

      {/* Revisions Tab */}
      {activeTab === 'REVISIONS' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <DataTable
            columns={[
              {
                key: 'revision_number',
                header: 'Revision Ref',
                render: (r: any) => (
                  <button onClick={() => setActiveRevision(r)} className="font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded text-xs hover:underline">
                    Rev {r.revision_number}.0
                  </button>
                ),
              },
              { key: 'description', header: 'Scope & Drawing Details', render: (r: any) => <span className="font-semibold text-slate-800 text-xs">{r.description}</span> },
              { key: 'created_at', header: 'Creation Date', render: (r: any) => <span className="font-mono text-xs text-slate-500">{r.created_at ? new Date(r.created_at).toLocaleDateString() : 'Active'}</span> },
              {
                key: 'customer_approved',
                header: 'Sign-Off Status',
                render: (r: any) => (
                  <Badge variant={r.customer_approved ? 'success' : 'warning'}>
                    {r.customer_approved ? 'DIGITAL SIGN-OFF' : 'IN REVIEW'}
                  </Badge>
                ),
              },
              {
                key: 'actions',
                header: 'Actions',
                render: (r: any) => (
                  <div className="flex items-center gap-1.5">
                    <Button size="sm" variant="ghost" onClick={() => setActiveRevision(r)}>
                      Edit
                    </Button>
                    <button onClick={() => handleDeleteRevision(r.id)} className="p-1 text-slate-400 hover:text-rose-600">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ),
              },
            ]}
            data={revisions}
            exportFileName="interior-design-revisions"
            searchable
            searchPlaceholder="Search revisions..."
          />
        </div>
      )}

      {/* Change Orders Tab */}
      {activeTab === 'CHANGE_ORDERS' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <DataTable
            columns={[
              { key: 'co_number', header: 'CO Number', render: (r: any) => <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-xs">{r.co_number}</span> },
              { key: 'description', header: 'Scope Variation Description', render: (r: any) => <span className="font-semibold text-slate-800 text-xs">{r.description}</span> },
              { key: 'reason', header: 'Reason for Alteration', render: (r: any) => <span className="text-xs text-slate-600">{r.reason}</span> },
              { key: 'amount_change_paise', header: 'Price Impact', render: (r: any) => <span className="font-mono font-bold text-slate-900 text-xs">+{formatInr(r.amount_change_paise)}</span> },
              { key: 'status', header: 'Approval', render: (r: any) => <Badge variant={r.status === 'APPROVED' ? 'success' : 'warning'}>{r.status}</Badge> },
            ]}
            data={changeOrders}
            exportFileName="interior-change-orders"
            searchable
            searchPlaceholder="Search change orders..."
          />
        </div>
      )}

      {/* Measurements Tab */}
      {activeTab === 'MEASUREMENTS' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Laser Dimension & As-Built Site Measurements</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
              <span className="font-bold text-slate-800">Master Suite 01</span>
              <div className="text-slate-500">Dimensions: 22&apos;4&quot; x 18&apos;6&quot; · Ceiling: 10&apos;8&quot;</div>
              <Badge variant="success">Laser Verified</Badge>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
              <span className="font-bold text-slate-800">Grand Living & Foyer</span>
              <div className="text-slate-500">Dimensions: 36&apos;0&quot; x 24&apos;8&quot; · Ceiling: 11&apos;2&quot;</div>
              <Badge variant="success">Laser Verified</Badge>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
              <span className="font-bold text-slate-800">Chef&apos;s Modular Kitchen</span>
              <div className="text-slate-500">Dimensions: 16&apos;6&quot; x 14&apos;2&quot; · Services Routed</div>
              <Badge variant="success">Laser Verified</Badge>
            </div>
          </div>
        </div>
      )}

      {/* Revision Modal */}
      {activeRevision && (
        <Modal open={!!activeRevision} onClose={() => setActiveRevision(null)} title={`Design Revision: Rev ${activeRevision.revision_number}.0`} size="md">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-xs text-slate-500">Revision ID: {activeRevision.id.slice(0, 8)}...</span>
              <AutoSaveIndicator status={saveStatus} lastSavedAt={lastSaved} />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Scope Description & Iteration Notes</label>
              <AutoSaveInput
                value={activeRevision.description || ''}
                onSave={(val) => handleRevisionFieldSave('description', val)}
                placeholder="e.g. 3D Photorealistic Renders & False Ceiling Plan"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Digital Approval</label>
              <AutoSaveSelect
                value={activeRevision.customer_approved ? '1' : '0'}
                onSave={(val) => handleRevisionFieldSave('customerApproved', val === '1')}
              >
                <option value="0">IN REVIEW (Pending Sign-off)</option>
                <option value="1">APPROVED (Client Signed-Off)</option>
              </AutoSaveSelect>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200">
              <Button variant="secondary" onClick={() => setActiveRevision(null)}>Close</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Create Change Order Modal */}
      {showCoModal && (
        <Modal open={showCoModal} onClose={() => setShowCoModal(false)} title="Record Change Order (CO) Scope Variation" size="md">
          <form onSubmit={handleSaveChangeOrder} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Variation Description *</label>
              <input
                type="text"
                value={coForm.description}
                onChange={(e) => setCoForm({ ...coForm, description: e.target.value })}
                required
                placeholder="e.g. Upgrade to Italian Botticino Marble in Living Area"
                className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Justification Reason *</label>
              <input
                type="text"
                value={coForm.reason}
                onChange={(e) => setCoForm({ ...coForm, reason: e.target.value })}
                required
                className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Price Variation Value (₹) *</label>
              <input
                type="number"
                min="0"
                value={coForm.amountRupees}
                onChange={(e) => setCoForm({ ...coForm, amountRupees: Number(e.target.value) })}
                required
                className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-blue-500 font-mono"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <Button variant="secondary" onClick={() => setShowCoModal(false)}>Cancel</Button>
              <Button type="submit">Record Change Order</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
