'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import type { ContactWithLastInteraction, Category, Frequency } from '@/types';

export default function ContactsPage() {
  const [contacts, setContacts] = useState<ContactWithLastInteraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<{ category: string; frequency: string }>({
    category: '',
    frequency: '',
  });

  const fetchContacts = useCallback(async () => {
    try {
      const res = await fetch('/api/contacts');
      if (!res.ok) throw new Error('Failed to fetch contacts');
      const data = await res.json();
      setContacts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const deleteContact = async (id: number) => {
    if (!confirm('Are you sure you want to delete this contact?')) return;
    try {
      const res = await fetch(`/api/contacts/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete contact');
      setContacts((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const filteredContacts = contacts.filter((c) => {
    if (filter.category && c.category !== filter.category) return false;
    if (filter.frequency && c.frequency !== filter.frequency) return false;
    return true;
  });

  const categories: Category[] = ['family', 'friends', 'professional'];
  const frequencies: Frequency[] = ['daily', 'weekly', 'monthly', 'yearly'];

  const getCategoryColor = (cat: string) => {
    const colors: Record<string, string> = {
      family: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
      friends: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      professional: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    };
    return colors[cat] || '';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-zinc-950 dark:to-zinc-900">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-200 dark:bg-zinc-800 rounded w-1/4"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-zinc-950 dark:to-zinc-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
              Contacts
            </h1>
            <p className="text-slate-500 dark:text-zinc-400 mt-1">
              {contacts.length} contact{contacts.length !== 1 ? 's' : ''} total
            </p>
          </div>
          <Link
            href="/contacts/new"
            className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-sm font-medium hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-500/25"
          >
            + Add Contact
          </Link>
        </div>

        <div className="flex gap-3 mb-6 flex-wrap">
          <div className="flex gap-2 bg-slate-100 dark:bg-zinc-800 p-1 rounded-xl">
            <button
              onClick={() => setFilter((prev) => ({ ...prev, category: '' }))}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                filter.category === ''
                  ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-zinc-400'
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter((prev) => ({ ...prev, category: cat }))}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                  filter.category === cat
                    ? getCategoryColor(cat)
                    : 'text-slate-500 dark:text-zinc-400'
                }`}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
          
          <select
            value={filter.frequency}
            onChange={(e) => setFilter((prev) => ({ ...prev, frequency: e.target.value }))}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
          >
            <option value="">All Frequencies</option>
            {frequencies.map((freq) => (
              <option key={freq} value={freq}>
                {freq.charAt(0).toUpperCase() + freq.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm">
            {error}
          </div>
        )}

        {filteredContacts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-500 dark:text-zinc-400">
              {contacts.length === 0 ? 'No contacts yet.' : 'No contacts match your filters.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredContacts.map((contact) => (
              <div
                key={contact.id}
                className="group flex items-center justify-between p-5 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-400 to-indigo-400 flex items-center justify-center text-white font-semibold text-lg">
                    {contact.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <Link
                        href={`/contacts/${contact.id}`}
                        className="font-semibold text-slate-800 dark:text-white hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                      >
                        {contact.name}
                      </Link>
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          contact.is_due
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        }`}
                      >
                        {contact.is_due ? 'Due' : 'On Track'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-zinc-400">{contact.relation}</p>
                    <div className="flex gap-2 mt-2">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getCategoryColor(contact.category)}`}>
                        {contact.category}
                      </span>
                      <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        {contact.frequency}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link
                    href={`/contacts/${contact.id}/edit`}
                    className="px-3 py-2 text-sm text-slate-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-all"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => deleteContact(contact.id)}
                    className="px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
