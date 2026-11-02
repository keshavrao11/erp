'use client';
import React, { useState, useEffect, useCallback } from 'react';
import {
  ShoppingCart,
  FileCheck,
  PackagePlus,
  ArrowRight,
  Plus,
  Trash2,
  CheckCircle2,
  Check,
  Printer,
  ExternalLink,
  Building,
  Calendar,
  Sparkles,
  RotateCcw,
  Receipt,
  FileText,
  Eye,
  AlertCircle,
} from 'lucide-react';
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

interface POLineItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitRateRupees: number;
}

export default function ProcurementPage() {
  const [activeTab, setActiveTab] = useState<'PO' | 'MR' | 'WORKFLOW'>('PO');
  const [mrs, setMrs] = useState<any[]>([]);
  const [pos, setPos] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [activeMR, setActiveMR] = useState<any | null>(null);

  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // New PO Modal State
  const [showPoModal, setShowPoModal] = useState(false);
  const [poFormError, setPoFormError] = useState<string | null>(null);
  const [isSubmittingPo, setIsSubmittingPo] = useState(false);

  // Separate Auto-Generated PO ID
  const [poNumber, setPoNumber] = useState('');
  const [vendorId, setVendorId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [mrId, setMrId] = useState('');
  const [poDate, setPoDate] = useState(new Date().toISOString().slice(0, 10));
  const [expectedDate, setExpectedDate] = useState(
    new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
  );
  const [paymentTerms, setPaymentTerms] = useState('30 Days Net from Delivery');
  const [deliveryAddress, setDeliveryAddress] = useState(
    'The Grand Heritage Villas, Site Block 04, Mysore-Hunsur Road, Karnataka 570018'
  );
  const [poNotes, setPoNotes] = useState(
    'Material must be accompanied by Manufacturer Test Certificate and GST E-Way Bill at gate entry.'
  );

  // Multi-line Items for PO
  const [poItems, setPoItems] = useState<POLineItem[]>([
    {
      id: '1',
      description: 'UltraTech Super Premium PPC Cement (50kg Bags)',
      quantity: 200,
      unit: 'BAG',
      unitRateRupees: 385,
    },
    {
      id: '2',
      description: 'Tata Tiscon Fe 550D High-Strength TMT Rebars (16mm)',
      quantity: 5,
      unit: 'TON',
      unitRateRupees: 64500,
    },
  ]);

  // View / Print Formal PO Modal State
  const [viewPoData, setViewPoData] = useState<{ po: any; items: any[] } | null>(null);
  const [loadingPoView, setLoadingPoView] = useState(false);

  const fetchData = useCallback(() => {
    fetch('/api/procurement/requisitions')
      .then((r) => r.json())
      .then((d) => setMrs(Array.isArray(d) ? d : []))
      .catch(() => {});
    fetch('/api/procurement/purchase-orders')
      .then((r) => r.json())
      .then((d) => setPos(Array.isArray(d) ? d : []))
      .catch(() => {});
    fetch('/api/masters/vendors')
      .then((r) => r.json())
      .then((d) => {
        const vList = Array.isArray(d) ? d : [];
        setVendors(vList);
        if (vList.length > 0 && !vendorId) setVendorId(vList[0].id);
      })
      .catch(() => {});
    fetch('/api/projects')
      .then((r) => r.json())
      .then((d) => {
        const pList = Array.isArray(d) ? d : [];
        setProjects(pList);
        if (pList.length > 0 && !projectId) setProjectId(pList[0].id);
      })
      .catch(() => {});
  }, [vendorId, projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Fetch unique next PO number whenever modal opens
  function handleOpenCreatePO(fromMr?: any) {
    fetch('/api/procurement/purchase-orders?action=next_number')
      .then((r) => r.json())
      .then((d) => {
        setPoNumber(d.nextNumber || `PO-${new Date().getFullYear()}-00001`);
      })
      .catch(() => {
        setPoNumber(`PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
      });

    if (fromMr) {
      setMrId(fromMr.id);
      if (fromMr.project_id) setProjectId(fromMr.project_id);
    } else {
      setMrId('');
    }

    setPoFormError(null);
    setShowPoModal(true);
  }

  // Open Detailed Formal PO Pop-up (triggered on DOUBLE-CLICK or View)
  function handleOpenViewPO(po: any) {
    setLoadingPoView(true);
    fetch(`/api/procurement/purchase-orders?id=${po.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.po) {
          setViewPoData(d);
        } else {
          setViewPoData({
            po,
            items: [
              {
                description: 'Structural Building Materials Supply',
                quantity: 1,
                unit: 'LOT',
                unit_rate_paise: po.total_amount_paise,
                total_paise: po.total_amount_paise,
              },
            ],
          });
        }
        setLoadingPoView(false);
      })
      .catch(() => {
        setViewPoData({
          po,
          items: [
            {
              description: 'Structural Building Materials Supply',
              quantity: 1,
              unit: 'LOT',
              unit_rate_paise: po.total_amount_paise,
              total_paise: po.total_amount_paise,
            },
          ],
        });
        setLoadingPoView(false);
      });
  }

  // Line item manipulation inside PO modal
  function handleAddLineItem() {
    setPoItems([
      ...poItems,
      {
        id: String(Date.now()),
        description: 'M-Sand / Coarse Aggregate (20mm)',
        quantity: 10,
        unit: 'TON',
        unitRateRupees: 1850,
      },
    ]);
  }

  function handleUpdateLineItem(id: string, field: keyof POLineItem, value: any) {
    setPoItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  }

  function handleRemoveLineItem(id: string) {
    if (poItems.length <= 1) return;
    setPoItems((prev) => prev.filter((i) => i.id !== id));
  }

  // Calculation totals
  const subtotalRupees = poItems.reduce(
    (acc, item) => acc + (Number(item.quantity) || 0) * (Number(item.unitRateRupees) || 0),
    0
  );
  const gstRupees = Math.round(subtotalRupees * 0.18);
  const grandTotalRupees = subtotalRupees + gstRupees;

  // Submit and create new PO
  async function handleSavePo(e: React.FormEvent) {
    e.preventDefault();
    setPoFormError(null);
    setIsSubmittingPo(true);

    try {
      if (!vendorId) throw new Error('Please select an authorized vendor');
      if (poItems.length === 0) throw new Error('PO must have at least one line item');

      const payload = {
        poNumber: poNumber.trim(),
        vendorId,
        projectId,
        mrId: mrId || undefined,
        poDate,
        expectedDeliveryDate: expectedDate,
        paymentTerms,
        deliveryAddress,
        notes: poNotes,
        items: poItems.map((item) => ({
          description: item.description,
          quantity: Number(item.quantity),
          unit: item.unit,
          unitRateRupees: Number(item.unitRateRupees),
        })),
      };

      const res = await fetch('/api/procurement/purchase-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to issue Purchase Order');

      setShowPoModal(false);
      fetchData();
      setActiveTab('PO');
    } catch (err: any) {
      setPoFormError(err.message);
    } finally {
      setIsSubmittingPo(false);
    }
  }

  async function handleMarkPoReceived(poId: string) {
    try {
      await fetch('/api/procurement/purchase-orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: poId, status: 'RECEIVED' }),
      });
      if (viewPoData && viewPoData.po.id === poId) {
        setViewPoData({ ...viewPoData, po: { ...viewPoData.po, status: 'RECEIVED' } });
      }
      fetchData();
    } catch {}
  }

  async function handleDeletePo(poId: string) {
    if (!confirm('Are you sure you want to cancel and delete this Purchase Order?')) return;
    try {
      await fetch(`/api/procurement/purchase-orders?id=${poId}`, { method: 'DELETE' });
      setViewPoData(null);
      fetchData();
    } catch {}
  }

  // Material Requisition Handlers
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded">
              PROCUREMENT &amp; P2P
            </span>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
              Commercial Order Engine
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-1">
            Purchase Orders &amp; Material Indents
          </h1>
          <p className="text-xs text-slate-500">
            Create separate Purchase Order IDs, manage vendor supply agreements, and track Goods Receipt Notes (GRN). Double-click any row to view formal document.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            onClick={handleOpenNewMR}
            icon={<PackagePlus className="w-4 h-4 text-amber-600" />}
          >
            New Requisition (MR)
          </Button>
          <Button
            onClick={() => handleOpenCreatePO()}
            icon={<Plus className="w-4 h-4" />}
          >
            Create Purchase Order
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard
          label="Purchase Orders Issued"
          value={`${pos.length} Orders`}
          subtext="With unique serial IDs"
          icon={<ShoppingCart className="w-4 h-4" />}
          colorClass="text-blue-600"
        />
        <StatCard
          label="Active Site Requisitions"
          value={`${mrs.length} Indents`}
          subtext="Civil & Interior MRs"
          icon={<PackagePlus className="w-4 h-4" />}
          colorClass="text-amber-600"
        />
        <StatCard
          label="Authorized Vendors"
          value={`${vendors.length} Suppliers`}
          subtext="UltraTech, Tata, Saint-Gobain"
          icon={<Building className="w-4 h-4" />}
          colorClass="text-purple-600"
        />
        <StatCard
          label="GRN Compliance Rate"
          value="99.2%"
          subtext="Quality Checked at Gate"
          icon={<FileCheck className="w-4 h-4" />}
          colorClass="text-emerald-600"
        />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 justify-between items-center text-xs font-semibold">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('PO')}
            className={`pb-2.5 transition-colors border-b-2 -mb-px flex items-center gap-2 ${
              activeTab === 'PO'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Purchase Orders Register ({pos.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('MR')}
            className={`pb-2.5 transition-colors border-b-2 -mb-px flex items-center gap-2 ${
              activeTab === 'MR'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <PackagePlus className="w-3.5 h-3.5" />
            <span>Material Requisitions ({mrs.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('WORKFLOW')}
            className={`pb-2.5 transition-colors border-b-2 -mb-px flex items-center gap-2 ${
              activeTab === 'WORKFLOW'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Procurement-to-Pay (P2P) Flow</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-blue-600 font-medium bg-blue-50 border border-blue-200/60 px-2.5 py-1 rounded-full">
          <span>💡 Double-click any PO row to open the formal document</span>
        </div>
      </div>

      {/* TAB 1: PURCHASE ORDERS */}
      {activeTab === 'PO' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xs font-bold text-slate-800">Master Purchase Order (PO) Register</h2>
              <p className="text-[11px] text-slate-500">
                Official issued POs with separate unique IDs, GST vendor details, and goods receipt status.
              </p>
            </div>
            <Button size="sm" onClick={() => handleOpenCreatePO()} icon={<Plus className="w-3.5 h-3.5" />}>
              Create New PO
            </Button>
          </div>
          <DataTable
            columns={[
              {
                key: 'po_number',
                header: 'PO Number / ID',
                render: (r) => (
                  <button
                    onClick={() => handleOpenViewPO(r)}
                    className="font-mono font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded text-xs transition-colors flex items-center gap-1"
                  >
                    <span>{r.po_number || r.poNumber}</span>
                  </button>
                ),
              },
              {
                key: 'vendor_name',
                header: 'Vendor / Supplier',
                render: (r) => (
                  <div>
                    <span className="font-semibold text-slate-800 text-xs">{r.vendor_name || r.vendor}</span>
                    {r.vendor_gstin && (
                      <div className="text-[10px] text-slate-400 font-mono">GST: {r.vendor_gstin}</div>
                    )}
                  </div>
                ),
              },
              {
                key: 'project_name',
                header: 'Project Site',
                render: (r) => (
                  <span className="text-xs text-slate-700 font-medium">
                    {r.project_name || 'The Grand Heritage Villas'}
                  </span>
                ),
              },
              {
                key: 'po_date',
                header: 'PO Date',
                render: (r) => <span className="font-mono text-xs text-slate-500">{r.po_date || r.date}</span>,
              },
              {
                key: 'total_amount_paise',
                header: 'Order Value (Incl. Tax)',
                render: (r) => (
                  <span className="font-mono font-bold text-xs text-slate-900">
                    {r.total_amount_paise ? formatInr(r.total_amount_paise) : '₹77,000'}
                  </span>
                ),
              },
              {
                key: 'status',
                header: 'Status',
                render: (r) => (
                  <Badge variant={r.status === 'RECEIVED' ? 'success' : r.status === 'APPROVED' ? 'info' : 'warning'}>
                    {r.status}
                  </Badge>
                ),
              },
              {
                key: 'actions',
                header: 'Action',
                render: (r) => (
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleOpenViewPO(r)}
                      className="px-2 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors flex items-center gap-1"
                      title="View Official Purchase Order"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      <span>View</span>
                    </button>
                    {r.status !== 'RECEIVED' && (
                      <button
                        onClick={() => handleMarkPoReceived(r.id)}
                        className="px-2 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded transition-colors flex items-center gap-1"
                        title="Mark goods received at site gate"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>GRN Inward</span>
                      </button>
                    )}
                  </div>
                ),
              },
            ]}
            data={pos}
            onRowDoubleClick={(row) => handleOpenViewPO(row)}
            doubleClickHint="Double-click to open formal Purchase Order document"
            exportFileName="purchase-orders-master"
            searchable
            searchPlaceholder="Search POs by number, vendor, or project..."
          />
        </div>
      )}

      {/* TAB 2: MATERIAL REQUISITIONS */}
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
                  <div
                    onClick={() => setActiveMR(r)}
                    className="cursor-pointer hover:text-blue-600 text-xs font-semibold text-slate-800"
                  >
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
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button size="sm" variant="ghost" onClick={() => setActiveMR(r)}>
                      Edit
                    </Button>
                    <button
                      onClick={() => handleOpenCreatePO(r)}
                      className="px-2 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
                      title="Convert this MR into a formal Purchase Order"
                    >
                      Generate PO
                    </button>
                    <button
                      onClick={() => handleDeleteMR(r.id)}
                      className="p-1 text-slate-400 hover:text-rose-600"
                      title="Delete Requisition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ),
              },
            ]}
            data={mrs}
            onRowDoubleClick={(row) => setActiveMR(row)}
            doubleClickHint="Double-click to open Requisition file"
            exportFileName="material-requisitions"
            searchable
            searchPlaceholder="Search requisitions..."
            searchFilter={(item, q) =>
              item.mr_number?.toLowerCase().includes(q) || item.project_name?.toLowerCase().includes(q)
            }
          />
        </div>
      )}

      {/* TAB 3: P2P WORKFLOW */}
      {activeTab === 'WORKFLOW' && (
        <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Enterprise Procure-to-Pay (P2P) Pipeline</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
            {[
              { step: '01. Material Indent (MR)', desc: 'Site Engineer raises requisition based on BOQ thresholds.', badge: 'DRAFT / SUBMITTED' },
              { step: '02. Purchase Order (PO)', desc: 'Purchase Manager issues binding contract with serial PO Number.', badge: 'APPROVED / ISSUED' },
              { step: '03. Gate Entry & GRN', desc: 'Material is weighed and inspected. Inventory stock ledger increments.', badge: 'INWARD POSTED' },
              { step: '04. Three-Way Matching', desc: 'Accounts matches PO + GRN + Vendor Tax Invoice for voucher release.', badge: 'PAYMENT VOUCHER' },
            ].map((st, i) => (
              <div key={i} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="text-xs font-bold text-blue-600">{st.step}</div>
                <div className="text-xs text-slate-600 leading-relaxed">{st.desc}</div>
                <Badge variant="purple">{st.badge}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CREATE PURCHASE ORDER MODAL (WITH SEPARATE PO ID & LINE ITEMS) */}
      {showPoModal && (
        <Modal
          open={showPoModal}
          onClose={() => setShowPoModal(false)}
          title="Create Commercial Purchase Order (PO)"
          size="lg"
        >
          <form onSubmit={handleSavePo} className="space-y-4">
            {poFormError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{poFormError}</span>
              </div>
            )}

            {/* Top row: Separate PO Number & Date */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-blue-50/60 p-3 rounded-xl border border-blue-200/70">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Purchase Order ID *
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={poNumber}
                    onChange={(e) => setPoNumber(e.target.value)}
                    required
                    placeholder="PO-2026-00001"
                    className="w-full border border-blue-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-blue-800 bg-white focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setPoNumber(`PO-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`);
                    }}
                    className="p-1.5 bg-white border border-blue-300 rounded-lg text-blue-600 hover:bg-blue-100"
                    title="Generate New Random Serial ID"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">PO Issue Date *</label>
                <input
                  type="date"
                  value={poDate}
                  onChange={(e) => setPoDate(e.target.value)}
                  required
                  className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono bg-white focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Expected Delivery Date *
                </label>
                <input
                  type="date"
                  value={expectedDate}
                  onChange={(e) => setExpectedDate(e.target.value)}
                  required
                  className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono bg-white focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Vendor & Project Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Authorized Vendor *
                </label>
                <select
                  value={vendorId}
                  onChange={(e) => setVendorId(e.target.value)}
                  required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">-- Choose Vendor --</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.city || 'Vendor'}) {v.gstin ? `· GST: ${v.gstin}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Destination Project Site *
                </label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">-- Choose Project Site --</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.project_code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Line Items Table */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Order Line Items ({poItems.length})
                </span>
                <button
                  type="button"
                  onClick={handleAddLineItem}
                  className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Line Item</span>
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                      <th className="p-2.5">Material Description</th>
                      <th className="p-2.5 w-24">Qty</th>
                      <th className="p-2.5 w-24">Unit</th>
                      <th className="p-2.5 w-28">Rate (₹)</th>
                      <th className="p-2.5 w-32 text-right">Line Total (₹)</th>
                      <th className="p-2.5 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {poItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => handleUpdateLineItem(item.id, 'description', e.target.value)}
                            required
                            className="w-full font-sans border border-slate-200 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleUpdateLineItem(item.id, 'quantity', Number(e.target.value))}
                            required
                            className="w-full border border-slate-200 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 font-bold"
                          />
                        </td>
                        <td className="p-2">
                          <select
                            value={item.unit}
                            onChange={(e) => handleUpdateLineItem(item.id, 'unit', e.target.value)}
                            className="w-full border border-slate-200 rounded px-1.5 py-1 text-xs focus:ring-1 focus:ring-blue-500 font-sans"
                          >
                            <option value="BAG">BAG</option>
                            <option value="TON">TON</option>
                            <option value="SQFT">SQFT</option>
                            <option value="CUM">CUM</option>
                            <option value="NOS">NOS</option>
                            <option value="KG">KG</option>
                            <option value="MTR">MTR</option>
                          </select>
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            min="1"
                            value={item.unitRateRupees}
                            onChange={(e) => handleUpdateLineItem(item.id, 'unitRateRupees', Number(e.target.value))}
                            required
                            className="w-full border border-slate-200 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 font-bold"
                          />
                        </td>
                        <td className="p-2 text-right font-bold text-slate-800">
                          ₹{((item.quantity || 0) * (item.unitRateRupees || 0)).toLocaleString('en-IN')}
                        </td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveLineItem(item.id)}
                            disabled={poItems.length <= 1}
                            className="text-slate-400 hover:text-rose-600 disabled:opacity-30"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Delivery Terms & Financial Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Payment Terms
                  </label>
                  <input
                    type="text"
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Delivery Site Address
                  </label>
                  <input
                    type="text"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Price Calculation Box */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal (Excl. Tax):</span>
                  <span className="font-mono font-bold">₹{subtotalRupees.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>GST Applicable (18%):</span>
                  <span className="font-mono font-bold">₹{gstRupees.toLocaleString('en-IN')}</span>
                </div>
                <div className="pt-2 border-t border-slate-300 flex justify-between font-bold text-slate-900 text-sm">
                  <span>Total Purchase Order Value:</span>
                  <span className="font-mono text-emerald-700">₹{grandTotalRupees.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <Button variant="secondary" type="button" onClick={() => setShowPoModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmittingPo}>
                {isSubmittingPo ? 'Issuing Purchase Order...' : 'Issue & Sign Purchase Order'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* FORMAL PURCHASE ORDER DOCUMENT & PRINT PREVIEW MODAL */}
      {viewPoData && (
        <Modal
          open={!!viewPoData}
          onClose={() => setViewPoData(null)}
          title={`Purchase Order: ${viewPoData.po.po_number || viewPoData.po.poNumber}`}
          size="lg"
        >
          <div className="space-y-5">
            {/* Action Bar */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Badge variant={viewPoData.po.status === 'RECEIVED' ? 'success' : 'info'}>
                  {viewPoData.po.status}
                </Badge>
                <span className="text-xs text-slate-500 font-mono">
                  Issued on: {viewPoData.po.po_date}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Formal PO</span>
                </button>
                {viewPoData.po.status !== 'RECEIVED' && (
                  <Button
                    size="sm"
                    onClick={() => handleMarkPoReceived(viewPoData.po.id)}
                    icon={<Check className="w-3.5 h-3.5" />}
                  >
                    Receive GRN Inward
                  </Button>
                )}
                <button
                  type="button"
                  onClick={() => handleDeletePo(viewPoData.po.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition-colors"
                  title="Cancel & Delete PO"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Formal Commercial Purchase Order Letterhead */}
            <div className="border border-slate-300 rounded-2xl p-6 bg-white space-y-6 text-slate-800 shadow-sm">
              {/* Header */}
              <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                <div>
                  <h2 className="text-lg font-black tracking-tight text-slate-900">
                    PROFICIENT TRANSFORMS PRIVATE LIMITED
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    BM Habitat Mall, Jayalakshmipuram, Mysuru, Karnataka 570012
                  </p>
                  <p className="text-xs text-slate-500 font-mono">GSTIN: 29AAACP0000A1Z5 · CIN: U45200KA2020PTC134567</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black uppercase tracking-widest text-blue-700 bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
                    PURCHASE ORDER
                  </span>
                  <div className="font-mono font-bold text-sm text-slate-900 mt-2">
                    {viewPoData.po.po_number || viewPoData.po.poNumber}
                  </div>
                  <div className="text-xs text-slate-500">Date: {viewPoData.po.po_date}</div>
                </div>
              </div>

              {/* Vendor & Delivery Information */}
              <div className="grid grid-cols-2 gap-6 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="font-bold uppercase tracking-wider text-slate-500 block text-[10px]">
                    VENDOR / SUPPLIER:
                  </span>
                  <div className="font-bold text-sm text-slate-900">{viewPoData.po.vendor_name}</div>
                  <div className="text-slate-600">Location: {viewPoData.po.vendor_city || 'Karnataka, India'}</div>
                  {viewPoData.po.vendor_gstin && (
                    <div className="font-mono text-slate-700 font-semibold">GSTIN: {viewPoData.po.vendor_gstin}</div>
                  )}
                  {viewPoData.po.vendor_phone && (
                    <div className="text-slate-500">Phone: {viewPoData.po.vendor_phone}</div>
                  )}
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="font-bold uppercase tracking-wider text-slate-500 block text-[10px]">
                    DELIVERY SITE &amp; TERMS:
                  </span>
                  <div className="font-bold text-sm text-slate-900">
                    {viewPoData.po.project_name || 'The Grand Heritage Villas'}
                  </div>
                  <div className="text-slate-600">
                    Expected Delivery: <strong>{viewPoData.po.expected_delivery_date || '7 Days from PO'}</strong>
                  </div>
                  <div className="text-slate-600">
                    Payment Terms: <strong>{viewPoData.po.payment_terms || '30 Days Net from Delivery'}</strong>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider">
                      <th className="p-3">#</th>
                      <th className="p-3">Item Description</th>
                      <th className="p-3 text-right">Qty</th>
                      <th className="p-3">Unit</th>
                      <th className="p-3 text-right">Unit Rate</th>
                      <th className="p-3 text-right">Total Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {viewPoData.items.map((it: any, index: number) => {
                      const totalPaise = it.total_paise || (it.quantity * it.unit_rate_paise) || 0;
                      return (
                        <tr key={index}>
                          <td className="p-3 font-bold text-slate-400">{index + 1}</td>
                          <td className="p-3 font-sans font-medium text-slate-900">
                            {it.description || it.material_name || 'Building Material'}
                          </td>
                          <td className="p-3 text-right font-bold">{it.quantity}</td>
                          <td className="p-3 font-sans">{it.unit || 'BAG'}</td>
                          <td className="p-3 text-right">{formatInr(it.unit_rate_paise || 38500)}</td>
                          <td className="p-3 text-right font-bold text-slate-900">
                            {formatInr(totalPaise)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Financial Total Box */}
              <div className="flex justify-end">
                <div className="w-72 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Taxable Value:</span>
                    <span className="font-mono font-bold">
                      {formatInr(viewPoData.po.total_amount_paise || 7700000)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>GST (18%):</span>
                    <span className="font-mono font-bold">
                      {formatInr(Math.round((viewPoData.po.total_amount_paise || 7700000) * 0.18))}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-300 flex justify-between font-bold text-sm text-slate-900">
                    <span>Grand Total:</span>
                    <span className="font-mono text-emerald-700">
                      {formatInr(Math.round((viewPoData.po.total_amount_paise || 7700000) * 1.18))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Signatures */}
              <div className="pt-8 flex justify-between items-end border-t border-slate-200 text-xs">
                <div>
                  <div className="text-[11px] text-slate-400">Prepared By:</div>
                  <div className="font-semibold text-slate-800">Procurement Department</div>
                </div>
                <div className="text-right">
                  <div className="w-48 border-b border-slate-400 pb-1 mb-1 font-serif text-slate-800 italic text-center">
                    Authorized Signatory
                  </div>
                  <div className="text-[10px] text-slate-500 text-center font-mono">
                    FOR PROFICIENT TRANSFORMS PVT LTD
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* AutoSave Material Requisition Modal */}
      {activeMR && (
        <Modal
          open={!!activeMR}
          onClose={() => setActiveMR(null)}
          title={`Material Requisition: ${activeMR.mr_number || 'New Requisition'}`}
          size="lg"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="text-xs text-slate-600">
                Status: <strong>{activeMR.status || 'DRAFT'}</strong>
              </div>
              <AutoSaveIndicator status={saveStatus} lastSavedAt={lastSaved} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Required By Date
                </label>
                <AutoSaveInput
                  value={activeMR.required_date || ''}
                  onSave={(val) => handleMRFieldSave('required_date', val)}
                  type="date"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
                <AutoSaveSelect
                  value={activeMR.priority || 'MEDIUM'}
                  onSave={(val) => handleMRFieldSave('priority', val)}
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="URGENT">URGENT</option>
                </AutoSaveSelect>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Special Notes</label>
              <AutoSaveInput
                value={activeMR.notes || ''}
                onSave={(val) => handleMRFieldSave('notes', val)}
                placeholder="Enter scope, site contact, or delivery notes..."
              />
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-200">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  handleOpenCreatePO(activeMR);
                  setActiveMR(null);
                }}
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                Convert to Purchase Order
              </Button>
              <Button size="sm" onClick={() => setActiveMR(null)}>
                Done
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
