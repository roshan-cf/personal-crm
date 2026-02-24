'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import type { ContactWithLastInteraction } from '@/types';

const getCategoryColor = (cat: string) => {
  const colors: Record<string, string> = {
    family: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
    friends: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    professional: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  };
  return colors[cat] || 'bg-gray-100 text-gray-700';
};

export function DashboardClient() {
  const queryClient = useQueryClient();
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: contacts = [] } = useQuery<ContactWithLastInteraction[]>({
    queryKey: ['contacts'],
    queryFn: async () => {
      const res = await fetch('/api/contacts');
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
  });

  const logMutation = useMutation({
    mutationFn: async (contactId: number) => {
      const res = await fetch('/api/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact_id: contactId }),
      });
      if (!res.ok) throw new Error('Failed');
    },
    onMutate: async (contactId) => {
      await queryClient.cancelQueries({ queryKey: ['contacts'] });
      const previous = queryClient.getQueryData<ContactWithLastInteraction[]>(['contacts']);
      queryClient.setQueryData<ContactWithLastInteraction[]>(['contacts'], (old) =>
        old?.filter((c) => c.id !== contactId)
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) queryClient.setQueryData(['contacts'], context.previous);
      setError('Failed to log interaction');
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['contacts'] }),
  });

  const triggerEmail = async () => {
    setSendingEmail(true);
    try {
      const res = await fetch('/api/cron/daily-reminder?manual=true', {
        headers: { Authorization: 'Bearer personal-crm-secret-2024' },
      });
      const data = await res.json();
      if (data.emailsSent) {
        setEmailSent(true);
        setTimeout(() => setEmailSent(false), 3000);
      }
    } catch {
      setError('Failed to send email');
    } finally {
      setSendingEmail(false);
    }
  };

  const dueContacts = contacts.filter((c) => c.is_due);
  const upcomingContacts = contacts.filter((c) => !c.is_due);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {dueContacts.length} contact{dueContacts.length !== 1 ? 's' : ''} to reach out to
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={triggerEmail}
            disabled={sendingEmail || dueContacts.length === 0}
            className="px-3 py-1.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {sendingEmail ? 'Sending...' : emailSent ? '✓ Sent!' : 'Send Reminder'}
          </button>
          <a
            href="/contacts/new"
            className="px-3 py-1.5 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            + Add Contact
          </a>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
          {error}
        </div>
      )}

      {dueContacts.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-3">Reach Out Today</h2>
          <div className="space-y-2">
            {dueContacts.map((contact) => (
              <div
                key={contact.id}
                className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-medium text-zinc-900 dark:text-white truncate">{contact.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getCategoryColor(contact.category)}`}>
                      {contact.category}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                      {contact.frequency}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-500 truncate">
                    {contact.relation}
                    {contact.remarks && <span className="text-zinc-400"> · {contact.remarks}</span>}
                  </p>
                </div>
                <button
                  onClick={() => logMutation.mutate(contact.id)}
                  disabled={logMutation.isPending}
                  className="ml-4 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                >
                  {logMutation.isPending ? '...' : 'Reached Out'}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {upcomingContacts.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-3">Recently Contacted</h2>
          <div className="space-y-2">
            {upcomingContacts.map((contact) => (
              <div
                key={contact.id}
                className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-zinc-600 dark:text-zinc-300 font-medium text-sm">
                    {contact.name.charAt(0)}
                  </div>
                  <div>
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">{contact.name}</span>
                    <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${getCategoryColor(contact.category)}`}>
                      {contact.category}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-emerald-600 dark:text-emerald-400">
                  {contact.days_since_interaction === 0 ? 'Today' : `${contact.days_since_interaction}d ago`}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {contacts.length === 0 && (
        <div className="text-center py-16">
          <p className="text-zinc-500 dark:text-zinc-400 mb-4">No contacts yet. Add your first contact to get started.</p>
          <a
            href="/contacts/new"
            className="inline-block px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
          >
            Add Your First Contact
          </a>
        </div>
      )}
    </div>
  );
}
