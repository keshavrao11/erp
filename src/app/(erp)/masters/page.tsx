'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Sliders, Users, Truck, Boxes, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { AutoSaveIndicator, SaveStatus } from '@/components/ui/AutoSaveIndicator';
import { AutoSaveInput } from '@/components/ui/AutoSaveInput';
import { AutoSaveSelect } from '@/components/ui/AutoSaveSelect';

export default function MastersPage() {
  const [activeTab, setActiveTab] = useState<'CUSTOMERS' | 'VENDORS' | 'MATERIALS' | 'TAX'>('CUSTOMERS');
  const [customers, setCustomers] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);

  const [activeCustomer, setActiveCustomer] = useState<any | null>(null);
  const [activeVendor, setActiveVendor] = useState<any | null>(null);
  const [activeMaterial, setActiveMaterial] = useState<any | null>(null);

  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const fetchAll = useCallback(() => {
    fetch('/api/masters/customers').then(r => r.json()).then(d => setCustomers(Array.isArray(d) ? d : [])).catch(() => {});
    fetch('/api/masters/vendors').then(r => r.json()).then(d => setVendors(Array.isArray(d) ? d : [])).catch(() => {});
    fetch('/api/masters/materials').then(r => r.json()).then(d => setMaterials(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Zero-Click Draft Creation
  async function handleCreateCustomer() {
    setSaveStatus('saving');
    const res = await fetch('/api/masters/customers/draft', { method: 'POST' });
    const draft = await res.json();
    setActiveCustomer(draft);
    setSaveStatus('saved');
    setLastSaved(new Date());
    fetchAll();
  }

  async function handleCreateVendor() {
    setSaveStatus('saving');
    const res = await fetch('/api/masters/vendors/draft', { method: 'POST' });
    const draft = await res.json();
    setActiveVendor(draft);
    setSaveStatus('saved');
    setLastSaved(new Date());
    fetchAll();
  }

  async function handleCreateMaterial() {
    setSaveStatus('saving');
    const res = await fetch('/api/masters/materials/draft', { method: 'POST' });
    const draft = await res.json();
    setActiveMaterial(draft);
    setSaveStatus('saved');
    setLastSaved(new Date());
    fetchAll();
  }

  // AutoSave Handlers
  async function saveCustomerField(field: string, value: any) {
    if (!activeCustomer) return;
    setSaveStatus('saving');
    await fetch(`/api/masters/customers/${activeCustomer.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value }),
    });
    setSaveStatus('saved');
    setLastSaved(new Date());
    fetchAll();
  }

  async function saveVendorField(field: string, value: any) {
    if (!activeVendor) return;
    setSaveStatus('saving');
    await fetch(`/api/masters/vendors/${activeVendor.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value }),
    });
    setSaveStatus('saved');
    setLastSaved(new Date());
    fetchAll();
  }

  async function saveMaterialField(field: string, value: any) {
    if (!activeMaterial) return;
    setSaveStatus('saving');
    await fetch(`/api/masters/materials/${activeMaterial.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value }),
    });
    setSaveStatus('saved');
    setLastSaved(new Date());
    fetchAll();
  }

  const taxCodes = [
    { code: 'GST-18', name: 'GST 18% (Works Contract & Services)', rate: '18.0%', cgst: '9.0%', sgst: '9.0%', igst: '0.0%' },
    { code: 'GST-12', name: 'GST 12% (Construction Materials)', rate: '12.0%', cgst: '6.0%', sgst: '6.0%', igst: '0.0%' },
    { code: 'GST-5', name: 'GST 5% (Affordable Housing Scheme)', rate: '5.0%', cgst: '2.5%', sgst: '2.5%', igst: '0.0%' },
    { code: 'EXEMPT', name: 'Exempt / Zero Rate (Plotted Land Sale)', rate: '0.0%', cgst: '0.0%', sgst: '0.0%', igst: '0.0%' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Central Master Data Administration</h1>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
              Zero-Click AutoSave
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Unified directory of verified customers, suppliers/vendors, and material items with instant persistence.
          </p>
        </div>
        <Button
          onClick={() => {
            if (activeTab === 'CUSTOMERS') handleCreateCustomer();
            else if (activeTab === 'VENDORS') handleCreateVendor();
            else if (activeTab === 'MATERIALS') handleCreateMaterial();
          }}
          icon={<Plus className="w-4 h-4" />}
        >
          Add {activeTab === 'CUSTOMERS' ? 'Customer' : activeTab === 'VENDORS' ? 'Vendor' : 'Material'} (AutoSave)
        </Button>
      </div>

      <div className="flex border-b border-slate-200 gap-6 text-xs font-semibold">
        {(['CUSTOMERS', 'VENDORS', 'MATERIALS', 'TAX'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2.5 transition-colors border-b-2 -mb-px ${
              activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab === 'CUSTOMERS' ? 'Customers Master' : tab === 'VENDORS' ? 'Vendors & Suppliers' : tab === 'MATERIALS' ? 'Materials & SKUs' : 'Tax Codes & Rates'}
          </button>
        ))}
      </div>

      {activeTab === 'CUSTOMERS' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <DataTable
            columns={[
              {
                key: 'customer_code',
                header: 'Customer Code',
                render: (r) => (
                  <button
                    onClick={() => setActiveCustomer(r)}
                    className="font-mono font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded text-xs transition-colors"
                  >
                    {r.customer_code}
                  </button>
                ),
              },
              {
                key: 'full_name',
                header: 'Customer Name',
                render: (r) => (
                  <div onClick={() => setActiveCustomer(r)} className="cursor-pointer hover:text-blue-600 font-semibold text-slate-800 text-xs">
                    {r.full_name}
                  </div>
                ),
              },
              { key: 'company_name', header: 'Company / Org', render: (r) => <span className="text-xs text-slate-600">{r.company_name || 'Individual'}</span> },
              { key: 'phone', header: 'Phone', render: (r) => <span className="font-mono text-xs">{r.phone || '—'}</span> },
              { key: 'pan', header: 'PAN', render: (r) => <span className="font-mono text-xs text-slate-500">{r.pan || '—'}</span> },
              {
                key: 'actions',
                header: 'Actions',
                render: (r) => (
                  <Button size="sm" variant="ghost" onClick={() => setActiveCustomer(r)}>
                    Edit
                  </Button>
                ),
              },
            ]}
            data={customers}
            searchable
            searchPlaceholder="Search customers..."
            searchFilter={(item, q) => item.full_name?.toLowerCase().includes(q) || item.customer_code?.toLowerCase().includes(q)}
          />
        </div>
      )}

      {activeTab === 'VENDORS' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <DataTable
            columns={[
              {
                key: 'vendor_code',
                header: 'Vendor Code',
                render: (r) => (
                  <button
                    onClick={() => setActiveVendor(r)}
                    className="font-mono font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded text-xs transition-colors"
                  >
                    {r.vendor_code}
                  </button>
                ),
              },
              {
                key: 'name',
                header: 'Supplier / Vendor Name',
                render: (r) => (
                  <div onClick={() => setActiveVendor(r)} className="cursor-pointer hover:text-blue-600 font-semibold text-slate-800 text-xs">
                    {r.name}
                  </div>
                ),
              },
              { key: 'contact_person', header: 'Contact Person', render: (r) => <span className="text-xs text-slate-700">{r.contact_person || '—'}</span> },
              { key: 'phone', header: 'Phone', render: (r) => <span className="font-mono text-xs">{r.phone || '—'}</span> },
              { key: 'gstin', header: 'GSTIN', render: (r) => <span className="font-mono text-xs text-slate-600">{r.gstin || '—'}</span> },
              {
                key: 'actions',
                header: 'Actions',
                render: (r) => (
                  <Button size="sm" variant="ghost" onClick={() => setActiveVendor(r)}>
                    Edit
                  </Button>
                ),
              },
            ]}
            data={vendors}
            searchable
            searchPlaceholder="Search vendors..."
            searchFilter={(item, q) => item.name?.toLowerCase().includes(q) || item.vendor_code?.toLowerCase().includes(q)}
          />
        </div>
      )}

      {activeTab === 'MATERIALS' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <DataTable
            columns={[
              {
                key: 'material_code',
                header: 'Material SKU',
                render: (r) => (
                  <button
                    onClick={() => setActiveMaterial(r)}
                    className="font-mono font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded text-xs transition-colors"
                  >
                    {r.material_code}
                  </button>
                ),
              },
              {
                key: 'name',
                header: 'Material Name',
                render: (r) => (
                  <div onClick={() => setActiveMaterial(r)} className="cursor-pointer hover:text-blue-600 font-semibold text-slate-800 text-xs">
                    {r.name}
                  </div>
                ),
              },
              { key: 'category_name', header: 'Category', render: (r) => <span className="text-xs text-slate-600">{r.category_name}</span> },
              { key: 'unit_of_measure', header: 'Unit of Measure', render: (r) => <span className="font-mono text-xs font-medium">{r.unit_of_measure}</span> },
              {
                key: 'actions',
                header: 'Actions',
                render: (r) => (
                  <Button size="sm" variant="ghost" onClick={() => setActiveMaterial(r)}>
                    Edit
                  </Button>
                ),
              },
            ]}
            data={materials}
            searchable
            searchPlaceholder="Search materials..."
            searchFilter={(item, q) => item.name?.toLowerCase().includes(q) || item.material_code?.toLowerCase().includes(q)}
          />
        </div>
      )}

      {activeTab === 'TAX' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <DataTable
            columns={[
              { key: 'code', header: 'Tax Code', render: (r) => <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-xs">{r.code}</span> },
              { key: 'name', header: 'Tax Description', render: (r) => <span className="font-semibold text-slate-800 text-xs">{r.name}</span> },
              { key: 'rate', header: 'Effective Rate', render: (r) => <span className="font-mono font-bold text-slate-900 text-xs">{r.rate}</span> },
              { key: 'cgst', header: 'CGST', render: (r) => <span className="font-mono text-xs">{r.cgst}</span> },
              { key: 'sgst', header: 'SGST', render: (r) => <span className="font-mono text-xs">{r.sgst}</span> },
            ]}
            data={taxCodes}
          />
        </div>
      )}

      {/* Customer AutoSave Modal */}
      {activeCustomer && (
        <Modal
          open={!!activeCustomer}
          onClose={() => setActiveCustomer(null)}
          title={`Customer Record: ${activeCustomer.customer_code}`}
          size="md"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-xs text-slate-500">Record ID: {activeCustomer.id.slice(0, 8)}...</span>
              <AutoSaveIndicator status={saveStatus} lastSavedAt={lastSaved} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Full Name</label>
              <AutoSaveInput
                value={activeCustomer.full_name || ''}
                onSave={(val) => saveCustomerField('fullName', val)}
                placeholder="e.g. Dr. Ramesh Narayan"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                <AutoSaveInput
                  value={activeCustomer.phone || ''}
                  onSave={(val) => saveCustomerField('phone', val)}
                  placeholder="Mobile"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <AutoSaveInput
                  value={activeCustomer.email || ''}
                  onSave={(val) => saveCustomerField('email', val)}
                  placeholder="email"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Organization</label>
                <AutoSaveInput
                  value={activeCustomer.company_name || ''}
                  onSave={(val) => saveCustomerField('companyName', val)}
                  placeholder="Company name"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">PAN Number</label>
                <AutoSaveInput
                  value={activeCustomer.pan || ''}
                  onSave={(val) => saveCustomerField('pan', val)}
                  placeholder="PAN"
                />
              </div>
            </div>
            <div className="flex justify-end pt-3 border-t border-slate-200">
              <Button variant="secondary" onClick={() => setActiveCustomer(null)}>Close</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Vendor AutoSave Modal */}
      {activeVendor && (
        <Modal
          open={!!activeVendor}
          onClose={() => setActiveVendor(null)}
          title={`Vendor Supplier: ${activeVendor.vendor_code}`}
          size="md"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-xs text-slate-500">Record ID: {activeVendor.id.slice(0, 8)}...</span>
              <AutoSaveIndicator status={saveStatus} lastSavedAt={lastSaved} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Vendor Entity Name</label>
              <AutoSaveInput
                value={activeVendor.name || ''}
                onSave={(val) => saveVendorField('name', val)}
                placeholder="e.g. UltraTech Cement Dealership"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Person</label>
                <AutoSaveInput
                  value={activeVendor.contact_person || ''}
                  onSave={(val) => saveVendorField('contactPerson', val)}
                  placeholder="Name"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                <AutoSaveInput
                  value={activeVendor.phone || ''}
                  onSave={(val) => saveVendorField('phone', val)}
                  placeholder="Phone"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">GSTIN</label>
                <AutoSaveInput
                  value={activeVendor.gstin || ''}
                  onSave={(val) => saveVendorField('gstin', val)}
                  placeholder="GSTIN"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Credit Terms (Days)</label>
                <AutoSaveInput
                  type="number"
                  value={activeVendor.payment_terms_days || 30}
                  onSave={(val) => saveVendorField('paymentTermsDays', Number(val))}
                />
              </div>
            </div>
            <div className="flex justify-end pt-3 border-t border-slate-200">
              <Button variant="secondary" onClick={() => setActiveVendor(null)}>Close</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Material AutoSave Modal */}
      {activeMaterial && (
        <Modal
          open={!!activeMaterial}
          onClose={() => setActiveMaterial(null)}
          title={`Material Item: ${activeMaterial.material_code}`}
          size="md"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-xs text-slate-500">Record ID: {activeMaterial.id.slice(0, 8)}...</span>
              <AutoSaveIndicator status={saveStatus} lastSavedAt={lastSaved} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Material Description</label>
              <AutoSaveInput
                value={activeMaterial.name || ''}
                onSave={(val) => saveMaterialField('name', val)}
                placeholder="e.g. UltraTech Super PPC Cement"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Unit of Measure (UOM)</label>
                <AutoSaveInput
                  value={activeMaterial.unit_of_measure || ''}
                  onSave={(val) => saveMaterialField('unitOfMeasure', val)}
                  placeholder="BAG, TON, SQM, SHEET"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">HSN Code</label>
                <AutoSaveInput
                  value={activeMaterial.hsn_code || ''}
                  onSave={(val) => saveMaterialField('hsnCode', val)}
                  placeholder="HSN"
                />
              </div>
            </div>
            <div className="flex justify-end pt-3 border-t border-slate-200">
              <Button variant="secondary" onClick={() => setActiveMaterial(null)}>Close</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
