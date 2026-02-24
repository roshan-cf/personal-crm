'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import UserMenu from './UserMenu';
import { useAuth } from './AuthProvider';

export default function Nav() {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  const links = [
    { href: '/', label: 'Dashboard' },
    { href: '/contacts', label: 'Contacts' },
    { href: '/settings', label: 'Settings' },
  ];

  const isAuthPage = pathname === '/login';

  if (isAuthPage) {
    return null;
  }

  return (
    <nav className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-lg border-b border-slate-200/50 dark:border-zinc-800/50 sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="font-bold text-xl bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
            Personal CRM
          </Link>
          <div className="flex items-center gap-4">
            {!loading && user && (
              <>
                <div className="flex gap-1 bg-slate-100 dark:bg-zinc-800 p-1 rounded-xl">
                  {links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                        pathname === link.href
                          ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-white shadow-sm'
                          : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200'
                      }`}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
                <UserMenu />
              </>
            )}
            {!loading && !user && (
              <Link
                href="/login"
                className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-sm font-medium hover:from-violet-700 hover:to-indigo-700 transition-all"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
