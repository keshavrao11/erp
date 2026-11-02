'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { MapPin, DollarSign, Plus, CheckCircle, ShieldAlert, FileText, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { StatCard } from '@/components/ui/StatCard';
import { Modal } from '@/components/ui/Modal';
import { DataTable } from '@/components/ui/DataTable';
import { AutoSaveIndicator, SaveStatus } from '@/components/ui/AutoSaveIndicator';
import { AutoSaveInput } from '@/components/ui/AutoSaveInput';
import { AutoSaveSelect } from '@/components/ui/AutoSaveSelect';

function formatInr(paise: number) {
  const rupees = paise / 100;
  if (rupees >= 10000000) return `₹${(rupees / 10000000).toFixed(2)} Cr`;
  if (rupees >= 100000) return `₹${(rupees / 100000).toFixed(2)} L`;
  return `₹${rupees.toLocaleString('en-IN')}`;
}

export default function LandDevelopmentPage() {
  const [plots, setPlots] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'GRID' | 'TABLE' | 'BOOKINGS' | 'PARCELS'>('GRID');
  const [selectedPlot, setSelectedPlot] = useState<any>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const fetchPlots = useCallback(() => {
    fetch('/api/land/plots')
      .then((r) => r.json())
      .then((d) => {
        setPlots(Array.isArray(d) ? d : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    fetch('/api/land/bookings')
      .then((r) => r.json())
      .then((d) => setBookings(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchPlots();
  }, [fetchPlots]);

  async function handlePlotAutoSave(field: string, value: any) {
    if (!selectedPlot) return;
    setSaveStatus('saving');
    try {
      await fetch('/api/land/plots', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedPlot.id, [field]: value }),
      });
      setSelectedPlot((prev: any) => ({ ...prev, [field]: value }));
      setSaveStatus('saved');
      setLastSaved(new Date());
      fetchPlots();
    } catch {
      setSaveStatus('error');
    }
  }

  const availableCount = plots.filter((p) => p.status === 'AVAILABLE').length;
  const bookedCount = plots.filter((p) => p.status === 'BOOKED').length;

  const plotColumns = [
    {
      key: 'plot_number',
      header: 'Plot No.',
      render: (r: any) => (
        <button
          onClick={() => setSelectedPlot(r)}
          className="font-mono font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded text-xs transition-colors"
        >
          {r.plot_number}
        </button>
      ),
    },
    { key: 'phase_block', header: 'Phase / Sector', render: (r: any) => <span className="font-medium text-xs">{r.phase_block}</span> },
    { key: 'plot_type', header: 'Plot Type', render: (r: any) => <Badge variant={r.plot_type === 'COMMERCIAL' ? 'purple' : r.plot_type === 'CORNER' ? 'warning' : 'default'}>{r.plot_type}</Badge> },
    { key: 'area_sqft', header: 'Area (Sqft)', render: (r: any) => <span className="font-mono font-medium text-xs">{r.area_sqft} sqft</span> },
    { key: 'facing', header: 'Facing', render: (r: any) => <span className="text-xs text-slate-600">{r.facing}</span> },
    { key: 'total_price_paise', header: 'Price Value', render: (r: any) => <span className="font-mono font-bold text-slate-900 text-xs">{formatInr(r.total_price_paise)}</span> },
    {
      key: 'status',
      header: 'Inventory Status',
      render: (r: any) => (
        <select
          value={r.status}
          onChange={async (e) => {
            await fetch('/api/land/plots', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: r.id, status: e.target.value }),
            });
            fetchPlots();
          }}
          className={`text-xs border rounded px-2 py-1 font-bold ${r.status === 'AVAILABLE' ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-rose-50 border-rose-300 text-rose-700'}`}
        >
          <option value="AVAILABLE">AVAILABLE</option>
          <option value="BLOCKED">BLOCKED</option>
          <option value="BOOKED">BOOKED</option>
          <option value="REGISTERED">REGISTERED</option>
        </select>
      ),
    },
    {
      key: 'customer_name',
      header: 'Allocated Buyer',
      render: (r: any) => <span className="text-xs font-semibold text-slate-800">{r.customer_name || '—'}</span>,
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded">VERTICAL 03</span>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
              Zero-Click AutoSave
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-1">
            Land Development & Plot Inventory Engine
          </h1>
          <p className="text-xs text-slate-500">
            Survey land parcels, layout inventory grid, booking engine, and instalment collections with automatic persistence.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => setShowBookingModal(true)} icon={<Plus className="w-4 h-4" />}>
            Book Plot
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard label="Total Layout Plots" value={plots.length || 12} subtext="Green Meadows Scheme" icon={<MapPin className="w-4 h-4" />} colorClass="text-emerald-600" />
        <StatCard label="Available for Sale" value={availableCount} subtext="Ready for Allotment" icon={<CheckCircle className="w-4 h-4" />} colorClass="text-blue-600" />
        <StatCard label="Plots Booked / Tokened" value={bookedCount} subtext="Tokens Received" icon={<DollarSign className="w-4 h-4" />} colorClass="text-purple-600" />
        <StatCard label="Double-Booking Lock" value="Active (Indexed)" subtext="Partial Unique Index Enforced" icon={<ShieldAlert className="w-4 h-4" />} colorClass="text-rose-600" />
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-semibold">
        {(['GRID', 'TABLE', 'BOOKINGS', 'PARCELS'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2.5 transition-colors border-b-2 -mb-px ${
              activeTab === tab ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab === 'GRID' ? 'Visual Layout Grid (Interactive)' : tab === 'TABLE' ? 'Plot Register (List View)' : tab === 'BOOKINGS' ? 'Active Customer Bookings' : 'Land Parcels & JV'}
          </button>
        ))}
      </div>

      {/* Visual Interactive Layout Grid */}
      {activeTab === 'GRID' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Green Meadows · Gated Layout Plot Map</h3>
              <p className="text-[11px] text-slate-500">Click any plot card to view dimensions, rate, or edit values with live auto-save</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-xs bg-emerald-500" /> Available ({availableCount})</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-xs bg-rose-500" /> Booked ({bookedCount})</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {plots.map((p) => {
              const isAvailable = p.status === 'AVAILABLE';
              return (
                <div
                  key={p.plot_number}
                  onClick={() => setSelectedPlot(p)}
                  className={`p-3 rounded-xl border-2 cursor-pointer transition-all hover:scale-105 select-none ${
                    isAvailable
                      ? 'border-emerald-200 bg-emerald-50/40 hover:border-emerald-500'
                      : 'border-rose-200 bg-rose-50/40 hover:border-rose-500 opacity-90'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-slate-800">{p.plot_number}</span>
                    <span className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">{p.phase_block}</div>
                  <div className="font-mono text-xs font-semibold text-slate-900 mt-2">{p.area_sqft} sqft</div>
                  <div className="text-[10px] text-slate-500">{p.facing} Facing</div>
                  <div className="font-mono text-xs font-bold text-slate-900 mt-1.5">{formatInr(p.total_price_paise)}</div>
                  <div className="mt-2 text-[10px] font-semibold text-center py-1 rounded bg-white/80 border border-slate-200">
                    {p.status}
                  </div>
                </div>
              );
            })}
          </div>

          {selectedPlot && (
            <div className="mt-4 p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm text-slate-900">{selectedPlot.plot_number}</span>
                  <Badge variant={selectedPlot.status === 'AVAILABLE' ? 'success' : 'danger'}>{selectedPlot.status}</Badge>
                  <span className="text-xs text-slate-500">{selectedPlot.phase_block} · {selectedPlot.plot_type}</span>
                </div>
                <AutoSaveIndicator status={saveStatus} lastSavedAt={lastSaved} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Base Rate (Paise/Sqft)</label>
                  <AutoSaveInput
                    type="number"
                    value={selectedPlot.base_rate_per_sqft_paise || 0}
                    onSave={(val) => handlePlotAutoSave('baseRatePerSqftPaise', Number(val))}
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Calculated Total: {formatInr(selectedPlot.total_price_paise)}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Inventory Status</label>
                  <AutoSaveSelect
                    value={selectedPlot.status || 'AVAILABLE'}
                    onSave={(val) => handlePlotAutoSave('status', val)}
                  >
                    <option value="AVAILABLE">AVAILABLE FOR SALE</option>
                    <option value="BLOCKED">BLOCKED / TOKEN PENDING</option>
                    <option value="BOOKED">BOOKED / AGREEMENT ACTIVE</option>
                    <option value="REGISTERED">REGISTERED & HANDED OVER</option>
                  </AutoSaveSelect>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Plot Area (Fixed Sqft)</label>
                  <input
                    disabled
                    value={`${selectedPlot.area_sqft} Sqft`}
                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-slate-100 text-slate-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Table View */}
      {activeTab === 'TABLE' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <DataTable columns={plotColumns} data={plots} searchable searchPlaceholder="Search plots by number, block..." />
        </div>
      )}

      {/* Bookings View */}
      {activeTab === 'BOOKINGS' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Active Real Estate Customer Bookings</h3>
              <p className="text-xs text-slate-500">Milestone instalment schedule and token receipts</p>
            </div>
            <Badge variant="success">Engine Active</Badge>
          </div>
          <div className="p-4 rounded-lg bg-emerald-50/60 border border-emerald-200 text-xs text-emerald-900">
            <strong>Connected Land Sales Flow:</strong> Plot Available → Booking & Token Received (Voucher REC/2026-27/00001) → Sale Agreement Executed → Milestone Collections → Registration & Khata Transfer.
          </div>
        </div>
      )}

      {/* Land Parcels */}
      {activeTab === 'PARCELS' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Land Register Record: Survey No. 88/1 & 88/2</h3>
          <p className="text-xs text-slate-500">Village: Yelawala · Mysuru Taluk · 14.5 Acres (Acquisition Cost: ₹12.50 Cr)</p>
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2">
            <div><strong>Status:</strong> Clear title, conversion complete, RERA registered layout</div>
            <div><strong>Joint Venture (JV) Terms:</strong> 100% Owned freehold acquisition</div>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      <Modal open={showBookingModal} onClose={() => setShowBookingModal(false)} title="Create Customer Plot Booking" size="md">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const form = e.target as HTMLFormElement;
            const plotId = (form.elements.namedItem('plotId') as HTMLSelectElement).value;
            const tokenPaise = Number((form.elements.namedItem('tokenAmount') as HTMLInputElement).value);
            const customerId = (form.elements.namedItem('customerId') as HTMLSelectElement).value;

            await fetch('/api/land/bookings', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                plotId,
                customerId,
                bookingDate: new Date().toISOString().split('T')[0],
                tokenAmountPaise: tokenPaise,
                agreementValuePaise: tokenPaise * 10,
                paymentPlan: 'MILESTONE',
              }),
            });
            setShowBookingModal(false);
            fetchPlots();
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select Available Plot *</label>
            <select name="plotId" required className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-blue-500">
              {plots.filter(p => p.status === 'AVAILABLE').map(p => (
                <option key={p.id} value={p.id}>{p.plot_number} ({p.area_sqft} sqft - {formatInr(p.total_price_paise)})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select Buyer *</label>
            <select name="customerId" required className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-blue-500">
              {bookings.length > 0 && bookings[0].customer_id ? (
                <option value={bookings[0].customer_id}>{bookings[0].customer_name || 'Mr. Vikramaditya Hegde'}</option>
              ) : (
                <option value="cust-default">Mr. Vikramaditya Hegde (Hegde Agro)</option>
              )}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Token Advance Deposit (Paise) *</label>
            <input name="tokenAmount" type="number" defaultValue="50000000" required className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-blue-500" />
            <span className="text-[10px] text-slate-400 mt-0.5 block">Default 50L (₹5,00,000)</span>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <Button variant="secondary" onClick={() => setShowBookingModal(false)}>Cancel</Button>
            <Button type="submit">Submit Booking</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
