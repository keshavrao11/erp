import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: React.ReactNode;
  trend?: { value: string; positive: boolean };
  colorClass?: string;
}

export function StatCard({ label, value, subtext, icon, trend, colorClass = 'text-blue-600' }: StatCardProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
        {icon && <div className={`p-2 rounded-lg bg-slate-50 ${colorClass}`}>{icon}</div>}
      </div>
      <div className="text-2xl font-bold text-slate-900 tracking-tight">{value}</div>
      <div className="mt-1 flex items-center gap-2">
        {trend && (
          <span className={`text-xs font-semibold ${trend.positive ? 'text-emerald-600' : 'text-rose-500'}`}>
            {trend.positive ? '▲' : '▼'} {trend.value}
          </span>
        )}
        {subtext && <span className="text-xs text-slate-500">{subtext}</span>}
      </div>
    </div>
  );
}
