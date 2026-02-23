'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import type { Contact, Interaction } from '@/types';

export default function ContactDetailPage() {
  const router = useRouter();
  const params = useParams();
  const contactId = params.id as string;

  const [contact, setContact] = useState<Contact | null>(null);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [contactRes, interactionsRes] = await Promise.all([
          fetch(`/api/contacts/${contactId}`),
          fetch(`/api/interactions?contact_id=${contactId}`),
        ]);

        if (!contactRes.ok) throw new Error('Failed to fetch contact');
        
        const contactData = await contactRes.json();
        const interactionsData = await interactionsRes.json();

        setContact(contactData);
        setInteractions(interactionsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [contactId]);

  const logInteraction = async () => {
    try {
      const res = await fetch('/api/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact_id: Number(contactId) }),
      });
      if (!res.ok) throw new Error('Failed to log interaction');
      
      const newInteraction = await res.json();
      setInteractions((prev) => [newInteraction, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const deleteContact = async () => {
    if (!confirm('Are you sure you want to delete this contact?')) return;
    try {
      const res = await fetch(`/api/contacts/${contactId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete contact');
      router.push('/contacts');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-8">
        <p className="text-zinc-600 dark:text-zinc-400">Loading...</p>
      </div>
    );
  }

  if (error || !contact) {
    return (
      <div className="max-w-xl mx-auto px-4 py-8">
        <p className="text-red-600">{error || 'Contact not found'}</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/contacts" className="text-sm text-zinc-600 dark:text-zinc-400 hover:underline">
          ← Back to contacts
        </Link>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">{contact.name}</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-1">{contact.relation}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/contacts/${contactId}/edit`}
            className="px-3 py-1.5 text-sm border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            Edit
          </Link>
          <button
            onClick={deleteContact}
            className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-zinc-500 dark:text-zinc-500 mb-1">Category</p>
            <p className="text-sm font-medium capitalize">{contact.category}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 dark:text-zinc-500 mb-1">Frequency</p>
            <p className="text-sm font-medium capitalize">{contact.frequency}</p>
          </div>
        </div>
        {contact.remarks && (
          <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <p className="text-xs text-zinc-500 dark:text-zinc-500 mb-1">Remarks</p>
            <p className="text-sm">{contact.remarks}</p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium">Interaction History</h2>
        <button
          onClick={logInteraction}
          className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          Log Interaction
        </button>
      </div>

      {interactions.length === 0 ? (
        <p className="text-zinc-600 dark:text-zinc-400 text-sm">No interactions recorded yet.</p>
      ) : (
        <div className="space-y-2">
          {interactions.map((interaction) => (
            <div
              key={interaction.id}
              className="p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-800"
            >
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {new Date(interaction.interacted_at).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
              {interaction.notes && (
                <p className="text-sm mt-1">{interaction.notes}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
