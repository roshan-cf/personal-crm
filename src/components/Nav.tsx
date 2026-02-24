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
    <nav className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="font-semibold text-lg text-zinc-900 dark:text-white">
            Personal CRM
          </Link>
          <div className="flex items-center gap-3">
            {!loading && user && (
              <>
                <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
                  {links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                        pathname === link.href
                          ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white'
                          : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
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
                className="px-3 py-1.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
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
