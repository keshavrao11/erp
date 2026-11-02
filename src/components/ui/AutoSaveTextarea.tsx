'use client';
import React, { useState, useEffect, useRef } from 'react';

interface AutoSaveTextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  value: string;
  onSave: (val: string) => Promise<void> | void;
  debounceMs?: number;
}

export function AutoSaveTextarea({
  value,
  onSave,
  debounceMs = 700,
  className = '',
  ...props
}: AutoSaveTextareaProps) {
  const [localVal, setLocalVal] = useState<string>(value ?? '');
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const latestValRef = useRef(localVal);

  useEffect(() => {
    setLocalVal(value ?? '');
    latestValRef.current = value ?? '';
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    setLocalVal(newVal);
    latestValRef.current = newVal;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onSave(newVal);
    }, debounceMs);
  };

  const handleBlur = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (latestValRef.current !== value) {
      onSave(latestValRef.current);
    }
  };

  return (
    <textarea
      value={localVal}
      onChange={handleChange}
      onBlur={handleBlur}
      className={`w-full text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors ${className}`}
      {...props}
    />
  );
}
