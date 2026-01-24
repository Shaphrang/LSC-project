import Link from 'next/link';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-slate-100 text-slate-900">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-gradient-to-b from-blue-900 to-blue-800 text-white">
        <div className="p-5 border-b border-blue-700">
          <h1 className="text-lg font-semibold leading-tight">
            MSRLS – LSC MIS
          </h1>
          <p className="text-xs text-blue-200 mt-1">
            Admin Panel
          </p>
        </div>

        <nav className="p-3 space-y-1 text-sm">
          <NavItem href="/dashboard/admin">Dashboard</NavItem>

          <NavSection title="Master Data">
            <NavItem href="/dashboard/admin/lsc">
              LSC Management
            </NavItem>
            <NavItem href="/dashboard/admin/services">
              Services
            </NavItem>
            <NavItem href="/dashboard/admin/lsc-services">
              LSC–Service Mapping
            </NavItem>
          </NavSection>

          <NavSection title="Reports">
            <NavItem href="/dashboard/admin/reports">
              Reports & Analytics
            </NavItem>
          </NavSection>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-y-auto">
        {children}
      </main>
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
      className="block rounded px-3 py-2 hover:bg-blue-700 transition"
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
  return (
    <div className="mt-4">
      <p className="px-3 mb-1 text-xs uppercase tracking-wide text-blue-300">
        {title}
      </p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}
