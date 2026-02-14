// frontend\app\dashboard\admin\layout.tsx
'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    /* 🔒 LOCK VIEWPORT */
    <div className="h-screen overflow-hidden bg-slate-100 text-slate-900 flex">

      {/* ===== MOBILE OVERLAY ===== */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ===== SIDEBAR ===== */}
      <aside
        className={`
          fixed md:static z-40
          inset-y-0 left-0
          w-64
          bg-gradient-to-b from-blue-900 to-blue-800
          text-white
          transform transition-transform duration-200
          ${open ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
          flex flex-col
          overflow-hidden
        `}
      >
        {/* Header */}
        <div className="p-5 border-b border-blue-700 shrink-0">
          <h1 className="text-lg font-semibold leading-tight">
            MSRLS – LSC MIS
          </h1>
          <p className="text-xs text-blue-200 mt-1">
            Admin Panel
          </p>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1 text-sm flex-1 overflow-y-auto">
          <NavItem href="/dashboard/admin">Dashboard</NavItem>

          {/* <NavSection title="Master Data">
            <NavItem href="/dashboard/admin/services">Services</NavItem>
          </NavSection> */}

          <NavSection title="LSC Management">
            <NavItem href="/dashboard/admin/lsc/new">Add New + </NavItem>
            <NavItem href="/dashboard/admin/lsc/approved">Approved List</NavItem>
            <NavItem href="/dashboard/admin/lsc/pending">Pending List</NavItem>
            <NavItem href="/dashboard/admin/lsc/rejected">Rejected List</NavItem>
          </NavSection>

          <NavSection title="SERVICES Management">
            <NavItem href="/dashboard/admin/services">Services OLD-V</NavItem>
            <NavItem href="/dashboard/admin/services/categories">Services Categories </NavItem>
            <NavItem href="/dashboard/admin/services/services"> All Services</NavItem>
          </NavSection>



          <NavSection title="Finance and Accounting">
            <NavItem href="/dashboard/admin/finance">Financial Management</NavItem>
            <NavItem href="/dashboard/admin/finance">Income and Expenditure</NavItem>
          </NavSection>

          <NavSection title="Reports">
            <NavItem href="/dashboard/admin/reports">
              Reports & Analytics
            </NavItem>
          </NavSection>
        </nav>

        {/* Logout (fixed bottom) */}
        <div className="p-3 border-t border-blue-700 shrink-0">
          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 rounded hover:bg-blue-700 text-sm flex items-center justify-between"
          >
            Logout
            <span className="opacity-50 text-xs">🚪</span>
          </button>
        </div>
      </aside>

      {/* ===== MAIN AREA ===== */}
      <div className="flex-1 flex flex-col h-full">

        {/* Mobile Header */}
        <header className="md:hidden bg-white border-b px-4 py-3 flex items-center gap-3 shrink-0">
          <button
            onClick={() => setOpen(true)}
            className="p-2 rounded hover:bg-slate-100"
            aria-label="Open menu"
          >
            ☰
          </button>

          <div>
            <p className="text-sm font-semibold leading-tight">
              MSRLS – LSC MIS
            </p>
            <p className="text-xs text-slate-500">
              Admin Panel
            </p>
          </div>
        </header>

        {/* ✅ ONLY THIS SCROLLS */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

/* ---------------- Components ---------------- */

function NavItem({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="block rounded px-3 py-2 hover:bg-blue-700 transition-colors"
    >
      {children}
    </Link>
  );
}

function NavSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false); // Default close

  return (
    <div className="mt-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 mb-1 text-xs uppercase tracking-wide text-blue-300 hover:text-white transition-colors group"
      >
        <span>{title}</span>
        <span className={`transition-transform duration-200 text-[10px] ${isOpen ? 'rotate-180' : 'rotate-0'}`}>
          ▼
        </span>
      </button>
      
      {/* Container with slide animation */}
      <div 
        className={`space-y-1 transition-all duration-300 ease-in-out overflow-hidden ${
          isOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        {children}
      </div>
    </div>
  );
}