'use client';
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Search, Download } from 'lucide-react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  pageSize?: number;
  emptyMessage?: string;
  keyField?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  searchFilter?: (item: T, query: string) => boolean;
  exportable?: boolean;
  exportFileName?: string;
  onRowClick?: (row: T) => void;
  onRowDoubleClick?: (row: T) => void;
  doubleClickHint?: string;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  pageSize = 15,
  emptyMessage = 'No records found',
  keyField = 'id',
  searchable = false,
  searchPlaceholder = 'Search records...',
  searchFilter,
  exportable = true,
  exportFileName = 'erp-export',
  onRowClick,
  onRowDoubleClick,
  doubleClickHint,
}: DataTableProps<T>) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const filtered = searchable && search && searchFilter
    ? data.filter(item => searchFilter(item, search.toLowerCase()))
    : data;

  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, pages);
  const sliced = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleExportCsv = () => {
    if (filtered.length === 0) return;
    const headerRow = columns.map(c => `"${c.header.replace(/"/g, '""')}"`).join(',');
    const rows = filtered.map(row =>
      columns.map(c => {
        const val = row[c.key];
        const str = val !== undefined && val !== null ? String(val) : '';
        return `"${str.replace(/"/g, '""')}"`;
      }).join(',')
    );
    const csvContent = [headerRow, ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${exportFileName}-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
      <div className="p-3 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
        {searchable ? (
          <div className="relative w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        ) : <div />}
        <div className="flex items-center gap-3">
          {onRowDoubleClick && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-blue-600 bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded-md font-medium">
              Double-click row to open
            </span>
          )}
          <span className="text-xs text-slate-500 font-medium">Total: {total} items</span>
          {exportable && total > 0 && (
            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-2xs"
              title="Download CSV Export"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>
          )}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
              {columns.map((col) => (
                <th key={col.key} className={`px-4 py-3 ${col.className || ''}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sliced.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-slate-400 text-sm">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sliced.map((row, i) => (
                <tr
                  key={row[keyField] ?? i}
                  onClick={() => onRowClick?.(row)}
                  onDoubleClick={() => onRowDoubleClick?.(row)}
                  title={onRowDoubleClick ? (doubleClickHint || 'Double-click to open record details') : undefined}
                  className={`transition-colors ${
                    onRowDoubleClick || onRowClick
                      ? 'hover:bg-blue-50/70 cursor-pointer select-none active:bg-blue-100/50'
                      : 'hover:bg-slate-50/80'
                  }`}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={`px-4 py-2.5 text-slate-700 ${col.className || ''}`}>
                      {col.render ? col.render(row) : String(row[col.key] ?? '-')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-t border-slate-200 text-xs text-slate-500">
          <span>
            Showing {total === 0 ? 0 : (currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, total)} of {total}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 font-medium text-slate-700">Page {currentPage} of {pages}</span>
            <button
              onClick={() => setPage(p => Math.min(pages, p + 1))}
              disabled={currentPage === pages}
              className="p-1 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
