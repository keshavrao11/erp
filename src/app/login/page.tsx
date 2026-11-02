'use client';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const demoAccounts = [
    { label: 'Super Admin', u: 'admin', p: 'admin123', dept: 'All Modules' },
    { label: 'Sales User', u: 'sales_user', p: 'sales123', dept: 'CRM & Masters' },
    { label: 'Purchase User', u: 'purchase_user', p: 'purchase123', dept: 'Procurement' },
    { label: 'Accounts User', u: 'accounts_user', p: 'accounts123', dept: 'Ledger & Reports' },
    { label: 'HR User', u: 'hr_user', p: 'hr123', dept: 'HR & Payroll' },
    { label: 'Inventory User', u: 'inventory_user', p: 'inventory123', dept: 'Stores & Stock' },
    { label: 'Operations User', u: 'ops_user', p: 'ops123', dept: 'Site Execution' },
  ];

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      let data: any = {};
      try {
        data = await res.json();
      } catch {
        data = { error: `Server response error (${res.status}). Please check server logs.` };
      }

      if (!res.ok) {
        setError(data.error || 'Authentication failed. Please verify credentials.');
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err: any) {
      setError(err?.message || 'Connection refused: Server is offline or unreachable.');
    } finally {
      setLoading(false);
    }
  }

  function handleSelectDemo(u: string, p: string) {
    setUsername(u);
    setPassword(p);
  }

  return (
    <div className="min-h-screen flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 flex-col justify-center items-center p-12 text-white">
        <div className="flex items-center gap-3 mb-6">
          <Building2 className="w-12 h-12 text-blue-400" />
          <div>
            <h1 className="text-2xl font-bold">Proficient Transforms</h1>
            <p className="text-slate-400 text-sm">Enterprise Resource Planning</p>
          </div>
        </div>
        <p className="text-slate-400 text-center max-w-sm">
          Integrated business management across Construction, Interior Design &amp; Real Estate verticals.
        </p>
        <div className="mt-10 grid grid-cols-3 gap-4 text-center">
          {['Construction', 'Interiors', 'Land Dev'].map(v => (
            <div key={v} className="bg-slate-800 rounded-lg p-4 border border-slate-700/60">
              <div className="text-blue-400 font-semibold text-sm">{v}</div>
            </div>
          ))}
        </div>
        <div className="mt-8 text-xs text-slate-500 font-mono">
          Multi-Department RBAC · SQLite 3 WAL Mode
        </div>
      </div>

      {/* Right login panel */}
      <div className="flex-1 flex items-center justify-center bg-slate-50 p-6 sm:p-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <h2 className="text-2xl font-bold text-slate-900">Sign In</h2>
              </div>
              <p className="text-slate-500 text-xs">Enter your departmental credentials to access the ERP</p>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  placeholder="Enter username"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  placeholder="Enter password"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-xs font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-xs"
              >
                {loading ? 'Authenticating Credentials...' : 'Sign In to Workspace'}
              </button>
            </form>

            {/* Quick Demo Credential Pills */}
            <div className="pt-4 border-t border-slate-200">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Fast Department Switch (1-Click Fill)
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {demoAccounts.map(d => (
                  <button
                    key={d.u}
                    type="button"
                    onClick={() => handleSelectDemo(d.u, d.p)}
                    className={`text-left p-2 rounded-lg border text-[11px] transition-colors ${
                      username === d.u
                        ? 'border-blue-500 bg-blue-50/70 text-blue-900 font-bold'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="truncate font-semibold">{d.label}</div>
                    <div className="text-[9px] text-slate-400 truncate">{d.u}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
