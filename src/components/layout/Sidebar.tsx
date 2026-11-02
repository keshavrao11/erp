'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  HardHat,
  Paintbrush,
  MapPin,
  ShoppingCart,
  Boxes,
  Landmark,
  UserCheck,
  BarChart3,
  FileText,
  Sliders,
  ShieldCheck,
  Settings,
  Building2,
  ChevronDown,
  Layers,
  Pin,
  PinOff,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';

interface ModuleItem {
  code: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const ALL_MODULES_LIST: ModuleItem[] = [
  { code: 'DASHBOARD', label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { code: 'CRM', label: 'CRM & Sales', href: '/crm', icon: Users },
  { code: 'PROJECTS', label: 'Projects', href: '/projects', icon: FolderKanban },
  { code: 'CONSTRUCTION', label: 'Construction', href: '/construction', icon: HardHat },
  { code: 'INTERIORS', label: 'Interiors', href: '/interiors', icon: Paintbrush },
  { code: 'LAND_DEVELOPMENT', label: 'Land Development', href: '/land-development', icon: MapPin },
  { code: 'PROCUREMENT', label: 'Procurement', href: '/procurement', icon: ShoppingCart },
  { code: 'INVENTORY', label: 'Inventory', href: '/inventory', icon: Boxes },
  { code: 'ACCOUNTS', label: 'Accounts & Finance', href: '/accounts', icon: Landmark },
  { code: 'HR', label: 'HR & Payroll', href: '/hr', icon: UserCheck },
  { code: 'REPORTS', label: 'Reports', href: '/reports', icon: BarChart3 },
  { code: 'DOCUMENTS', label: 'Documents', href: '/documents', icon: FileText },
  { code: 'MASTERS', label: 'Masters', href: '/masters', icon: Sliders },
  { code: 'USERS', label: 'User Management', href: '/users', icon: ShieldCheck },
  { code: 'SETTINGS', label: 'Settings', href: '/settings', icon: Settings },
];

const DEPARTMENTS = [
  { code: 'ALL', name: 'All Departments' },
  { code: 'SALES', name: 'Sales & CRM' },
  { code: 'PURCHASE', name: 'Procurement / Purchase' },
  { code: 'ACCOUNTS', name: 'Finance & Accounts' },
  { code: 'HR', name: 'HR & Payroll' },
  { code: 'INVENTORY', name: 'Stores & Inventory' },
  { code: 'OPERATIONS', name: 'Site Operations' },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  // Auto-hide navigation: default true (collapses to mini-dock and auto-expands on hover)
  const [autoHide, setAutoHide] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const [user, setUser] = useState<{
    fullName: string;
    roles: string[];
    departmentCode: string;
    departmentName: string;
    activeDepartment: string;
    allowedModules: string[];
  } | null>(null);

  const [showDeptDropdown, setShowDeptDropdown] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Load auto-hide preference from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('erp_nav_auto_hide');
      if (saved !== null) {
        setAutoHide(saved === 'true');
      }
    } catch {}
  }, []);

  function toggleAutoHide() {
    setAutoHide((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('erp_nav_auto_hide', String(next));
      } catch {}
      return next;
    });
  }

  // Listen for custom trigger from TopBar hamburger menu
  useEffect(() => {
    function handleToggleNav() {
      setMobileOpen((prev) => !prev);
    }
    window.addEventListener('toggle-erp-sidebar', handleToggleNav);
    return () => window.removeEventListener('toggle-erp-sidebar', handleToggleNav);
  }, []);

  function fetchUserInfo() {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => {
        if (d.fullName) setUser(d);
      })
      .catch(() => {});
  }

  useEffect(() => {
    fetchUserInfo();
  }, []);

  async function handleSwitchDepartment(deptCode: string) {
    setShowDeptDropdown(false);
    try {
      await fetch('/api/auth/switch-department', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ department: deptCode }),
      });
      fetchUserInfo();
      router.refresh();
    } catch {}
  }

  const isSuperAdmin = user?.roles?.includes('SUPER_ADMIN');
  const allowed = user?.allowedModules || ['DASHBOARD'];
  const visibleModules = ALL_MODULES_LIST.filter((m) => allowed.includes(m.code));

  // Determine if drawer is expanded:
  // In auto-hide mode: expanded only when hovered (or on mobile when open).
  // In pinned mode: permanently expanded.
  const isExpanded = autoHide ? isHovered || mobileOpen : true;

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Main Sidebar Container */}
      <aside
        ref={sidebarRef}
        onMouseEnter={() => autoHide && setIsHovered(true)}
        onMouseLeave={() => {
          if (autoHide) {
            setIsHovered(false);
            setShowDeptDropdown(false);
          }
        }}
        className={`relative shrink-0 select-none transition-all duration-200 z-30 ${
          autoHide ? 'w-14' : 'w-64'
        }`}
      >
        {/* Floating / Sliding Drawer Panel */}
        <div
          className={`h-full bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800 transition-all duration-200 ease-in-out ${
            autoHide
              ? isExpanded
                ? 'absolute left-0 top-0 w-64 shadow-2xl z-40 bg-slate-900/98 backdrop-blur-md'
                : 'w-14 overflow-hidden'
              : 'w-64'
          } ${mobileOpen ? 'fixed left-0 top-0 bottom-0 w-64 shadow-2xl z-50 !translate-x-0' : ''}`}
        >
          {/* Header */}
          <div className="h-16 px-3 flex items-center justify-between border-b border-slate-800">
            {isExpanded ? (
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0 shadow-sm">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div className="truncate">
                  <div className="font-bold text-sm text-white leading-tight">Proficient ERP</div>
                  <div className="text-[10px] text-slate-400 font-medium tracking-wide">
                    {autoHide ? 'AUTO-HIDE NAV' : 'PINNED NAV'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mx-auto w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm cursor-pointer" title="Hover to expand navigation">
                <Building2 className="w-5 h-5 text-white" />
              </div>
            )}

            {isExpanded && (
              <div className="flex items-center gap-1">
                {/* Auto-Hide / Pin Toggle Button */}
                <button
                  type="button"
                  onClick={toggleAutoHide}
                  className={`p-1.5 rounded-lg transition-colors text-xs flex items-center gap-1 ${
                    autoHide
                      ? 'text-blue-400 bg-blue-950/60 hover:bg-blue-900/80 border border-blue-800/80'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                  title={autoHide ? 'Auto-Hide Active (Click to Pin)' : 'Pinned (Click to Auto-Hide)'}
                >
                  {autoHide ? (
                    <PinOff className="w-3.5 h-3.5" />
                  ) : (
                    <Pin className="w-3.5 h-3.5" />
                  )}
                </button>

                {/* Mobile close */}
                {mobileOpen && (
                  <button
                    type="button"
                    onClick={() => setMobileOpen(false)}
                    className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Super Admin Department Switcher */}
          {isExpanded && isSuperAdmin && (
            <div className="px-3 pt-3 pb-1 border-b border-slate-800/80">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Department Scope</span>
                <span className="text-blue-400 font-mono">SUPER ADMIN</span>
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowDeptDropdown(!showDeptDropdown)}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 bg-slate-800/90 border border-slate-700/80 rounded-lg text-xs font-semibold text-slate-200 hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-2 truncate">
                    <Layers className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span className="truncate">
                      {DEPARTMENTS.find((d) => d.code === (user?.activeDepartment || 'ALL'))?.name || 'All Departments'}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </button>

                {showDeptDropdown && (
                  <div className="absolute top-full mt-1.5 left-0 w-full bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-1 z-50">
                    {DEPARTMENTS.map((dept) => (
                      <button
                        key={dept.code}
                        type="button"
                        onClick={() => handleSwitchDepartment(dept.code)}
                        className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                          (user?.activeDepartment || 'ALL') === dept.code
                            ? 'text-blue-400 font-bold bg-slate-750'
                            : 'text-slate-300 hover:bg-slate-700/60'
                        }`}
                      >
                        {dept.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation Items */}
          <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto custom-scrollbar">
            {visibleModules.map((m) => {
              const Icon = m.icon;
              const isActive = pathname === m.href || (m.href !== '/dashboard' && pathname.startsWith(m.href));
              return (
                <Link
                  key={m.href}
                  href={m.href}
                  onClick={() => {
                    if (autoHide) {
                      setIsHovered(false);
                      setShowDeptDropdown(false);
                    }
                    if (mobileOpen) setMobileOpen(false);
                  }}
                  className={`flex items-center gap-3 px-2.5 py-2 rounded-lg text-xs font-medium transition-all group ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs font-semibold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                  } ${!isExpanded ? 'justify-center px-0' : ''}`}
                  title={!isExpanded ? m.label : undefined}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-white' : 'text-slate-400'
                    }`}
                  />
                  {isExpanded && <span className="truncate">{m.label}</span>}
                </Link>
              );
            })}
          </nav>

          {/* Footer Status & Auto-Hide Indicator */}
          {isExpanded ? (
            <div className="p-3 border-t border-slate-800 bg-slate-950/40 text-[11px] text-slate-400 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-400">Department</span>
                <span className="text-[10px] font-mono text-blue-400 bg-blue-950/80 px-1.5 py-0.5 rounded border border-blue-900">
                  {user?.departmentCode || 'OPERATIONS'}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px]">
                    {autoHide ? 'Auto-Hide Active' : 'Nav Pinned'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={toggleAutoHide}
                  className="text-[10px] text-blue-400 hover:underline font-medium"
                >
                  {autoHide ? 'Pin Nav' : 'Auto-Hide'}
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => setIsHovered(true)}
              className="p-2 border-t border-slate-800 flex justify-center cursor-pointer hover:bg-slate-800/60 transition-colors"
              title="Click or hover to expand navigation"
            >
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
