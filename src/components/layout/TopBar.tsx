'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  Bell,
  Building,
  Briefcase,
  LogOut,
  ChevronDown,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  X,
  Menu,
} from 'lucide-react';

export function TopBar() {
  const router = useRouter();
  const [user, setUser] = useState<{ fullName: string; roles: string[]; departmentCode?: string; departmentName?: string } | null>(null);
  const [selectedVertical, setSelectedVertical] = useState('All Verticals');
  const [selectedProject, setSelectedProject] = useState('All Projects');
  const [showVerticals, setShowVerticals] = useState(false);
  const [showProjects, setShowProjects] = useState(false);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Notifications State
  const [notifications, setNotifications] = useState<any[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => {
        if (d.fullName) setUser(d);
      })
      .catch(() => {});

    fetchNotifications();
  }, []);

  function fetchNotifications() {
    fetch('/api/notifications')
      .then((r) => r.json())
      .then((d) => {
        if (d.notifications) {
          setNotifications(d.notifications);
          setPendingCount(d.count || 0);
        }
      })
      .catch(() => {});
  }

  // Debounced Search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    const timer = setTimeout(() => {
      setIsSearching(true);
      fetch(`/api/search?q=${encodeURIComponent(searchQuery.trim())}`)
        .then((r) => r.json())
        .then((d) => {
          setSearchResults(d.results || []);
          setShowSearchResults(true);
          setIsSearching(false);
        })
        .catch(() => setIsSearching(false));
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchResults(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  const verticals = [
    'All Verticals',
    'Construction',
    'Interior Design & Execution',
    'Land Development & Real Estate',
  ];

  const projects = [
    'All Projects',
    'The Grand Heritage Villas (Phase 1)',
    'Penthouse Luxe Suite - Interior Fit-out',
    'Green Meadows Gated Plotted Community',
  ];

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-20 shadow-xs">
      {/* Left: Nav Toggle & Global Search & Context Selectors */}
      <div className="flex items-center gap-2.5 flex-1 max-w-2xl">
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('toggle-erp-sidebar'))}
          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
          title="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="relative flex-1" ref={searchRef}>
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => {
              if (searchResults.length > 0) setShowSearchResults(true);
            }}
            placeholder="Global search: projects, plots, BOQ items, accounts, vouchers..."
            className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white transition-all text-slate-700"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setShowSearchResults(false);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Search Results Dropdown */}
          {showSearchResults && (
            <div className="absolute top-full mt-1.5 left-0 w-full bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-40 max-h-96 overflow-y-auto">
              <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 flex items-center justify-between">
                <span>Search Results</span>
                <span>{searchResults.length} matches</span>
              </div>
              {searchResults.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  {isSearching ? 'Searching database...' : 'No matching records found'}
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {searchResults.map((item, idx) => (
                    <Link
                      key={idx}
                      href={item.url}
                      onClick={() => {
                        setShowSearchResults(false);
                        setSearchQuery('');
                      }}
                      className="px-3 py-2 flex items-center justify-between hover:bg-slate-50 transition-colors group"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                          {item.type}
                        </span>
                        <div>
                          <div className="text-xs font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                            {item.name}
                          </div>
                          {item.code && (
                            <div className="text-[10px] text-slate-400 font-mono">
                              Ref: {item.code}
                            </div>
                          )}
                        </div>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Vertical Context Selector */}
        <div className="relative hidden md:block">
          <button
            onClick={() => {
              setShowVerticals(!showVerticals);
              setShowProjects(false);
              setShowNotifications(false);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <Building className="w-3.5 h-3.5 text-blue-600" />
            <span className="truncate max-w-[130px]">{selectedVertical}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>
          {showVerticals && (
            <div className="absolute top-full mt-1.5 left-0 w-60 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-30">
              <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Filter Business Vertical
              </div>
              {verticals.map((v) => (
                <button
                  key={v}
                  onClick={() => {
                    setSelectedVertical(v);
                    setShowVerticals(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                    selectedVertical === v ? 'text-blue-600 font-semibold bg-blue-50/50' : 'text-slate-700'
                  }`}
                >
                  <span className="truncate">{v}</span>
                  {selectedVertical === v && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Project Selector */}
        <div className="relative hidden lg:block">
          <button
            onClick={() => {
              setShowProjects(!showProjects);
              setShowVerticals(false);
              setShowNotifications(false);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <Briefcase className="w-3.5 h-3.5 text-emerald-600" />
            <span className="truncate max-w-[140px]">{selectedProject}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>
          {showProjects && (
            <div className="absolute top-full mt-1.5 left-0 w-72 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-30">
              <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Filter Project Workspace
              </div>
              {projects.map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    setSelectedProject(p);
                    setShowProjects(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                    selectedProject === p ? 'text-blue-600 font-semibold bg-blue-50/50' : 'text-slate-700'
                  }`}
                >
                  <span className="truncate">{p}</span>
                  {selectedProject === p && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: Actions, Alerts, User Profile */}
      <div className="flex items-center gap-3">
        {/* Pending Approvals & Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowVerticals(false);
              setShowProjects(false);
            }}
            className={`relative p-2 rounded-lg transition-colors ${
              showNotifications ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
            title="Pending Approvals & Notifications"
          >
            <Bell className="w-4 h-4" />
            {pendingCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                {pendingCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {showNotifications && (
            <div className="absolute top-full mt-2 right-0 w-84 sm:w-96 bg-white border border-slate-200 rounded-xl shadow-2xl py-2 z-40">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Approvals & Audit Feed</h4>
                  <p className="text-[10px] text-slate-400">Real-time alerts across business verticals</p>
                </div>
                <span className="text-[10px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100">
                  {notifications.length} Total
                </span>
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">No pending alerts</div>
                ) : (
                  notifications.map((n, i) => (
                    <Link
                      key={i}
                      href={n.url}
                      onClick={() => setShowNotifications(false)}
                      className="p-3 flex items-start gap-3 hover:bg-slate-50 transition-colors block text-left"
                    >
                      <div className="mt-0.5">
                        {n.urgency === 'high' ? (
                          <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                            <AlertCircle className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-slate-800 truncate">
                          {n.title}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                          {n.description}
                        </div>
                        <div className="text-[9px] text-slate-400 mt-1 font-mono">
                          {n.timestamp ? new Date(n.timestamp).toLocaleTimeString() : 'Just now'}
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
              <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <span className="text-[10px] text-slate-500">Auto-refreshed via SQLite triggers</span>
                <button
                  onClick={() => fetchNotifications()}
                  className="text-[10px] font-semibold text-blue-600 hover:underline"
                >
                  Refresh Now
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Card */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-700 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
            {user?.fullName ? user.fullName.charAt(0) : 'J'}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-semibold text-slate-800 leading-tight">
              {user?.fullName || 'Jaisimha Rao'}
            </div>
            <div className="text-[10px] text-slate-500 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-blue-600" />
              <span>
                {user?.departmentCode
                  ? `${user.departmentCode} · ${user?.roles?.[0] || 'STAFF'}`
                  : user?.roles?.[0] || 'SUPER_ADMIN'}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors ml-1"
            title="Sign out of ERP"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
