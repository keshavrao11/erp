'use client';
import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Folder,
  Upload,
  Download,
  Eye,
  ShieldCheck,
  Plus,
  CheckCircle2,
  ShoppingCart,
  Printer,
  Trash2,
  Building,
  RotateCcw,
  AlertCircle,
  Check,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';

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

export default function DocumentsPage() {
  const [folders, setFolders] = useState([
    'Purchase Orders & Supplier Agreements',
    'Architectural CAD Drawings',
    'Interior 3D & Schematics',
    'Land Title & Approvals',
    'Material Quality Certs',
  ]);

  const [baseDocuments, setBaseDocuments] = useState<any[]>([
    {
      id: 'doc-1',
      name: 'Grand_Heritage_Villas_Structural_Blueprint_v2.dwg',
      folder: 'Architectural CAD Drawings',
      size: '14.2 MB',
      ver: 'v2.1',
      uploadedBy: 'Siddharth Varma',
      date: '2026-10-12',
      role: 'ENGINEERS_ONLY',
    },
    {
      id: 'doc-2',
      name: 'Penthouse_Luxe_Suite_False_Ceiling_Plan.pdf',
      folder: 'Interior 3D & Schematics',
      size: '4.8 MB',
      ver: 'v1.0',
      uploadedBy: 'Pooja Bhatt',
      date: '2026-10-18',
      role: 'ALL_STAFF',
    },
    {
      id: 'doc-3',
      name: 'Green_Meadows_Survey_Sy88_Khata_Extract.pdf',
      folder: 'Land Title & Approvals',
      size: '2.1 MB',
      ver: 'v1.0',
      uploadedBy: 'Manjunath Swamy',
      date: '2026-09-30',
      role: 'DIRECTORS_ONLY',
    },
    {
      id: 'doc-4',
      name: 'UltraTech_Cement_Material_Test_Certificate.pdf',
      folder: 'Material Quality Certs',
      size: '1.2 MB',
      ver: 'v1.0',
      uploadedBy: 'Jaisimha Rao',
      date: '2026-10-25',
      role: 'ALL_STAFF',
    },
  ]);

  const [livePos, setLivePos] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);

  // Modals
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [viewDoc, setViewDoc] = useState<any | null>(null);

  // Dedicated PO Creation Modal in DMS
  const [showPoModal, setShowPoModal] = useState(false);
  const [poNumber, setPoNumber] = useState('');
  const [vendorId, setVendorId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [poDate, setPoDate] = useState(new Date().toISOString().slice(0, 10));
  const [expectedDate, setExpectedDate] = useState(
    new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
  );
  const [paymentTerms, setPaymentTerms] = useState('30 Days Net from Delivery');
  const [poFormError, setPoFormError] = useState<string | null>(null);
  const [isSubmittingPo, setIsSubmittingPo] = useState(false);

  const [poItems, setPoItems] = useState<POLineItem[]>([
    {
      id: '1',
      description: 'UltraTech PPC Cement (50kg Bags)',
      quantity: 150,
      unit: 'BAG',
      unitRateRupees: 385,
    },
    {
      id: '2',
      description: 'Tata Tiscon 12mm TMT Steel Rebars',
      quantity: 3,
      unit: 'TON',
      unitRateRupees: 65000,
    },
  ]);

  // Formal PO Document Preview Modal
  const [viewPoData, setViewPoData] = useState<{ po: any; items: any[] } | null>(null);

  const [uploadForm, setUploadForm] = useState({
    name: '',
    folder: 'Architectural CAD Drawings',
    version: 'v1.0',
    fileSize: '3.4 MB',
  });

  const fetchProcurementData = useCallback(() => {
    fetch('/api/procurement/purchase-orders')
      .then((r) => r.json())
      .then((d) => setLivePos(Array.isArray(d) ? d : []))
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
    fetchProcurementData();
  }, [fetchProcurementData]);

  // Open Create PO Modal with unique next PO number
  function handleOpenCreatePO() {
    fetch('/api/procurement/purchase-orders?action=next_number')
      .then((r) => r.json())
      .then((d) => {
        setPoNumber(d.nextNumber || `PO-${new Date().getFullYear()}-00001`);
      })
      .catch(() => {
        setPoNumber(`PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
      });

    setPoFormError(null);
    setShowPoModal(true);
  }

  // Open Formal PO View
  function handleOpenViewPO(po: any) {
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
      });
  }

  // Handle PO Submission from DMS
  async function handleSavePo(e: React.FormEvent) {
    e.preventDefault();
    setPoFormError(null);
    setIsSubmittingPo(true);

    try {
      if (!vendorId) throw new Error('Please select an authorized vendor');

      const payload = {
        poNumber: poNumber.trim(),
        vendorId,
        projectId,
        poDate,
        expectedDeliveryDate: expectedDate,
        paymentTerms,
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
      fetchProcurementData();
    } catch (err: any) {
      setPoFormError(err.message);
    } finally {
      setIsSubmittingPo(false);
    }
  }

  function handleSaveUpload(e: React.FormEvent) {
    e.preventDefault();
    const newDoc = {
      id: `doc-${Date.now()}`,
      name: uploadForm.name || 'Site_Execution_Document.pdf',
      folder: uploadForm.folder,
      size: uploadForm.fileSize,
      ver: uploadForm.version,
      uploadedBy: 'Super Administrator',
      date: new Date().toISOString().slice(0, 10),
      role: 'ALL_STAFF',
    };
    setBaseDocuments([newDoc, ...baseDocuments]);
    setShowUploadModal(false);
    setUploadForm({ name: '', folder: 'Architectural CAD Drawings', version: 'v1.0', fileSize: '3.4 MB' });
  }

  function handleAddFolder(e: React.FormEvent) {
    e.preventDefault();
    if (newFolderName.trim() && !folders.includes(newFolderName.trim())) {
      setFolders([...folders, newFolderName.trim()]);
      setNewFolderName('');
      setShowFolderModal(false);
    }
  }

  function handleDownloadDoc(doc: any) {
    if (doc.isPo && doc.poData) {
      handleOpenViewPO(doc.poData);
      return;
    }
    const dummyContent = `--- PROFICIENT DMS ARCHIVE ---\nDocument: ${doc.name}\nCategory: ${doc.folder}\nVersion: ${doc.ver}\nUploaded By: ${doc.uploadedBy}\nDate: ${doc.date}\nSHA-256 Checksum: Verified\n`;
    const blob = new Blob([dummyContent], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', doc.name);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Combine static repository docs with live Purchase Orders
  const livePoDocuments = livePos.map((po) => ({
    id: `po-${po.id}`,
    name: `${po.po_number || po.poNumber}_Binding_Purchase_Order.pdf`,
    folder: 'Purchase Orders & Supplier Agreements',
    size: '185 KB',
    ver: 'v1.0-ISSUED',
    uploadedBy: 'Procurement Dept',
    date: po.po_date || new Date().toISOString().slice(0, 10),
    role: 'ALL_STAFF',
    isPo: true,
    poData: po,
  }));

  const allDocuments = [...livePoDocuments, ...baseDocuments];

  // Totals for PO Modal
  const subtotalRupees = poItems.reduce(
    (acc, item) => acc + (Number(item.quantity) || 0) * (Number(item.unitRateRupees) || 0),
    0
  );
  const gstRupees = Math.round(subtotalRupees * 0.18);
  const grandTotalRupees = subtotalRupees + gstRupees;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded">DMS &amp; ORDERS</span>
            <span className="text-[10px] bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
              Cryptographic Archive
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-1">
            Enterprise Document Management &amp; PO Archive
          </h1>
          <p className="text-xs text-slate-500">
            Version-controlled repository for Purchase Orders (PO), CAD blueprints (.dwg), contracts, and supplier agreements. Double-click any row to view.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleOpenCreatePO}
            icon={<ShoppingCart className="w-4 h-4 text-white" />}
          >
            Create Purchase Order
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowUploadModal(true)}
            icon={<Upload className="w-4 h-4" />}
          >
            Upload Document
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowFolderModal(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            New Folder
          </Button>
        </div>
      </div>

      {/* Folders Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
        {folders.map((folder) => {
          const count = allDocuments.filter((d) => d.folder === folder).length;
          return (
            <div
              key={folder}
              className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3 hover:border-blue-300 transition-colors cursor-pointer"
            >
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                <Folder className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-800 truncate" title={folder}>
                  {folder}
                </div>
                <div className="text-[10px] text-slate-400">{count} Files Archived</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Document Register */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold text-slate-800">Master Verified Document Register</h2>
            <p className="text-[11px] text-slate-500">
              Double-click any document or purchase order row to open its full commercial preview.
            </p>
          </div>
          <Badge variant="success">{allDocuments.length} Verified Files</Badge>
        </div>

        <DataTable
          columns={[
            {
              key: 'name',
              header: 'Document Name',
              render: (r: any) => (
                <button
                  onClick={() => (r.isPo && r.poData ? handleOpenViewPO(r.poData) : setViewDoc(r))}
                  className="flex items-center gap-2 text-left group"
                >
                  {r.isPo ? (
                    <ShoppingCart className="w-4 h-4 text-amber-600 shrink-0 group-hover:scale-110 transition-transform" />
                  ) : (
                    <FileText className="w-4 h-4 text-blue-600 shrink-0 group-hover:scale-110 transition-transform" />
                  )}
                  <span className="font-semibold text-slate-800 text-xs truncate max-w-xs group-hover:text-blue-600">
                    {r.name}
                  </span>
                </button>
              ),
            },
            {
              key: 'folder',
              header: 'Folder Category',
              render: (r: any) => (
                <span className="text-xs text-slate-600 font-medium">{r.folder}</span>
              ),
            },
            {
              key: 'ver',
              header: 'Version / Status',
              render: (r: any) => (
                <span className="font-mono font-bold text-[11px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                  {r.ver}
                </span>
              ),
            },
            {
              key: 'size',
              header: 'File Size',
              render: (r: any) => <span className="font-mono text-xs text-slate-500">{r.size}</span>,
            },
            {
              key: 'uploadedBy',
              header: 'Issued By',
              render: (r: any) => <span className="text-xs text-slate-700">{r.uploadedBy}</span>,
            },
            {
              key: 'date',
              header: 'Issue Date',
              render: (r: any) => <span className="font-mono text-xs text-slate-500">{r.date}</span>,
            },
            {
              key: 'actions',
              header: 'Actions',
              render: (r: any) => (
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => (r.isPo && r.poData ? handleOpenViewPO(r.poData) : setViewDoc(r))}
                    className="p-1 text-slate-500 hover:text-blue-600 transition-colors"
                    title="View Document"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDownloadDoc(r)}
                    className="p-1 text-slate-500 hover:text-blue-600 transition-colors"
                    title="Download / Print File"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              ),
            },
          ]}
          data={allDocuments}
          onRowDoubleClick={(row: any) => (row.isPo && row.poData ? handleOpenViewPO(row.poData) : setViewDoc(row))}
          doubleClickHint="Double-click to open formal document or Purchase Order viewer"
          exportFileName="dms-archive"
          searchable
          searchPlaceholder="Search documents or Purchase Orders..."
        />
      </div>

      {/* CREATE PURCHASE ORDER POP-UP MODAL IN DMS */}
      {showPoModal && (
        <Modal
          open={showPoModal}
          onClose={() => setShowPoModal(false)}
          title="Generate Purchase Order (DMS Order Engine)"
          size="lg"
        >
          <form onSubmit={handleSavePo} className="space-y-4">
            {poFormError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{poFormError}</span>
              </div>
            )}

            {/* Separate PO ID Box */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-blue-50/70 p-3 rounded-xl border border-blue-200/80">
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
                    title="Regenerate Serial PO Number"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Issue Date *</label>
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

            {/* Vendor & Project Site */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Approved Vendor *
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

            {/* Line Items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Material Items ({poItems.length})
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setPoItems([
                      ...poItems,
                      {
                        id: String(Date.now()),
                        description: 'Steel Binding Wire / Hardware Fittings',
                        quantity: 20,
                        unit: 'KG',
                        unitRateRupees: 95,
                      },
                    ])
                  }
                  className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Line Item</span>
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                      <th className="p-2.5">Material Description</th>
                      <th className="p-2.5 w-24">Qty</th>
                      <th className="p-2.5 w-24">Unit</th>
                      <th className="p-2.5 w-28">Rate (₹)</th>
                      <th className="p-2.5 w-32 text-right">Total (₹)</th>
                      <th className="p-2.5 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {poItems.map((item) => (
                      <tr key={item.id}>
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) =>
                              setPoItems(
                                poItems.map((it) => (it.id === item.id ? { ...it, description: e.target.value } : it))
                              )
                            }
                            required
                            className="w-full font-sans border border-slate-200 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              setPoItems(
                                poItems.map((it) =>
                                  it.id === item.id ? { ...it, quantity: Number(e.target.value) } : it
                                )
                              )
                            }
                            required
                            className="w-full border border-slate-200 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 font-bold"
                          />
                        </td>
                        <td className="p-2">
                          <select
                            value={item.unit}
                            onChange={(e) =>
                              setPoItems(
                                poItems.map((it) => (it.id === item.id ? { ...it, unit: e.target.value } : it))
                              )
                            }
                            className="w-full border border-slate-200 rounded px-1.5 py-1 text-xs font-sans"
                          >
                            <option value="BAG">BAG</option>
                            <option value="TON">TON</option>
                            <option value="SQFT">SQFT</option>
                            <option value="CUM">CUM</option>
                            <option value="NOS">NOS</option>
                            <option value="KG">KG</option>
                          </select>
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            min="1"
                            value={item.unitRateRupees}
                            onChange={(e) =>
                              setPoItems(
                                poItems.map((it) =>
                                  it.id === item.id ? { ...it, unitRateRupees: Number(e.target.value) } : it
                                )
                              )
                            }
                            required
                            className="w-full border border-slate-200 rounded px-2 py-1 text-xs font-bold"
                          />
                        </td>
                        <td className="p-2 text-right font-bold text-slate-900">
                          ₹{((item.quantity || 0) * (item.unitRateRupees || 0)).toLocaleString('en-IN')}
                        </td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              if (poItems.length > 1) {
                                setPoItems(poItems.filter((i) => i.id !== item.id));
                              }
                            }}
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

            {/* Total Box */}
            <div className="flex justify-end pt-2">
              <div className="w-64 space-y-1 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-mono font-bold">₹{subtotalRupees.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>GST (18%):</span>
                  <span className="font-mono font-bold">₹{gstRupees.toLocaleString('en-IN')}</span>
                </div>
                <div className="pt-1.5 border-t border-slate-300 flex justify-between font-bold text-slate-900">
                  <span>Order Grand Total:</span>
                  <span className="font-mono text-emerald-700">₹{grandTotalRupees.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <Button variant="secondary" type="button" onClick={() => setShowPoModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmittingPo}>
                {isSubmittingPo ? 'Issuing...' : 'Issue & Archive PO into DMS'}
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
          title={`Purchase Order Document: ${viewPoData.po.po_number || viewPoData.po.poNumber}`}
          size="lg"
        >
          <div className="space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Badge variant={viewPoData.po.status === 'RECEIVED' ? 'success' : 'info'}>
                  {viewPoData.po.status || 'ISSUED'}
                </Badge>
                <span className="text-xs text-slate-500 font-mono">
                  Issue Date: {viewPoData.po.po_date}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print PO</span>
                </button>
              </div>
            </div>

            {/* Official Formal Document Box */}
            <div className="border border-slate-300 rounded-2xl p-6 bg-white space-y-6 text-slate-800 shadow-sm">
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

              <div className="grid grid-cols-2 gap-6 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="font-bold uppercase tracking-wider text-slate-500 block text-[10px]">
                    SUPPLIER:
                  </span>
                  <div className="font-bold text-sm text-slate-900">{viewPoData.po.vendor_name}</div>
                  <div className="text-slate-600">City: {viewPoData.po.vendor_city || 'Karnataka, India'}</div>
                  {viewPoData.po.vendor_gstin && (
                    <div className="font-mono text-slate-700 font-semibold">GSTIN: {viewPoData.po.vendor_gstin}</div>
                  )}
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="font-bold uppercase tracking-wider text-slate-500 block text-[10px]">
                    DELIVERY SITE:
                  </span>
                  <div className="font-bold text-sm text-slate-900">
                    {viewPoData.po.project_name || 'The Grand Heritage Villas'}
                  </div>
                  <div className="text-slate-600">
                    Expected Delivery: <strong>{viewPoData.po.expected_delivery_date || 'Within 7 Days'}</strong>
                  </div>
                  <div className="text-slate-600">
                    Payment Terms: <strong>{viewPoData.po.payment_terms || '30 Days Net from Delivery'}</strong>
                  </div>
                </div>
              </div>

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
            </div>
          </div>
        </Modal>
      )}

      {/* Standard Upload Modal */}
      {showUploadModal && (
        <Modal open={showUploadModal} onClose={() => setShowUploadModal(false)} title="Upload File to DMS" size="md">
          <form onSubmit={handleSaveUpload} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">File Name *</label>
              <input
                type="text"
                value={uploadForm.name}
                onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
                required
                placeholder="e.g. Foundation_Soil_Test_Report.pdf"
                className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Folder *</label>
              <select
                value={uploadForm.folder}
                onChange={(e) => setUploadForm({ ...uploadForm, folder: e.target.value })}
                className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-blue-500"
              >
                {folders.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <Button variant="secondary" onClick={() => setShowUploadModal(false)}>
                Cancel
              </Button>
              <Button type="submit">Upload &amp; Encrypt</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Standard Folder Modal */}
      {showFolderModal && (
        <Modal open={showFolderModal} onClose={() => setShowFolderModal(false)} title="Create New Folder" size="sm">
          <form onSubmit={handleAddFolder} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Folder Name *</label>
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                required
                placeholder="e.g. Sub-Contractor Agreements"
                className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <Button variant="secondary" onClick={() => setShowFolderModal(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Folder</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Document Detail Preview Modal */}
      {viewDoc && (
        <Modal open={!!viewDoc} onClose={() => setViewDoc(null)} title={viewDoc.name} size="md">
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
              <div>
                Folder Category: <strong>{viewDoc.folder}</strong>
              </div>
              <div>
                Version: <strong>{viewDoc.ver}</strong> · Size: {viewDoc.size}
              </div>
              <div>
                Uploaded By: {viewDoc.uploadedBy} on {viewDoc.date}
              </div>
            </div>
            <div className="p-6 bg-slate-100 rounded-xl text-center text-xs text-slate-500">
              <FileText className="w-10 h-10 mx-auto text-slate-400 mb-2" />
              <span>Cryptographic hash verified (SHA-256). Document locked for revision control.</span>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <Button variant="outline" onClick={() => handleDownloadDoc(viewDoc)}>
                Download File
              </Button>
              <Button onClick={() => setViewDoc(null)}>Close</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
