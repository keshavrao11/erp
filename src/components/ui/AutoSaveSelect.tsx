'use client';
import React, { useState, useEffect } from 'react';

interface AutoSaveSelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  value: string | number;
  onSave: (val: any) => Promise<void> | void;
  children: React.ReactNode;
}

export function AutoSaveSelect({
  value,
  onSave,
  children,
  className = '',
  ...props
}: AutoSaveSelectProps) {
  const [localVal, setLocalVal] = useState<string | number>(value ?? '');

  useEffect(() => {
    setLocalVal(value ?? '');
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newVal = e.target.value;
    setLocalVal(newVal);
    onSave(newVal);
  };

  return (
    <select
      value={localVal}
      onChange={handleChange}
      className={`w-full text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}
