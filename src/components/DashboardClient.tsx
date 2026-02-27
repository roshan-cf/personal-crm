'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { ContactWithLastInteraction } from '@/types';

const getCategoryColor = (cat: string) => {
  const colors: Record<string, string> = {
    family: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
    friends: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    professional: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  };
  return colors[cat] || 'bg-gray-100 text-gray-700';
};

type Channel = 'email' | 'calendar' | 'whatsapp';

interface ChannelStatus {
  [key: string]: 'idle' | 'sending' | 'sent' | 'error';
}

export function DashboardClient() {
  const queryClient = useQueryClient();
  const [channelStatus, setChannelStatus] = useState<ChannelStatus>({
    email: 'idle',
    calendar: 'idle',
    whatsapp: 'idle',
  });
  const [error, setError] = useState<string | null>(null);

  const { data: contacts = [] } = useQuery<ContactWithLastInteraction[]>({
    queryKey: ['contacts'],
    queryFn: async () => {
      const res = await fetch('/api/contacts');
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
  });

  useEffect(() => {
    fetch('/api/sync/tasks', { method: 'POST' }).catch(console.error);
  }, []);

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

  const triggerChannel = async (channel: Channel) => {
    setChannelStatus((prev) => ({ ...prev, [channel]: 'sending' }));
    setError(null);
    try {
      const res = await fetch(`/api/cron/daily-reminder?manual=true&channel=${channel}`, {
        headers: { Authorization: 'Bearer personal-crm-secret-2024' },
      });
      const data = await res.json();
      
      let sent = 0;
      if (channel === 'email') sent = data.emailsSent;
      else if (channel === 'calendar') sent = data.tasksCreated;
      else if (channel === 'whatsapp') sent = data.whatsappSent;
      
      if (sent > 0) {
        setChannelStatus((prev) => ({ ...prev, [channel]: 'sent' }));
        setTimeout(() => setChannelStatus((prev) => ({ ...prev, [channel]: 'idle' })), 3000);
      } else {
        setChannelStatus((prev) => ({ ...prev, [channel]: 'error' }));
        setTimeout(() => setChannelStatus((prev) => ({ ...prev, [channel]: 'idle' })), 3000);
      }
    } catch {
      setChannelStatus((prev) => ({ ...prev, [channel]: 'error' }));
      setTimeout(() => setChannelStatus((prev) => ({ ...prev, [channel]: 'idle' })), 3000);
    }
  };

  const dueContacts = contacts.filter((c) => c.is_due);
  const upcomingContacts = contacts.filter((c) => !c.is_due);

  const getChannelLabel = (channel: Channel) => {
    switch (channel) {
      case 'email': return 'Email';
      case 'calendar': return 'Calendar';
      case 'whatsapp': return 'WhatsApp';
    }
  };

  const getChannelIcon = (channel: Channel) => {
    switch (channel) {
      case 'email':
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      case 'calendar':
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        );
      case 'whatsapp':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {dueContacts.length} contact{dueContacts.length !== 1 ? 's' : ''} to reach out to
          </p>
        </div>
        <Link
          href="/contacts/new"
          className="px-3 py-1.5 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
        >
          + Add Contact
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 mb-6">
        <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-3">Trigger Now</h2>
        <div className="flex gap-2 flex-wrap">
          {(['email', 'calendar', 'whatsapp'] as Channel[]).map((channel) => (
            <button
              key={channel}
              onClick={() => triggerChannel(channel)}
              disabled={channelStatus[channel] === 'sending' || dueContacts.length === 0}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                channelStatus[channel] === 'sent'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : channelStatus[channel] === 'error'
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  : 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {getChannelIcon(channel)}
              <span>
                {channelStatus[channel] === 'sending'
                  ? 'Sending...'
                  : channelStatus[channel] === 'sent'
                  ? `${getChannelLabel(channel)} ✓`
                  : channelStatus[channel] === 'error'
                  ? 'Failed'
                  : `Send ${getChannelLabel(channel)}`}
              </span>
            </button>
          ))}
        </div>
        <p className="text-xs text-zinc-500 mt-2">
          Manually trigger reminders for due contacts via each channel
        </p>
      </div>

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
          <Link
            href="/contacts/new"
            className="inline-block px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
          >
            Add Your First Contact
          </Link>
        </div>
      )}
    </div>
  );
}
