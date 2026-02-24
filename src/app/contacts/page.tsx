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
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded w-24"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">Contacts</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {contacts.length} contact{contacts.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <Link
          href="/contacts/new"
          className="px-3 py-1.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
        >
          + Add Contact
        </Link>
      </div>

      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
          <button
            onClick={() => setFilter((prev) => ({ ...prev, category: '' }))}
            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
              filter.category === ''
                ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white'
                : 'text-zinc-500 dark:text-zinc-400'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter((prev) => ({ ...prev, category: cat }))}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                filter.category === cat
                  ? getCategoryColor(cat)
                  : 'text-zinc-500 dark:text-zinc-400'
              }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
        
        <select
          value={filter.frequency}
          onChange={(e) => setFilter((prev) => ({ ...prev, frequency: e.target.value }))}
          className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
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
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
          {error}
        </div>
      )}

      {filteredContacts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-zinc-500">
            {contacts.length === 0 ? 'No contacts yet.' : 'No contacts match your filters.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredContacts.map((contact) => (
            <div
              key={contact.id}
              className="group flex items-center justify-between p-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-300 font-medium">
                  {contact.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/contacts/${contact.id}`}
                      className="font-medium text-zinc-900 dark:text-white hover:underline truncate"
                    >
                      {contact.name}
                    </Link>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        contact.is_due
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      }`}
                    >
                      {contact.is_due ? 'Due' : 'On Track'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-zinc-500 truncate">{contact.relation}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${getCategoryColor(contact.category)}`}>
                      {contact.category}
                    </span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                      {contact.frequency}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Link
                  href={`/contacts/${contact.id}/edit`}
                  className="px-2 py-1 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded transition-colors"
                >
                  Edit
                </Link>
                <button
                  onClick={() => deleteContact(contact.id)}
                  className="px-2 py-1 text-sm text-red-600 hover:text-red-700 rounded transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
