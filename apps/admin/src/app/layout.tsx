import type { Metadata } from 'next';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'Stock MA-KAL Admin',
  description: 'Admin dashboard for Stock MA-KAL platform',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased">
        <div className="flex h-screen">
          <AdminSidebar />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </body>
    </html>
  );
}

function AdminSidebar() {
  const links = [
    { href: '/', label: 'Dashboard', icon: '📊' },
    { href: '/features', label: 'Features', icon: '🧩' },
    { href: '/users', label: 'Users', icon: '👥' },
    { href: '/health', label: 'System Health', icon: '💚' },
    { href: '/analytics', label: 'Analytics', icon: '📈' },
  ];

  return (
    <aside className="w-60 bg-admin-surface border-r border-admin-border flex flex-col">
      <div className="p-5 border-b border-admin-border">
        <h1 className="text-lg font-bold text-admin-accent">Stock MA-KAL</h1>
        <p className="text-xs text-admin-muted mt-0.5">Admin Panel</p>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-admin-muted hover:text-admin-text hover:bg-admin-bg transition-colors text-sm"
          >
            <span>{link.icon}</span>
            <span>{link.label}</span>
          </a>
        ))}
      </nav>
      <div className="p-4 border-t border-admin-border text-xs text-admin-muted">
        v1.0.0
      </div>
    </aside>
  );
}
