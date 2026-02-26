'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';

interface Settings {
  name: string;
  email_enabled: boolean;
  notification_email: string;
  email_schedule_time: string;
  calendar_enabled: boolean;
  calendar_schedule_time: string;
  google_connected: boolean;
  whatsapp_enabled: boolean;
  whatsapp_number: string;
  whatsapp_schedule_time: string;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<Settings>({
    name: '',
    email_enabled: true,
    notification_email: '',
    email_schedule_time: '09:00',
    calendar_enabled: false,
    calendar_schedule_time: '09:00',
    google_connected: false,
    whatsapp_enabled: false,
    whatsapp_number: '',
    whatsapp_schedule_time: '09:00',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/settings').then((r) => r.json()),
      user ? fetch('/api/auth/me').then((r) => r.json()) : Promise.resolve({ user: null }),
    ])
      .then(([settingsData, userData]) => {
        setSettings({
          name: userData.user?.name || '',
          email_enabled: Boolean(settingsData.email_enabled),
          notification_email: settingsData.notification_email || userData.user?.email || '',
          email_schedule_time: settingsData.email_schedule_time || '09:00',
          calendar_enabled: Boolean(settingsData.calendar_enabled),
          calendar_schedule_time: settingsData.calendar_schedule_time || '09:00',
          google_connected: Boolean(settingsData.google_refresh_token),
          whatsapp_enabled: Boolean(settingsData.whatsapp_enabled),
          whatsapp_number: settingsData.whatsapp_number || '',
          whatsapp_schedule_time: settingsData.whatsapp_schedule_time || '09:00',
        });
      })
      .catch(() => setError('Failed to load settings'))
      .finally(() => setLoading(false));
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      if (settings.name !== user?.name) {
        await fetch('/api/auth/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: settings.name }),
        });
      }

      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email_enabled: settings.email_enabled,
          notification_email: settings.notification_email,
          email_schedule_time: settings.email_schedule_time,
          calendar_enabled: settings.calendar_enabled,
          calendar_schedule_time: settings.calendar_schedule_time,
          whatsapp_enabled: settings.whatsapp_enabled,
          whatsapp_number: settings.whatsapp_number,
          whatsapp_schedule_time: settings.whatsapp_schedule_time,
        }),
      });

      if (!res.ok) throw new Error('Failed to save');

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const connectGoogleCalendar = () => {
    window.location.href = '/api/auth/google';
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded w-20"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-white mb-6">Settings</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
          <h2 className="font-medium text-zinc-900 dark:text-white mb-3">Profile</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">Name</label>
              <input
                type="text"
                value={settings.name}
                onChange={(e) => setSettings((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Your name"
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">Email</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-400"
              />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-medium text-zinc-900 dark:text-white">Email</h2>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.email_enabled}
                onChange={(e) => setSettings((prev) => ({ ...prev, email_enabled: e.target.checked }))}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm text-zinc-700 dark:text-zinc-300">Enabled</span>
            </label>
          </div>
          {settings.email_enabled && (
            <div className="space-y-3">
              <input
                type="email"
                value={settings.notification_email}
                onChange={(e) => setSettings((prev) => ({ ...prev, notification_email: e.target.value }))}
                placeholder="your@email.com"
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400"
              />
              <div className="flex items-center gap-2">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Schedule:</span>
                <input
                  type="time"
                  value={settings.email_schedule_time}
                  onChange={(e) => setSettings((prev) => ({ ...prev, email_schedule_time: e.target.value }))}
                  className="px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
                />
                <span className="text-xs text-zinc-500">IST</span>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-medium text-zinc-900 dark:text-white">Google Tasks</h2>
            {!settings.google_connected ? (
              <button
                onClick={connectGoogleCalendar}
                className="flex items-center gap-2 px-3 py-1.5 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Connect
              </button>
            ) : (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.calendar_enabled}
                  onChange={(e) => setSettings((prev) => ({ ...prev, calendar_enabled: e.target.checked }))}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm text-zinc-700 dark:text-zinc-300">Enabled</span>
              </label>
            )}
          </div>
          {settings.google_connected && settings.calendar_enabled && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">Schedule:</span>
              <input
                type="time"
                value={settings.calendar_schedule_time}
                onChange={(e) => setSettings((prev) => ({ ...prev, calendar_schedule_time: e.target.value }))}
                className="px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
              />
              <span className="text-xs text-zinc-500">IST</span>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-medium text-zinc-900 dark:text-white">WhatsApp</h2>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.whatsapp_enabled}
                onChange={(e) => setSettings((prev) => ({ ...prev, whatsapp_enabled: e.target.checked }))}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm text-zinc-700 dark:text-zinc-300">Enabled</span>
            </label>
          </div>
          {settings.whatsapp_enabled && (
            <div className="space-y-3">
              <input
                type="tel"
                value={settings.whatsapp_number}
                onChange={(e) => setSettings((prev) => ({ ...prev, whatsapp_number: e.target.value }))}
                placeholder="+91 98765 43210"
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400"
              />
              <div className="flex items-center gap-2">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Schedule:</span>
                <input
                  type="time"
                  value={settings.whatsapp_schedule_time}
                  onChange={(e) => setSettings((prev) => ({ ...prev, whatsapp_schedule_time: e.target.value }))}
                  className="px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
                />
                <span className="text-xs text-zinc-500">IST</span>
              </div>
              <p className="text-xs text-zinc-500">Add phone numbers to contacts for WhatsApp reminders</p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          {saved && <span className="text-sm text-green-600">Saved!</span>}
        </div>
      </div>
    </div>
  );
}
