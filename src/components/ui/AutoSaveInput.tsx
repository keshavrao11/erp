'use client';
import React, { useState, useEffect, useRef } from 'react';

interface AutoSaveInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string | number;
  onSave: (val: any) => Promise<void> | void;
  debounceMs?: number;
  type?: string;
}

export function AutoSaveInput({
  value,
  onSave,
  debounceMs = 600,
  type = 'text',
  className = '',
  ...props
}: AutoSaveInputProps) {
  const [localVal, setLocalVal] = useState<string | number>(value ?? '');
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const latestValRef = useRef(localVal);

  useEffect(() => {
    setLocalVal(value ?? '');
    latestValRef.current = value ?? '';
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value;
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
    <input
      type={type}
      value={localVal}
      onChange={handleChange}
      onBlur={handleBlur}
      className={`w-full text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors ${className}`}
      {...props}
    />
  );
}
