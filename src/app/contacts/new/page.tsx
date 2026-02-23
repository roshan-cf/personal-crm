'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Category, Frequency } from '@/types';

export default function NewContactPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    relation: '',
    remarks: '',
    frequency: 'weekly' as Frequency,
    frequency_day: null as number | null,
    category: 'friends' as Category,
  });

  const categories: Category[] = ['family', 'friends', 'professional'];
  const frequencies: Frequency[] = ['daily', 'weekly', 'monthly', 'yearly'];
  const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create contact');
      }

      router.push('/contacts');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (cat: string) => {
    const colors: Record<string, string> = {
      family: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800',
      friends: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
      professional: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800',
    };
    return colors[cat] || '';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-zinc-950 dark:to-zinc-900">
      <div className="max-w-xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href="/contacts" className="text-sm text-slate-500 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
            ← Back to contacts
          </Link>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-slate-200 dark:border-zinc-800 p-8">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent mb-6">
            Add New Contact
          </h1>

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-2">
                Name *
              </label>
              <input
                type="text"
                id="name"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label htmlFor="relation" className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-2">
                Relation *
              </label>
              <input
                type="text"
                id="relation"
                value={form.relation}
                onChange={(e) => setForm((prev) => ({ ...prev, relation: e.target.value }))}
                required
                placeholder="e.g., College friend, Manager, Uncle"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label htmlFor="remarks" className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-2">
                Remarks
              </label>
              <textarea
                id="remarks"
                value={form.remarks}
                onChange={(e) => setForm((prev) => ({ ...prev, remarks: e.target.value }))}
                rows={3}
                placeholder="Notes about this person, interests, important dates..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-2">
                Category
              </label>
              <div className="flex gap-2 flex-wrap">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, category: cat }))}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      form.category === cat
                        ? getCategoryColor(cat)
                        : 'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700'
                    }`}
                  >
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-2">
                Stay in Touch Frequency
              </label>
              <div className="flex gap-2 flex-wrap">
                {frequencies.map((freq) => (
                  <button
                    key={freq}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, frequency: freq, frequency_day: null }))}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      form.frequency === freq
                        ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700'
                    }`}
                  >
                    {freq.charAt(0).toUpperCase() + freq.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {form.frequency === 'weekly' && (
              <div className="animate-in slide-in-from-top-2 duration-200">
                <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-2">
                  Which day of the week?
                </label>
                <div className="flex gap-2 flex-wrap">
                  {weekDays.map((day, index) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, frequency_day: index }))}
                      className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                        form.frequency_day === index
                          ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700'
                      }`}
                    >
                      {day.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {form.frequency === 'monthly' && (
              <div className="animate-in slide-in-from-top-2 duration-200">
                <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-2">
                  Which date of the month?
                </label>
                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((date) => (
                    <button
                      key={date}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, frequency_day: date }))}
                      className={`px-2 py-2 rounded-lg text-sm font-medium transition-all ${
                        form.frequency_day === date
                          ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700'
                      }`}
                    >
                      {date}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-medium hover:from-violet-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-violet-500/25"
              >
                {loading ? 'Creating...' : 'Create Contact'}
              </button>
              <Link
                href="/contacts"
                className="px-6 py-3 border border-slate-200 dark:border-zinc-700 rounded-xl font-medium hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
