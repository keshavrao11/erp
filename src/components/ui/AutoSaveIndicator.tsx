import React from 'react';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface AutoSaveIndicatorProps {
  status: SaveStatus;
  lastSavedAt?: Date | null;
  errorMessage?: string;
  className?: string;
}

export function AutoSaveIndicator({
  status,
  lastSavedAt,
  errorMessage,
  className = '',
}: AutoSaveIndicatorProps) {
  return (
    <div className={`inline-flex items-center gap-1.5 text-[11px] font-medium transition-all duration-200 select-none ${className}`}>
      {status === 'saving' && (
        <span className="flex items-center gap-1.5 text-blue-600 animate-pulse">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Saving...</span>
        </span>
      )}
      {status === 'saved' && (
        <span className="flex items-center gap-1.5 text-emerald-600 transition-opacity">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>All changes saved</span>
          {lastSavedAt && (
            <span className="text-[10px] text-slate-400 font-normal">
              ({lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })})
            </span>
          )}
        </span>
      )}
      {status === 'error' && (
        <span className="flex items-center gap-1.5 text-rose-600" title={errorMessage || 'Error saving changes'}>
          <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
          <span>Save failed – retrying</span>
        </span>
      )}
      {status === 'idle' && (
        <span className="flex items-center gap-1.5 text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
          <span>Saved</span>
        </span>
      )}
    </div>
  );
}
