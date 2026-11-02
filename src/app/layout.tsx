import './globals.css';
import React from 'react';

export const metadata = {
  title: 'Proficient Transforms - Integrated Enterprise ERP',
  description: 'Construction, Interiors, and Land Development ERP',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-100 text-slate-900 font-sans antialiased">{children}</body>
    </html>
  );
}
