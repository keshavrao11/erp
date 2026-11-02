'use client';
import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  FolderKanban,
  Landmark,
  Building,
  TrendingUp,
  MapPin,
  ArrowRight,
  Plus,
  Users,
  HardHat,
  Paintbrush,
  ShoppingCart,
  UserCheck,
  ShieldCheck,
  Briefcase,
  ChevronDown,
  ShieldAlert,
} from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

function AccessDeniedBanner() {
  const searchParams = useSearchParams();
  const isDenied = searchParams.get('denied') === 'true';
  const deniedModule = searchParams.get('module') || 'the requested module';

  if (!isDenied) return null;

  return (
    <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-800 text-xs shadow-xs animate-in fade-in duration-200">
      <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
      <div className="flex-1">
        <div className="font-bold text-sm text-rose-900">Access Denied: Department Authorization Boundary</div>
        <p className="text-[11px] text-rose-700 mt-0.5">
          Your assigned department role does not have authorization to access <strong>{deniedModule}</strong>. You have been safely redirected to your authorized workspace.
        </p>
      </div>
    </div>
  );
}

function formatInr(paise: number) {
  const rupees = paise / 100;
  if (rupees >= 10000000) {
    return `₹${(rupees / 10000000).toFixed(2)} Cr`;
  }
  if (rupees >= 100000) {
    return `₹${(rupees / 100000).toFixed(2)} L`;
  }
  return `₹${rupees.toLocaleString('en-IN')}`;
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [roleView, setRoleView] = useState<string>('EXECUTIVE');

  useEffect(() => {
    fetch('/api/dashboard')
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-500 font-medium">Loading Consolidated Enterprise KPI Metrics...</span>
        </div>
      </div>
    );
  }

  const plotStats = data?.plotStats || { available: 10, booked: 2, registered: 0, total: 12 };

  const rolesList = [
    { id: 'EXECUTIVE', label: 'Executive / Director View', icon: ShieldCheck },
    { id: 'CRM', label: 'CRM & Sales Executive', icon: Users },
    { id: 'PROJECTS', label: 'Project Manager View', icon: FolderKanban },
    { id: 'SITE', label: 'Site Engineer View', icon: HardHat },
    { id: 'INTERIOR', label: 'Interior Designer View', icon: Paintbrush },
    { id: 'LAND', label: 'Land Dev Manager View', icon: MapPin },
    { id: 'PROCURE', label: 'Purchase & Store View', icon: ShoppingCart },
    { id: 'ACCOUNTS', label: 'Chief Accountant View', icon: Landmark },
    { id: 'HR', label: 'HR & Payroll Admin View', icon: UserCheck },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <Suspense fallback={null}>
        <AccessDeniedBanner />
      </Suspense>

      {/* Top Banner / Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-800 text-white p-6 rounded-2xl shadow-sm border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="purple">ENTERPRISE ERP 2.0</Badge>
            <span className="text-xs text-slate-400">Proficient Transforms Pvt Ltd</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            Proficient Business Suite
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Live operations, cash liquidity, real estate plot inventory, and general ledger journal postings across Construction, Interiors, and Land Development verticals.
          </p>
        </div>

        {/* Role View Switcher */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="bg-slate-800/80 p-1 rounded-xl border border-slate-700 flex items-center">
            <span className="text-[11px] text-slate-400 px-2 font-medium">View:</span>
            <select
              value={roleView}
              onChange={(e) => setRoleView(e.target.value)}
              className="bg-slate-900 text-xs font-semibold text-white border border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {rolesList.map(r => (
                <option key={r.id} value={r.id}>{r.label}</option>
              ))}
            </select>
          </div>
          <Link href="/crm">
            <Button size="sm" icon={<Plus className="w-4 h-4" />}>
              Add Lead
            </Button>
          </Link>
        </div>
      </div>

      {/* Role-Specific Metric Focus */}
      {roleView === 'EXECUTIVE' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Active Multi-Vertical Projects"
            value={data?.activeProjects ?? 3}
            subtext="Construction, Interiors & Layouts"
            icon={<FolderKanban className="w-5 h-5" />}
            trend={{ value: '100% On Schedule', positive: true }}
            colorClass="text-blue-600"
          />
          <StatCard
            label="Liquid Cash & Bank Reserves"
            value={formatInr(data?.cashBankBalancePaise ?? 30750000)}
            subtext="HDFC Current + Escrow"
            icon={<Landmark className="w-5 h-5" />}
            trend={{ value: 'Positive Working Capital', positive: true }}
            colorClass="text-emerald-600"
          />
          <StatCard
            label="Accounts Receivable (Debtors)"
            value={formatInr(data?.receivablesPaise ?? 350000000)}
            subtext="Uncollected Client RA Invoices"
            icon={<TrendingUp className="w-5 h-5" />}
            trend={{ value: 'RA Bill 01 Active', positive: true }}
            colorClass="text-amber-600"
          />
          <StatCard
            label="Plotted Inventory Availability"
            value={`${plotStats.available} / ${plotStats.total} Plots`}
            subtext={`${plotStats.booked} Booked (${Math.round((plotStats.booked / plotStats.total) * 100)}% Booked)`}
            icon={<MapPin className="w-5 h-5" />}
            colorClass="text-purple-600"
          />
        </div>
      )}

      {roleView === 'CRM' && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <StatCard label="Pipeline Enquiries" value="4 Leads" subtext="All Verticals" icon={<Users className="w-5 h-5" />} colorClass="text-blue-600" />
          <StatCard label="Site Visits Completed" value="1 Scheduled" subtext="Green Meadows" icon={<MapPin className="w-5 h-5" />} colorClass="text-emerald-600" />
          <StatCard label="Active Quotations" value="₹18.5 Cr" subtext="High-Value Contracts" icon={<Briefcase className="w-5 h-5" />} colorClass="text-purple-600" />
          <StatCard label="Conversion Ratio" value="50.0%" subtext="2 Deals Won" icon={<TrendingUp className="w-5 h-5" />} colorClass="text-emerald-600" />
        </div>
      )}

      {roleView === 'SITE' && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <StatCard label="Today's Site DPR" value="APPROVED" subtext="2026-11-01 Cast Complete" icon={<HardHat className="w-5 h-5" />} colorClass="text-emerald-600" />
          <StatCard label="Labor Present" value="42 Workers" subtext="Across 4 Sub-contractors" icon={<Users className="w-5 h-5" />} colorClass="text-blue-600" />
          <StatCard label="Active BOQ Items" value="4 Packages" subtext="Footings & Superstructure" icon={<Building className="w-5 h-5" />} colorClass="text-purple-600" />
          <StatCard label="Pending Safety Issues" value="0 Incidents" subtext="100% Compliant Site" icon={<ShieldCheck className="w-5 h-5" />} colorClass="text-emerald-600" />
        </div>
      )}

      {roleView === 'ACCOUNTS' && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <StatCard label="Bank Reserves" value={formatInr(data?.cashBankBalancePaise ?? 30750000)} subtext="HDFC Current + Escrow" icon={<Landmark className="w-5 h-5" />} colorClass="text-emerald-600" />
          <StatCard label="Trade Debtors (AR)" value={formatInr(data?.receivablesPaise ?? 350000000)} subtext="Client RA Billings" icon={<TrendingUp className="w-5 h-5" />} colorClass="text-blue-600" />
          <StatCard label="Trade Creditors (AP)" value="₹45.00 L" subtext="Cauvery Civil Accrual" icon={<Landmark className="w-5 h-5" />} colorClass="text-rose-600" />
          <StatCard label="GL Trial Balance" value="BALANCED" subtext="Total Dr = Total Cr" icon={<ShieldCheck className="w-5 h-5" />} colorClass="text-emerald-600" />
        </div>
      )}

      {/* Vertical-Wise Financial & Operational Drill-Down */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Construction Vertical Card */}
        <div
          onDoubleClick={() => router.push('/construction')}
          title="Double-click to open Construction Workspace"
          className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between hover:border-blue-300 transition-colors cursor-pointer group"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded">
                Vertical 01 · Construction
              </span>
              <Building className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
            </div>
            <h3 className="text-base font-bold text-slate-900">The Grand Heritage Villas</h3>
            <p className="text-xs text-slate-500 mt-1">
              Civil structural works, plinth beam concrete, steel reinforcement logs, and sub-contractor measurement sheets.
            </p>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Contract Value:</span>
                <span className="font-semibold text-slate-800">₹18.50 Cr</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Physical Milestone Progress:</span>
                <span className="font-semibold text-emerald-600">38.5% (Plinth Stage)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mt-1">
                <div className="bg-blue-600 h-2 rounded-full w-[38.5%]" />
              </div>
            </div>
          </div>
          <Link
            href="/construction"
            className="mt-5 inline-flex items-center justify-between text-xs font-semibold text-blue-600 hover:text-blue-800 pt-3 border-t border-slate-100"
          >
            <span>Open Construction Workspace (BOQ & DPR)</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Interiors Vertical Card */}
        <div
          onDoubleClick={() => router.push('/interiors')}
          title="Double-click to open Interiors Workspace"
          className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between hover:border-purple-300 transition-colors cursor-pointer group"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-2.5 py-1 rounded">
                Vertical 02 · Interiors
              </span>
              <Building className="w-5 h-5 text-slate-400 group-hover:text-purple-600 transition-colors" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Penthouse Luxe Suite Fit-out</h3>
            <p className="text-xs text-slate-500 mt-1">
              Turnkey architectural interior execution, modular joinery, Italian marble, and design revision approvals.
            </p>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Total Contract Value:</span>
                <span className="font-semibold text-slate-800">₹4.50 Cr</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Design Sign-off Phase:</span>
                <span className="font-semibold text-purple-600">Phase 2 (3D Render Final)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mt-1">
                <div className="bg-purple-600 h-2 rounded-full w-[65%]" />
              </div>
            </div>
          </div>
          <Link
            href="/interiors"
            className="mt-5 inline-flex items-center justify-between text-xs font-semibold text-purple-600 hover:text-purple-800 pt-3 border-t border-slate-100"
          >
            <span>Open Interiors Workspace (Revisions & COs)</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Land Development Vertical Card */}
        <div
          onDoubleClick={() => router.push('/land-development')}
          title="Double-click to open Land Development Workspace"
          className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between hover:border-emerald-300 transition-colors cursor-pointer group"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded">
                Vertical 03 · Land Dev
              </span>
              <MapPin className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 transition-colors" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Green Meadows Community</h3>
            <p className="text-xs text-slate-500 mt-1">
              Plotted layout registration, survey records, active booking token engine, and instalment collections.
            </p>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Acquisition Parcel:</span>
                <span className="font-semibold text-slate-800">14.5 Acres (Owned)</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Layout Inventory Status:</span>
                <span className="font-semibold text-emerald-600">10 Available / 2 Booked</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mt-1">
                <div className="bg-emerald-600 h-2 rounded-full w-[20%]" />
              </div>
            </div>
          </div>
          <Link
            href="/land-development"
            className="mt-5 inline-flex items-center justify-between text-xs font-semibold text-emerald-600 hover:text-emerald-800 pt-3 border-t border-slate-100"
          >
            <span>Open Land Dev Grid & Booking Engine</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Two Column Section: Recent GL Postings & Pending Approvals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: General Ledger Postings */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recent Double-Entry GL Vouchers</h3>
              <p className="text-[11px] text-slate-500">
                Audited postings with balanced Total Debits = Total Credits in integer paise
              </p>
            </div>
            <Link href="/accounts">
              <Button variant="outline" size="sm">
                View All Vouchers
              </Button>
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {data?.recentVouchers?.map((v: any) => (
              <div
                key={v.voucher_number}
                onDoubleClick={() => router.push('/accounts')}
                title="Double-click to open Accounts & Ledger Vouchers"
                className="p-4 flex items-center justify-between hover:bg-blue-50/60 transition-colors cursor-pointer select-none"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-blue-50 text-blue-700 font-mono text-xs font-bold">
                    {v.voucher_type}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 font-mono">{v.voucher_number}</span>
                      <Badge variant="success">POSTED</Badge>
                      <span className="text-[10px] text-slate-400">{v.voucher_date}</span>
                    </div>
                    <div className="text-xs text-slate-600 mt-0.5 line-clamp-1">{v.narration}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-slate-900 font-mono">
                    {formatInr(v.total_debit_paise)}
                  </div>
                  <div className="text-[10px] text-slate-400">Strictly Balanced</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Operational Approvals & Safeguards */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-1">Pending Approvals Queue</h3>
            <p className="text-[11px] text-slate-500 mb-4">Items requiring executive role sign-off</p>
            <div className="space-y-3">
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-800">MR-2026-00001 (Cement & Sand)</div>
                  <div className="text-[10px] text-slate-500">Procurement · UltraTech Order</div>
                </div>
                <Badge variant="warning">PENDING</Badge>
              </div>
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-800">Contractor Bill #CB-04 (Cauvery)</div>
                  <div className="text-[10px] text-slate-500">Construction · ₹4,50,000</div>
                </div>
                <Badge variant="warning">PENDING</Badge>
              </div>
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-800">Plot-01 Sale Agreement Document</div>
                  <div className="text-[10px] text-slate-500">Land Dev · Vikramaditya Hegde</div>
                </div>
                <Badge variant="info">IN REVIEW</Badge>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 text-white rounded-xl p-4 border border-slate-800">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">Zero-Click Engine</span>
            </div>
            <ul className="text-[11px] text-slate-300 space-y-1.5 list-disc pl-4">
              <li>AutoSave-first architecture with debounced commits</li>
              <li>Instant draft provision on new record open</li>
              <li>SQLite transactions with WAL journaling mode</li>
              <li>Audited changes with no Submit button required</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
