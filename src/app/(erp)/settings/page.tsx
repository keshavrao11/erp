'use client';
import React from 'react';
import { Settings, Database, Building2, Calendar, ShieldCheck, Download, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">System Settings & Company Administration</h1>
          <p className="text-xs text-slate-500">
            Company profile, financial year period closing, database backup controls, and SQLite WAL settings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" icon={<RefreshCw className="w-4 h-4" />}>
            Run WAL Checkpoint
          </Button>
          <Button size="sm" icon={<Download className="w-4 h-4" />}>
            Download Database Backup
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Company Profile */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200">
            <Building2 className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Registered Corporate Entity Profile</h3>
          </div>
          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-500">Legal Name:</span>
              <div className="font-semibold text-slate-800">Proficient Transforms Private Limited</div>
            </div>
            <div>
              <span className="text-slate-500">Trade Brand Name:</span>
              <div className="font-semibold text-slate-800">Proficient Transforms</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-slate-500">GSTIN:</span>
                <div className="font-mono font-semibold text-slate-800">29AAACP0000A1Z5</div>
              </div>
              <div>
                <span className="text-slate-500">Company PAN:</span>
                <div className="font-mono font-semibold text-slate-800">AAACP0000A</div>
              </div>
            </div>
            <div>
              <span className="text-slate-500">Registered Corporate Address:</span>
              <div className="text-slate-700">BM Habitat Mall, Jayalakshmipuram, Mysuru, Karnataka 570012</div>
            </div>
            <div>
              <span className="text-slate-500">Operating Business Verticals:</span>
              <div className="flex gap-2 mt-1">
                <Badge variant="info">Construction</Badge>
                <Badge variant="purple">Interiors</Badge>
                <Badge variant="success">Land Development</Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Year & Period Closing */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200">
            <Calendar className="w-5 h-5 text-purple-600" />
            <h3 className="text-sm font-bold text-slate-900">Financial Year (FY) Controls</h3>
          </div>
          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-500">Active Financial Year:</span>
              <div className="font-bold text-slate-800 text-sm">FY 2026 - 2027 (Starts April 1)</div>
            </div>
            <div>
              <span className="text-slate-500">Accounting Currency:</span>
              <div className="font-semibold text-slate-800">Indian Rupee (INR ₹) · Stored in Paise</div>
            </div>
            <div>
              <span className="text-slate-500">Period Closing Status:</span>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="success">October 2026 CLOSED</Badge>
                <Badge variant="warning">November 2026 OPEN</Badge>
              </div>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-600">
              Period closing locks prior general ledger vouchers to prevent retroactive financial alteration.
            </div>
          </div>
        </div>

        {/* Database & Storage Engine */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4 md:col-span-2">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200">
            <Database className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">SQLite 3 Engine Architecture & Diagnostics</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-500">Journal Mode:</span>
              <div className="font-mono font-bold text-emerald-700 text-sm mt-0.5">WAL (Write-Ahead Log)</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-500">Foreign Key Constraints:</span>
              <div className="font-mono font-bold text-emerald-700 text-sm mt-0.5">PRAGMA foreign_keys = ON</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-500">Double-Booking Lock:</span>
              <div className="font-mono font-bold text-blue-700 text-sm mt-0.5">Partial Unique Index</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-500">Audit Log Integrity:</span>
              <div className="font-mono font-bold text-purple-700 text-sm mt-0.5">Immutable Triggers Active</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
