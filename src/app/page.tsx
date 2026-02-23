'use client';

import { useEffect, useState, useCallback } from 'react';
import type { ContactWithLastInteraction } from '@/types';

export default function Dashboard() {
  const [contacts, setContacts] = useState<ContactWithLastInteraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loggingIds, setLoggingIds] = useState<Set<number>>(new Set());

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

  const logInteraction = async (contactId: number) => {
    setLoggingIds((prev) => new Set(prev).add(contactId));
    try {
      const res = await fetch('/api/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact_id: contactId }),
      });
      if (!res.ok) throw new Error('Failed to log interaction');
      await fetchContacts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoggingIds((prev) => {
        const next = new Set(prev);
        next.delete(contactId);
        return next;
      });
    }
  };

  const dueContacts = contacts.filter((c) => c.is_due);
  const upcomingContacts = contacts.filter((c) => !c.is_due);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-zinc-600 dark:text-zinc-400">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-1">
            {dueContacts.length} contact{dueContacts.length !== 1 ? 's' : ''} to reach out to
          </p>
        </div>
        <a
          href="/contacts/new"
          className="px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg text-sm font-medium hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors"
        >
          Add Contact
        </a>
      </div>

      {dueContacts.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-medium mb-4">Reach Out Today</h2>
          <div className="space-y-3">
            {dueContacts.map((contact) => (
              <div
                key={contact.id}
                className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{contact.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                      {contact.category}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                      {contact.frequency}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                    {contact.relation}
                    {contact.remarks && ` · ${contact.remarks}`}
                  </p>
                  {contact.days_since_interaction !== null && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                      Last: {contact.days_since_interaction} day{contact.days_since_interaction !== 1 ? 's' : ''} ago
                    </p>
                  )}
                </div>
                <button
                  onClick={() => logInteraction(contact.id)}
                  disabled={loggingIds.has(contact.id)}
                  className="ml-4 px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loggingIds.has(contact.id) ? '...' : 'Reached Out'}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {upcomingContacts.length > 0 && (
        <section>
          <h2 className="text-lg font-medium mb-4">Recently Contacted</h2>
          <div className="space-y-3">
            {upcomingContacts.map((contact) => (
              <div
                key={contact.id}
                className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-800"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{contact.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                      {contact.category}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                    {contact.relation}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-green-600 dark:text-green-400">
                    {contact.days_since_interaction === 0
                      ? 'Today'
                      : `${contact.days_since_interaction} day${contact.days_since_interaction !== 1 ? 's' : ''} ago`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {contacts.length === 0 && (
        <div className="text-center py-16">
          <p className="text-zinc-600 dark:text-zinc-400 mb-4">
            No contacts yet. Add your first contact to get started.
          </p>
          <a
            href="/contacts/new"
            className="inline-block px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg text-sm font-medium hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors"
          >
            Add Your First Contact
          </a>
        </div>
      )}
    </div>
  );
}
