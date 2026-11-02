'use client';
import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Users,
  Phone,
  Mail,
  Calendar,
  FileText,
  CheckCircle2,
  Trash2,
  X,
  ChevronRight,
  ArrowUpDown,
  Printer,
  Sparkles,
} from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { StatCard } from '@/components/ui/StatCard';
import { AutoSaveIndicator, SaveStatus } from '@/components/ui/AutoSaveIndicator';
import { AutoSaveInput } from '@/components/ui/AutoSaveInput';
import { AutoSaveSelect } from '@/components/ui/AutoSaveSelect';
import { AutoSaveTextarea } from '@/components/ui/AutoSaveTextarea';

function formatInr(paise?: number) {
  if (!paise) return '-';
  const rupees = paise / 100;
  if (rupees >= 10000000) return `₹${(rupees / 10000000).toFixed(2)} Cr`;
  if (rupees >= 100000) return `₹${(rupees / 100000).toFixed(2)} L`;
  return `₹${rupees.toLocaleString('en-IN')}`;
}

export default function CrmPage() {
  const [activeTab, setActiveTab] = useState<'LEADS' | 'QUOTATIONS'>('LEADS');
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Lead modal state
  const [activeLead, setActiveLead] = useState<any | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Quotation Builder modal state
  const [activeQuotation, setActiveQuotation] = useState<any | null>(null);
  const [quotationSaveStatus, setQuotationSaveStatus] = useState<SaveStatus>('idle');
  const [showPrintModal, setShowPrintModal] = useState(false);

  const fetchEnquiries = useCallback(() => {
    fetch('/api/crm/enquiries')
      .then((r) => r.json())
      .then((d) => {
        setEnquiries(Array.isArray(d) ? d : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const fetchQuotations = useCallback(() => {
    fetch('/api/crm/quotations')
      .then((r) => r.json())
      .then((d) => {
        setQuotations(Array.isArray(d) ? d : []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchEnquiries();
    fetchQuotations();
  }, [fetchEnquiries, fetchQuotations]);

  // Zero-Click Draft Creation for Leads
  async function handleOpenNewLead() {
    setSaveStatus('saving');
    try {
      const res = await fetch('/api/crm/enquiries/draft', { method: 'POST' });
      const draft = await res.json();
      setActiveLead(draft);
      setSaveStatus('saved');
      setLastSaved(new Date());
      fetchEnquiries();
    } catch {
      setSaveStatus('error');
    }
  }

  // Field-level AutoSave for Leads
  async function handleFieldSave(field: string, value: any) {
    if (!activeLead) return;
    setSaveStatus('saving');
    try {
      const res = await fetch(`/api/crm/enquiries/${activeLead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });
      const data = await res.json();
      if (data.enquiry) {
        setActiveLead(data.enquiry);
      } else {
        setActiveLead((prev: any) => ({ ...prev, [field]: value }));
      }
      setSaveStatus('saved');
      setLastSaved(new Date());
      fetchEnquiries();
    } catch {
      setSaveStatus('error');
    }
  }

  async function handleDeleteLead(id: string) {
    if (!confirm('Are you sure you want to delete this lead?')) return;
    await fetch(`/api/crm/enquiries/${id}`, { method: 'DELETE' });
    if (activeLead?.id === id) setActiveLead(null);
    fetchEnquiries();
  }

  // Quotation Management
  async function handleOpenNewQuotation(enquiryId?: string) {
    setQuotationSaveStatus('saving');
    try {
      const res = await fetch('/api/crm/quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enquiryId }),
      });
      const draft = await res.json();
      setActiveQuotation(draft);
      setQuotationSaveStatus('saved');
      fetchQuotations();
    } catch {
      setQuotationSaveStatus('error');
    }
  }

  async function handleOpenQuotation(id: string) {
    try {
      const res = await fetch(`/api/crm/quotations/${id}`);
      const data = await res.json();
      setActiveQuotation(data);
    } catch {}
  }

  async function handleQuotationHeaderSave(field: string, value: any) {
    if (!activeQuotation) return;
    setQuotationSaveStatus('saving');
    try {
      const res = await fetch(`/api/crm/quotations/${activeQuotation.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });
      const data = await res.json();
      setActiveQuotation((prev: any) => ({ ...prev, ...data }));
      setQuotationSaveStatus('saved');
      fetchQuotations();
    } catch {
      setQuotationSaveStatus('error');
    }
  }

  async function handleQuotationItemSave(item: any) {
    if (!activeQuotation) return;
    setQuotationSaveStatus('saving');
    try {
      const res = await fetch(`/api/crm/quotations/${activeQuotation.id}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      const data = await res.json();
      if (data.quotation) {
        setActiveQuotation(data.quotation);
      }
      setQuotationSaveStatus('saved');
      fetchQuotations();
    } catch {
      setQuotationSaveStatus('error');
    }
  }

  async function handleDeleteQuotationItem(itemId: string) {
    if (!activeQuotation) return;
    setQuotationSaveStatus('saving');
    try {
      const res = await fetch(`/api/crm/quotations/${activeQuotation.id}/items?itemId=${itemId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.quotation) {
        setActiveQuotation(data.quotation);
      }
      setQuotationSaveStatus('saved');
      fetchQuotations();
    } catch {
      setQuotationSaveStatus('error');
    }
  }

  async function handleDeleteQuotation(id: string) {
    if (!confirm('Are you sure you want to delete this quotation?')) return;
    await fetch(`/api/crm/quotations/${id}`, { method: 'DELETE' });
    if (activeQuotation?.id === id) setActiveQuotation(null);
    fetchQuotations();
  }

  const columns = [
    {
      key: 'enquiry_number',
      header: 'Enquiry Ref',
      render: (row: any) => (
        <button
          onClick={() => setActiveLead(row)}
          className="text-left group flex flex-col focus:outline-none"
        >
          <span className="font-mono font-bold text-blue-600 group-hover:underline text-xs">
            {row.enquiry_number}
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            {row.created_at ? new Date(row.created_at).toLocaleDateString() : 'Active'}
          </span>
        </button>
      ),
    },
    {
      key: 'customer_name',
      header: 'Customer / Lead',
      render: (row: any) => (
        <div>
          <span className="font-semibold text-slate-800 text-xs">{row.customer_name}</span>
          <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
            {row.phone && (
              <span className="flex items-center gap-0.5">
                <Phone className="w-2.5 h-2.5 text-slate-400" />
                {row.phone}
              </span>
            )}
            {row.email && (
              <span className="flex items-center gap-0.5">
                <Mail className="w-2.5 h-2.5 text-slate-400" />
                {row.email}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'vertical_name',
      header: 'Vertical',
      render: (row: any) => (
        <span className="text-xs text-slate-600 font-medium">
          {row.vertical_name || 'Multi-vertical'}
        </span>
      ),
    },
    {
      key: 'source',
      header: 'Source',
      render: (row: any) => (
        <Badge variant="purple">{row.source?.replace('_', ' ') || 'DIRECT'}</Badge>
      ),
    },
    {
      key: 'budget_paise',
      header: 'Budget Value',
      render: (row: any) => (
        <span className="font-mono font-bold text-xs text-slate-900">
          {formatInr(row.budget_paise)}
        </span>
      ),
    },
    {
      key: 'lead_score',
      header: 'Lead Score',
      render: (row: any) => (
        <div className="flex items-center gap-2">
          <div className="w-12 bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                row.lead_score >= 70
                  ? 'bg-emerald-500'
                  : row.lead_score >= 40
                  ? 'bg-blue-500'
                  : 'bg-amber-500'
              }`}
              style={{ width: `${Math.min(100, row.lead_score || 20)}%` }}
            />
          </div>
          <span className="font-mono text-xs font-semibold text-slate-600">
            {row.lead_score || 0}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Pipeline Stage',
      render: (row: any) => (
        <div onClick={(e) => e.stopPropagation()}>
          <select
            value={row.status || 'NEW'}
            onChange={async (e) => {
              const newStatus = e.target.value;
              await fetch(`/api/crm/enquiries/${row.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
              });
              fetchEnquiries();
            }}
            className="text-[11px] font-semibold bg-white border border-slate-200 rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer text-slate-800"
          >
            <option value="NEW">NEW LEAD</option>
            <option value="CONTACTED">CONTACTED</option>
            <option value="SITE_VISIT_SCHEDULED">SITE VISIT SCHEDULED</option>
            <option value="SITE_VISIT_DONE">SITE VISIT DONE</option>
            <option value="NEGOTIATION">NEGOTIATION</option>
            <option value="WON">DEAL WON</option>
            <option value="LOST">DEAL LOST</option>
          </select>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row: any) => (
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleOpenNewQuotation(row.id)}
            className="text-emerald-700 hover:text-emerald-900 text-xs px-2"
            title="Generate Quotation"
          >
            + Quote
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setActiveLead(row)}
            className="text-blue-600 hover:text-blue-800 text-xs px-2"
          >
            Edit
          </Button>
          <button
            onClick={() => handleDeleteLead(row.id)}
            className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
            title="Delete Lead"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  const quotationColumns = [
    {
      key: 'quotation_number',
      header: 'Quote Ref',
      render: (r: any) => (
        <button
          onClick={() => handleOpenQuotation(r.id)}
          className="text-left font-mono font-bold text-blue-600 hover:underline text-xs"
        >
          {r.quotation_number}
        </button>
      ),
    },
    {
      key: 'customer_name',
      header: 'Client / Customer',
      render: (r: any) => (
        <span className="font-semibold text-slate-800 text-xs">{r.customer_name || 'Standard Client'}</span>
      ),
    },
    {
      key: 'scope_of_work',
      header: 'Scope Summary',
      render: (r: any) => (
        <span className="text-xs text-slate-600 truncate max-w-[200px] block">
          {r.scope_of_work || 'Scope defined'}
        </span>
      ),
    },
    {
      key: 'total_amount_paise',
      header: 'Subtotal (Excl. Tax)',
      render: (r: any) => (
        <span className="font-mono text-xs text-slate-700">{formatInr(r.total_amount_paise)}</span>
      ),
    },
    {
      key: 'tax_amount_paise',
      header: 'GST 18%',
      render: (r: any) => (
        <span className="font-mono text-xs text-slate-500">{formatInr(r.tax_amount_paise)}</span>
      ),
    },
    {
      key: 'grand_total_paise',
      header: 'Grand Total',
      render: (r: any) => (
        <span className="font-mono font-bold text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
          {formatInr(r.grand_total_paise)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (r: any) => (
        <Badge variant={r.status === 'ACCEPTED' ? 'success' : r.status === 'SENT' ? 'info' : 'warning'}>
          {r.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (r: any) => (
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleOpenQuotation(r.id)}
            className="text-blue-600 hover:text-blue-800 text-xs px-2"
          >
            Open Quote
          </Button>
          <button
            onClick={() => handleDeleteQuotation(r.id)}
            className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
            title="Delete Quote"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">CRM & Quotation Engine</h1>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
              Zero-Click AutoSave
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time pipeline progression, dynamic quotation line item math, and automated SQLite persistence.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'LEADS' ? (
            <Button onClick={handleOpenNewLead} icon={<Plus className="w-4 h-4" />}>
              New Lead (AutoSave)
            </Button>
          ) : (
            <Button onClick={() => handleOpenNewQuotation()} icon={<Plus className="w-4 h-4" />}>
              New Quotation (AutoSave)
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard label="Total Enquiries" value={enquiries.length} subtext="Across All Verticals" icon={<Users className="w-4 h-4" />} />
        <StatCard label="Site Visits Completed" value={enquiries.filter(e => e.status === 'SITE_VISIT_DONE').length} subtext="High-intent prospects" icon={<Calendar className="w-4 h-4" />} colorClass="text-amber-600" />
        <StatCard label="Total Quotations" value={quotations.length} subtext={`${quotations.filter(q => q.status === 'ACCEPTED').length} Accepted`} icon={<FileText className="w-4 h-4" />} colorClass="text-blue-600" />
        <StatCard label="Deals Won" value={enquiries.filter(e => e.status === 'WON').length} subtext="Converted to Contracts" icon={<CheckCircle2 className="w-4 h-4" />} colorClass="text-emerald-600" />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('LEADS')}
          className={`pb-2.5 transition-colors border-b-2 -mb-px ${
            activeTab === 'LEADS' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Enquiries & Sales Pipeline ({enquiries.length})
        </button>
        <button
          onClick={() => setActiveTab('QUOTATIONS')}
          className={`pb-2.5 transition-colors border-b-2 -mb-px ${
            activeTab === 'QUOTATIONS' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Quotations & Scope Estimates ({quotations.length})
        </button>
      </div>

      {/* Table Card for Leads */}
      {activeTab === 'LEADS' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <DataTable
            columns={columns}
            data={enquiries}
            onRowDoubleClick={(row) => setActiveLead(row)}
            exportFileName="crm-leads"
            searchable
            searchPlaceholder="Search leads by name, phone, or enquiry number..."
            searchFilter={(item, q) =>
              item.customer_name?.toLowerCase().includes(q) ||
              item.phone?.toLowerCase().includes(q) ||
              item.enquiry_number?.toLowerCase().includes(q)
            }
          />
        </div>
      )}

      {/* Table Card for Quotations */}
      {activeTab === 'QUOTATIONS' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <DataTable
            columns={quotationColumns}
            data={quotations}
            onRowDoubleClick={(row) => setActiveQuotation(row)}
            exportFileName="crm-quotations"
            searchable
            searchPlaceholder="Search quotes by number, customer..."
            searchFilter={(item, q) =>
              item.quotation_number?.toLowerCase().includes(q) ||
              item.customer_name?.toLowerCase().includes(q) ||
              item.scope_of_work?.toLowerCase().includes(q)
            }
          />
        </div>
      )}

      {/* AutoSave Lead Editor Modal */}
      {activeLead && (
        <Modal
          open={!!activeLead}
          onClose={() => setActiveLead(null)}
          title={`Lead File: ${activeLead.enquiry_number}`}
          size="lg"
        >
          <div className="space-y-5">
            {/* Save Status Bar */}
            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="text-xs text-slate-600">
                Database Record ID: <span className="font-mono text-slate-900 font-semibold">{activeLead.id.slice(0, 8)}...</span>
              </div>
              <AutoSaveIndicator status={saveStatus} lastSavedAt={lastSaved} />
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Customer / Lead Name</label>
                <AutoSaveInput
                  value={activeLead.customer_name || ''}
                  onSave={(val) => handleFieldSave('customerName', val)}
                  placeholder="e.g. Dr. Rajesh Sharma"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                <AutoSaveInput
                  value={activeLead.phone || ''}
                  onSave={(val) => handleFieldSave('phone', val)}
                  placeholder="10-digit mobile number"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <AutoSaveInput
                  value={activeLead.email || ''}
                  onSave={(val) => handleFieldSave('email', val)}
                  placeholder="name@example.com"
                  type="email"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Lead Source</label>
                <AutoSaveSelect
                  value={activeLead.source || 'WALK_IN'}
                  onSave={(val) => handleFieldSave('source', val)}
                >
                  <option value="WALK_IN">Site Office Walk-In</option>
                  <option value="PHONE">Telephone Inbound</option>
                  <option value="WEBSITE">Website Portal Lead</option>
                  <option value="REFERRAL">Customer Referral</option>
                  <option value="SOCIAL_MEDIA">Digital Campaign</option>
                </AutoSaveSelect>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Pipeline Status</label>
                <AutoSaveSelect
                  value={activeLead.status || 'NEW'}
                  onSave={(val) => handleFieldSave('status', val)}
                >
                  <option value="NEW">NEW LEAD</option>
                  <option value="CONTACTED">CONTACTED</option>
                  <option value="SITE_VISIT_SCHEDULED">SITE VISIT SCHEDULED</option>
                  <option value="SITE_VISIT_DONE">SITE VISIT DONE</option>
                  <option value="NEGOTIATION">NEGOTIATION</option>
                  <option value="WON">DEAL WON</option>
                  <option value="LOST">DEAL LOST</option>
                </AutoSaveSelect>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Expected Budget Value (Paise)</label>
                <AutoSaveInput
                  type="number"
                  value={activeLead.budget_paise || 0}
                  onSave={(val) => handleFieldSave('budgetPaise', Number(val))}
                  placeholder="e.g. 50000000 (50L in paise)"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Equivalent: {formatInr(activeLead.budget_paise || 0)}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Lead Score (0–100)</label>
                <AutoSaveInput
                  type="number"
                  value={activeLead.lead_score || 0}
                  onSave={(val) => handleFieldSave('leadScore', Number(val))}
                  placeholder="Score 1-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Project Scope & Requirement</label>
              <AutoSaveTextarea
                rows={3}
                value={activeLead.requirement_description || ''}
                onSave={(val) => handleFieldSave('requirementDescription', val)}
                placeholder="Detailed customer specifications, site location preference, square footage..."
              />
            </div>

            {/* Modal Bottom: Zero Submit Button, Just Close and Safe Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleDeleteLead(activeLead.id)}
                icon={<Trash2 className="w-3.5 h-3.5" />}
              >
                Delete Lead
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const leadId = activeLead.id;
                    setActiveLead(null);
                    handleOpenNewQuotation(leadId);
                  }}
                  icon={<FileText className="w-3.5 h-3.5" />}
                >
                  Create Quotation
                </Button>
                <Button variant="secondary" onClick={() => setActiveLead(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Quotation Builder Modal */}
      {activeQuotation && (
        <Modal
          open={!!activeQuotation}
          onClose={() => setActiveQuotation(null)}
          title={`Quotation Builder: ${activeQuotation.quotation_number}`}
          size="lg"
        >
          <div className="space-y-5">
            {/* Save Status Bar & Print Action */}
            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="text-xs text-slate-600">
                Customer: <strong className="text-slate-900">{activeQuotation.customer_name || 'Proficient Client'}</strong>
              </div>
              <div className="flex items-center gap-3">
                <AutoSaveIndicator status={quotationSaveStatus} />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowPrintModal(true)}
                  icon={<Printer className="w-3.5 h-3.5" />}
                >
                  Formal Print Preview
                </Button>
              </div>
            </div>

            {/* Header controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Quotation Status</label>
                <AutoSaveSelect
                  value={activeQuotation.status || 'DRAFT'}
                  onSave={(val) => handleQuotationHeaderSave('status', val)}
                >
                  <option value="DRAFT">DRAFT</option>
                  <option value="SENT">SENT TO CLIENT</option>
                  <option value="ACCEPTED">ACCEPTED / WON</option>
                  <option value="REJECTED">REJECTED</option>
                </AutoSaveSelect>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Validity Date</label>
                <AutoSaveInput
                  type="date"
                  value={activeQuotation.valid_until || ''}
                  onSave={(val) => handleQuotationHeaderSave('validUntil', val)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Scope Headline</label>
                <AutoSaveInput
                  value={activeQuotation.scope_of_work || ''}
                  onSave={(val) => handleQuotationHeaderSave('scopeOfWork', val)}
                  placeholder="e.g. Premium Villa Construction"
                />
              </div>
            </div>

            {/* Line Items Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">
                  Bill of Items & Scope Specifications ({activeQuotation.items?.length || 0})
                </span>
                <button
                  type="button"
                  onClick={() =>
                    handleQuotationItemSave({
                      quotationId: activeQuotation.id,
                      description: 'Interior Joinery & Flush Doors Execution',
                      quantity: 1,
                      unit: 'NOS',
                      unitRateRupees: 25000,
                    })
                  }
                  className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Scope Item
                </button>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100">
                {(activeQuotation.items || []).map((item: any, idx: number) => (
                  <div key={item.id} className="p-3 bg-slate-50/50 flex flex-wrap items-center gap-3">
                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Item Description</label>
                      <AutoSaveInput
                        value={item.description}
                        onSave={(val) =>
                          handleQuotationItemSave({
                            id: item.id,
                            quotationId: activeQuotation.id,
                            description: val,
                            quantity: item.quantity,
                            unit: item.unit,
                            unitRateRupees: (item.unit_rate_paise || 0) / 100,
                          })
                        }
                        placeholder="Detailed material / execution item"
                      />
                    </div>

                    <div className="w-20">
                      <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Qty</label>
                      <AutoSaveInput
                        type="number"
                        value={item.quantity}
                        onSave={(val) =>
                          handleQuotationItemSave({
                            id: item.id,
                            quotationId: activeQuotation.id,
                            description: item.description,
                            quantity: Number(val),
                            unit: item.unit,
                            unitRateRupees: (item.unit_rate_paise || 0) / 100,
                          })
                        }
                      />
                    </div>

                    <div className="w-20">
                      <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Unit</label>
                      <AutoSaveInput
                        value={item.unit || 'NOS'}
                        onSave={(val) =>
                          handleQuotationItemSave({
                            id: item.id,
                            quotationId: activeQuotation.id,
                            description: item.description,
                            quantity: item.quantity,
                            unit: val,
                            unitRateRupees: (item.unit_rate_paise || 0) / 100,
                          })
                        }
                      />
                    </div>

                    <div className="w-28">
                      <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Unit Rate (₹)</label>
                      <AutoSaveInput
                        type="number"
                        value={(item.unit_rate_paise || 0) / 100}
                        onSave={(val) =>
                          handleQuotationItemSave({
                            id: item.id,
                            quotationId: activeQuotation.id,
                            description: item.description,
                            quantity: item.quantity,
                            unit: item.unit,
                            unitRateRupees: Number(val),
                          })
                        }
                      />
                    </div>

                    <div className="w-28 text-right">
                      <span className="block text-[10px] font-semibold text-slate-500 mb-1">Total (₹)</span>
                      <span className="font-mono font-bold text-xs text-slate-900 block mt-1">
                        {formatInr(item.amount_paise)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteQuotationItem(item.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 mt-3 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Calculated Financial Totals Card */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="text-xs text-slate-500">
                <span className="font-semibold text-slate-700">Statutory Tax Note:</span> 18% GST auto-computed in real-time.
              </div>
              <div className="w-full sm:w-72 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-mono font-semibold">{formatInr(activeQuotation.total_amount_paise)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>GST (18%):</span>
                  <span className="font-mono font-semibold">{formatInr(activeQuotation.tax_amount_paise)}</span>
                </div>
                <div className="flex justify-between pt-1.5 border-t border-slate-300 font-bold text-slate-900 text-sm">
                  <span>Grand Total:</span>
                  <span className="font-mono text-emerald-700">{formatInr(activeQuotation.grand_total_paise)}</span>
                </div>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Milestones & Terms</label>
              <AutoSaveTextarea
                rows={3}
                value={activeQuotation.terms_conditions || ''}
                onSave={(val) => handleQuotationHeaderSave('termsConditions', val)}
                placeholder="Contractual payment schedule, advance percentage, validity..."
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleDeleteQuotation(activeQuotation.id)}
                icon={<Trash2 className="w-3.5 h-3.5" />}
              >
                Delete Quote
              </Button>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">All updates persist automatically</span>
                <Button variant="secondary" onClick={() => setActiveQuotation(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Formal Printable Quotation Preview Modal */}
      {showPrintModal && activeQuotation && (
        <Modal
          open={showPrintModal}
          onClose={() => setShowPrintModal(false)}
          title={`Commercial Proposal: ${activeQuotation.quotation_number}`}
          size="lg"
        >
          <div className="bg-white p-6 border border-slate-200 rounded-xl space-y-6 print:border-none text-slate-900">
            {/* Formal Header */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-4">
              <div>
                <div className="text-lg font-black text-blue-900 tracking-tight">PROFICIENT BUSINESS SUITE</div>
                <div className="text-xs text-slate-500">Commercial Proposals & Contracts Division</div>
                <div className="text-[11px] text-slate-400 mt-1">Bangalore · Hyderabad · Chennai</div>
              </div>
              <div className="text-right">
                <div className="font-mono font-bold text-sm text-blue-800">{activeQuotation.quotation_number}</div>
                <div className="text-xs text-slate-500">Date: {activeQuotation.quotation_date || '2026-11-02'}</div>
                <div className="text-xs text-slate-500">Valid Till: {activeQuotation.valid_until}</div>
              </div>
            </div>

            {/* Client and Scope Info */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div>
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Prepared For:</span>
                <div className="font-semibold text-slate-900 text-sm mt-0.5">{activeQuotation.customer_name || 'Valued Enterprise Client'}</div>
                <div className="text-slate-500">{activeQuotation.customer_phone || activeQuotation.customer_email || 'Contact on file'}</div>
              </div>
              <div>
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Project Scope:</span>
                <div className="font-semibold text-slate-900 text-sm mt-0.5">{activeQuotation.scope_of_work || 'Turnkey Execution'}</div>
                <div className="text-slate-500 font-mono">Status: {activeQuotation.status}</div>
              </div>
            </div>

            {/* Scope Table */}
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-300 uppercase text-[10px] font-bold">
                  <th className="py-2 px-3">#</th>
                  <th className="py-2 px-3">Scope Description</th>
                  <th className="py-2 px-3 text-right">Qty</th>
                  <th className="py-2 px-3 text-center">Unit</th>
                  <th className="py-2 px-3 text-right">Unit Rate</th>
                  <th className="py-2 px-3 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {(activeQuotation.items || []).map((it: any, i: number) => (
                  <tr key={it.id}>
                    <td className="py-2 px-3 font-mono text-slate-400">{i + 1}</td>
                    <td className="py-2 px-3 font-semibold text-slate-800">{it.description}</td>
                    <td className="py-2 px-3 text-right font-mono">{it.quantity}</td>
                    <td className="py-2 px-3 text-center text-slate-500 font-mono">{it.unit}</td>
                    <td className="py-2 px-3 text-right font-mono">{formatInr(it.unit_rate_paise)}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">{formatInr(it.amount_paise)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals Summary */}
            <div className="flex justify-end">
              <div className="w-64 space-y-1.5 text-xs border-t border-slate-300 pt-3">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-mono font-semibold">{formatInr(activeQuotation.total_amount_paise)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>GST (18% Statutory):</span>
                  <span className="font-mono font-semibold">{formatInr(activeQuotation.tax_amount_paise)}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 text-sm pt-2 border-t border-slate-300">
                  <span>Grand Total:</span>
                  <span className="font-mono text-emerald-700">{formatInr(activeQuotation.grand_total_paise)}</span>
                </div>
              </div>
            </div>

            {/* Terms and Sign-off */}
            <div className="border-t border-slate-200 pt-4 space-y-3">
              <div className="text-[11px] text-slate-600 whitespace-pre-line bg-slate-50 p-3 rounded border border-slate-200">
                <strong className="block text-slate-800 mb-1">Commercial Terms:</strong>
                {activeQuotation.terms_conditions || 'Standard 30% advance with progress billing.'}
              </div>

              <div className="grid grid-cols-2 pt-6 text-center text-xs text-slate-500">
                <div className="border-t border-dashed border-slate-300 mx-8 pt-2">
                  Authorized Signatory (Proficient)
                </div>
                <div className="border-t border-dashed border-slate-300 mx-8 pt-2">
                  Client Acceptance & Stamp
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="secondary" onClick={() => setShowPrintModal(false)}>
                Close Preview
              </Button>
              <Button onClick={() => window.print()} icon={<Printer className="w-3.5 h-3.5" />}>
                Print Proposal
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
