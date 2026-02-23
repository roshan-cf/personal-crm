'use client';

import { useEffect, useState, useCallback } from 'react';
import type { ContactWithLastInteraction } from '@/types';

export default function Dashboard() {
  const [contacts, setContacts] = useState<ContactWithLastInteraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loggingIds, setLoggingIds] = useState<Set<number>>(new Set());
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

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

  const triggerEmail = async () => {
    setSendingEmail(true);
    try {
      const res = await fetch('/api/cron/daily-reminder?manual=true', {
        headers: { 'Authorization': 'Bearer personal-crm-secret-2024' }
      });
      const data = await res.json();
      if (data.emailSent) {
        setEmailSent(true);
        setTimeout(() => setEmailSent(false), 3000);
      }
    } catch (err) {
      setError('Failed to send email');
    } finally {
      setSendingEmail(false);
    }
  };

  const dueContacts = contacts.filter((c) => c.is_due);
  const upcomingContacts = contacts.filter((c) => !c.is_due);

  const getCategoryColor = (cat: string) => {
    const colors: Record<string, string> = {
      family: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
      friends: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      professional: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    };
    return colors[cat] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-zinc-950 dark:to-zinc-900">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-200 dark:bg-zinc-800 rounded w-1/4"></div>
            <div className="h-4 bg-slate-200 dark:bg-zinc-800 rounded w-1/2"></div>
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
              Dashboard
            </h1>
            <p className="text-slate-500 dark:text-zinc-400 mt-1">
              {dueContacts.length} contact{dueContacts.length !== 1 ? 's' : ''} waiting for you
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={triggerEmail}
              disabled={sendingEmail || dueContacts.length === 0}
              className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-sm font-medium hover:from-violet-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-violet-500/25"
            >
              {sendingEmail ? 'Sending...' : emailSent ? '✓ Sent!' : 'Send Reminder'}
            </button>
            <a
              href="/contacts/new"
              className="px-4 py-2 bg-white dark:bg-zinc-800 text-slate-700 dark:text-white rounded-xl text-sm font-medium hover:bg-slate-50 dark:hover:bg-zinc-700 transition-all shadow-sm border border-slate-200 dark:border-zinc-700"
            >
              + Add Contact
            </a>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm">
            {error}
          </div>
        )}

        {dueContacts.length > 0 && (
          <section className="mb-10">
            <h2 className="text-lg font-semibold text-slate-700 dark:text-zinc-200 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-violet-500 rounded-full animate-pulse"></span>
              Reach Out Today
            </h2>
            <div className="space-y-3">
              {dueContacts.map((contact) => (
                <div
                  key={contact.id}
                  className="group flex items-center justify-between p-5 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-semibold text-lg text-slate-800 dark:text-white">{contact.name}</span>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getCategoryColor(contact.category)}`}>
                        {contact.category}
                      </span>
                      <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        {contact.frequency}
                      </span>
                    </div>
                    <p className="text-slate-500 dark:text-zinc-400">
                      {contact.relation}
                      {contact.remarks && <span className="text-slate-400"> · {contact.remarks}</span>}
                    </p>
                    {contact.days_since_interaction !== null && (
                      <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">
                        Last contact: {contact.days_since_interaction} day{contact.days_since_interaction !== 1 ? 's' : ''} ago
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => logInteraction(contact.id)}
                    disabled={loggingIds.has(contact.id)}
                    className="ml-4 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl text-sm font-medium hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-500/25"
                  >
                    {loggingIds.has(contact.id) ? '...' : '✓ Reached Out'}
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {upcomingContacts.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-slate-700 dark:text-zinc-200 mb-4">
              Recently Contacted
            </h2>
            <div className="grid gap-3">
              {upcomingContacts.map((contact) => (
                <div
                  key={contact.id}
                  className="flex items-center justify-between p-4 bg-white/50 dark:bg-zinc-900/50 rounded-2xl border border-slate-200/50 dark:border-zinc-800/50"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-indigo-400 flex items-center justify-center text-white font-semibold">
                      {contact.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-700 dark:text-white">{contact.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getCategoryColor(contact.category)}`}>
                          {contact.category}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 dark:text-zinc-400">{contact.relation}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                      {contact.days_since_interaction === 0
                        ? 'Today'
                        : `${contact.days_since_interaction}d ago`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {contacts.length === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-900/30 dark:to-indigo-900/30 flex items-center justify-center">
              <svg className="w-10 h-10 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-slate-700 dark:text-white mb-2">No contacts yet</h3>
            <p className="text-slate-500 dark:text-zinc-400 mb-6">Add your first contact to start building meaningful relationships.</p>
            <a
              href="/contacts/new"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-medium hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-500/25"
            >
              + Add Your First Contact
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
