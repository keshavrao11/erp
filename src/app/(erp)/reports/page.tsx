'use client';
import React, { useState } from 'react';
import { BarChart3, Download, FileSpreadsheet, FileText, Filter, Calendar, Printer } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState('P_L');

  const reportCategories = [
    {
      category: 'Financial & Accounting',
      reports: [
        { id: 'P_L', name: 'Profit & Loss Statement (P&L)', desc: 'Consolidated and vertical-level revenue vs material/labour/overheads' },
        { id: 'BS', name: 'Balance Sheet', desc: 'Assets (Current + Fixed) vs Liabilities & Retained Earnings' },
        { id: 'TB', name: 'Trial Balance Extract', desc: 'Complete audited General Ledger account balances' },
        { id: 'AR_AP', name: 'AR & AP Aging Analysis', desc: 'Overdue customer milestone receivables & vendor payable buckets' },
      ],
    },
    {
      category: 'Project & Site Operations',
      reports: [
        { id: 'CONST_PROG', name: 'Construction Milestone Progress', desc: 'BOQ planned vs actual quantity variance report' },
        { id: 'LABOUR_WAGE', name: 'Labour Headcount & Wage Register', desc: 'Daily attendance logs grouped by contractor & trade' },
        { id: 'MAT_CONSUMP', name: 'Material Consumption vs Estimates', desc: 'Cement, steel & aggregates variance across project phases' },
      ],
    },
    {
      category: 'Real Estate & Land Dev',
      reports: [
        { id: 'PLOT_SALES', name: 'Plot Sales & Collection Realization', desc: 'Booking tokens, agreement collections, and balance receivables' },
        { id: 'JV_REV', name: 'Joint Venture (JV) Revenue Share Statement', desc: 'Landowner revenue entitlement vs company developer share' },
      ],
    },
  ];

  function handleExportCsv() {
    let rows: string[][] = [];
    let title = selectedReport;

    if (selectedReport === 'P_L') {
      title = 'Profit_and_Loss_Statement';
      rows = [
        ['Category', 'Particulars', 'Amount (INR)'],
        ['Operating Revenue', 'Civil Construction Contract Billings', '35000000'],
        ['Operating Revenue', 'Interior Design & Execution Turnover', '8500000'],
        ['Operating Revenue', 'Real Estate Plotted Layout Sales', '5000000'],
        ['Total Revenue', 'Gross Operating Revenue', '48500000'],
        ['Direct Cost', 'Construction Materials (Cement, Steel, Aggregates)', '11925000'],
        ['Direct Cost', 'Sub-contractor Labour & Machine Charges', '4500000'],
        ['Direct Cost', 'Interior Modular Joinery & Hardware', '2850000'],
        ['Total Cost', 'Total Direct Operating Cost', '19275000'],
        ['Operating Margin', 'EBITDA', '29225000'],
      ];
    } else if (selectedReport === 'BS') {
      title = 'Balance_Sheet';
      rows = [
        ['Classification', 'Account Head', 'Amount (INR)'],
        ['Current Assets', 'HDFC Bank Escrow & Current Account', '3075000'],
        ['Current Assets', 'Trade Accounts Receivable (Sundry Debtors)', '18500000'],
        ['Current Assets', 'Material Stock on Site (Inventory Valuation)', '1245000'],
        ['Fixed Assets', 'Land & Site Development Rights', '85000000'],
        ['Current Liabilities', 'Trade Accounts Payable (Vendors & Sub-contractors)', '4500000'],
        ['Current Liabilities', 'Statutory GST & TDS Payable', '1250000'],
        ['Equity', 'Share Capital & Retained Earnings', '99070000'],
      ];
    } else {
      title = `Report_${selectedReport}`;
      rows = [
        ['Parameter', 'Target Value', 'Actual Achieved', 'Variance'],
        ['Milestone Progress', '45.0%', '38.5%', '-6.5%'],
        ['Material Consumption Index', '100%', '98.2%', '+1.8%'],
        ['Labour Budget Utilization', '₹35,00,000', '₹34,60,000', '+₹40,000'],
      ];
    }

    const csvContent = rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${title}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Enterprise Analytics & Reports Engine</h1>
          <p className="text-xs text-slate-500">
            Exportable compliance & management reports (Excel, CSV, PDF) across all business verticals
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={handleExportCsv} icon={<Download className="w-4 h-4" />}>
            Export Excel (CSV)
          </Button>
          <Button size="sm" onClick={() => window.print()} icon={<Printer className="w-4 h-4" />}>
            Export PDF Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Report Selector */}
        <div className="space-y-4">
          {reportCategories.map((cat) => (
            <div key={cat.category} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{cat.category}</h3>
              <div className="space-y-1">
                {cat.reports.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setSelectedReport(r.id)}
                    className={`w-full text-left p-2.5 rounded-lg text-xs transition-colors ${
                      selectedReport === r.id
                        ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div>{r.name}</div>
                    <div className="text-[10px] text-slate-400 font-normal mt-0.5 line-clamp-1">{r.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Right: Live Report Preview */}
        <div className="md:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <div className="text-xs text-slate-400 uppercase font-bold">Report Preview</div>
              <h2 className="text-base font-bold text-slate-900">
                {selectedReport === 'P_L'
                  ? 'Profit & Loss Statement (Year-to-Date FY 2026-27)'
                  : selectedReport === 'BS'
                  ? 'Consolidated Balance Sheet Statement'
                  : selectedReport === 'AR_AP'
                  ? 'Accounts Receivable (AR) & Payable (AP) Aging'
                  : selectedReport === 'CONST_PROG'
                  ? 'Construction Milestone Progress Variance'
                  : selectedReport === 'PLOT_SALES'
                  ? 'Real Estate Plotted Community Sales Realization'
                  : 'Enterprise Financial & Operational Extract'}
              </h2>
            </div>
            <Badge variant="success">AUDIT READY</Badge>
          </div>

          {selectedReport === 'P_L' && (
            <div className="space-y-3">
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between font-bold text-slate-900 pb-1 border-b border-slate-200">
                  <span>Revenue from Operations</span>
                  <span>Amount (INR)</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Civil Construction Contract Billings</span>
                  <span className="font-mono">₹3,50,00,000</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Interior Design & Execution Turnover</span>
                  <span className="font-mono">₹85,00,000</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Real Estate Plotted Layout Sales</span>
                  <span className="font-mono">₹50,00,000</span>
                </div>
                <div className="flex justify-between font-bold text-blue-800 pt-2 border-t border-slate-200">
                  <span>Gross Operating Revenue (A)</span>
                  <span className="font-mono">₹4,85,00,000</span>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between font-bold text-slate-900 pb-1 border-b border-slate-200">
                  <span>Direct Site Operating Expenses</span>
                  <span>Amount (INR)</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Direct Construction Materials (Cement, Steel, Aggregates)</span>
                  <span className="font-mono">₹1,19,25,000</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Sub-contractor Labour & Machine Charges</span>
                  <span className="font-mono">₹45,00,000</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Interior Modular Joinery & Hardware</span>
                  <span className="font-mono">₹28,50,000</span>
                </div>
                <div className="flex justify-between font-bold text-rose-800 pt-2 border-t border-slate-200">
                  <span>Total Direct Operating Cost (B)</span>
                  <span className="font-mono">₹1,92,75,000</span>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-xs flex justify-between font-bold text-emerald-900">
                <span>Net Operating Margin (EBITDA = A - B)</span>
                <span className="font-mono text-sm">₹2,92,25,000 (60.2%)</span>
              </div>
            </div>
          )}

          {selectedReport === 'BS' && (
            <div className="space-y-3">
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between font-bold text-slate-900 pb-1 border-b border-slate-200">
                  <span>Assets</span>
                  <span>Amount (INR)</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Bank & Cash Equivalents (HDFC Escrow)</span>
                  <span className="font-mono">₹30,75,000</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Trade Debtors (Customer Receivables)</span>
                  <span className="font-mono">₹1,85,00,000</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Closing Material Stock on Site</span>
                  <span className="font-mono">₹12,45,000</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Fixed & Land Development Rights</span>
                  <span className="font-mono">₹8,50,00,000</span>
                </div>
                <div className="flex justify-between font-bold text-blue-800 pt-2 border-t border-slate-200">
                  <span>Total Assets</span>
                  <span className="font-mono">₹10,78,20,000</span>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between font-bold text-slate-900 pb-1 border-b border-slate-200">
                  <span>Liabilities & Equity</span>
                  <span>Amount (INR)</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Trade Creditors (Material & Labour Payables)</span>
                  <span className="font-mono">₹45,00,000</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Statutory GST & TDS Liabilities</span>
                  <span className="font-mono">₹12,50,000</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Shareholders Equity & Retained Profits</span>
                  <span className="font-mono">₹10,20,70,000</span>
                </div>
                <div className="flex justify-between font-bold text-blue-800 pt-2 border-t border-slate-200">
                  <span>Total Liabilities & Equity</span>
                  <span className="font-mono">₹10,78,20,000</span>
                </div>
              </div>
            </div>
          )}

          {selectedReport !== 'P_L' && selectedReport !== 'BS' && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-3">
              <div className="flex justify-between font-bold text-slate-900 border-b border-slate-200 pb-2">
                <span>Operational Metric</span>
                <span>Report Output</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>Physical Execution Rate</span>
                <span className="font-mono font-bold text-blue-700">38.5% Plinth Complete</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>Material Quality Inspections</span>
                <span className="font-mono font-bold text-emerald-700">98.5% First-Time Pass</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>Labour Attendance Efficiency</span>
                <span className="font-mono font-bold text-slate-900">42 Workers / Shift</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>Plotted Layout Absorption</span>
                <span className="font-mono font-bold text-purple-700">2 of 12 Plots Registered (₹95.0 L Realized)</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
