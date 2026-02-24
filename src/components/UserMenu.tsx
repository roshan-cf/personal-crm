'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from './AuthProvider';

export default function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
      className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white text-sm font-medium">
          {user.email.charAt(0).toUpperCase()}
        </div>
        <span className="text-sm text-slate-600 dark:text-zinc-300 hidden sm:inline">
          {user.email.split('@')[0]}
        </span>
        <svg
          className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-slate-200 dark:border-zinc-700 py-1 z-10">
          <div className="px-3 py-2 border-b border-slate-100 dark:border-zinc-800">
            <p className="text-xs text-slate-500 dark:text-zinc-400">Signed in as</p>
            <p className="text-sm font-medium text-slate-700 dark:text-zinc-200 truncate">{user.email}</p>
          </div>
          <button
            onClick={() => {
              setOpen(false);
              logout();
            }}
            className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
