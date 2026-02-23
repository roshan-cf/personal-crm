'use client';

import { useEffect, useState } from 'react';

interface Settings {
  email_enabled: boolean;
  notification_email: string;
  calendar_enabled: boolean;
  whatsapp_enabled: boolean;
  whatsapp_number: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    email_enabled: false,
    notification_email: '',
    calendar_enabled: false,
    whatsapp_enabled: false,
    whatsapp_number: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        setSettings({
          email_enabled: Boolean(data.email_enabled),
          notification_email: data.notification_email || '',
          calendar_enabled: Boolean(data.calendar_enabled),
          whatsapp_enabled: Boolean(data.whatsapp_enabled),
          whatsapp_number: data.whatsapp_number || '',
        });
      })
      .catch(() => setError('Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
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

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-8">
        <p className="text-zinc-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6">Settings</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="space-y-6">
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
          <h2 className="font-medium mb-4">Email Notifications</h2>
          <div className="space-y-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.email_enabled}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, email_enabled: e.target.checked }))
                }
                className="w-4 h-4 rounded"
              />
              <span className="text-sm">Send daily reminder emails at 9 AM IST</span>
            </label>
            {settings.email_enabled && (
              <div>
                <label className="block text-sm font-medium mb-1">Email Address</label>
                <input
                  type="email"
                  value={settings.notification_email}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, notification_email: e.target.value }))
                  }
                  placeholder="your@email.com"
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                />
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
          <h2 className="font-medium mb-4">Google Calendar</h2>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings.calendar_enabled}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, calendar_enabled: e.target.checked }))
              }
              className="w-4 h-4 rounded"
            />
            <span className="text-sm">Create calendar events for follow-ups</span>
          </label>
          {settings.calendar_enabled && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-3">
              Requires Google Cloud Console setup. Contact admin to enable.
            </p>
          )}
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
          <h2 className="font-medium mb-4">WhatsApp Notifications</h2>
          <div className="space-y-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.whatsapp_enabled}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, whatsapp_enabled: e.target.checked }))
                }
                className="w-4 h-4 rounded"
              />
              <span className="text-sm">Send daily reminders via WhatsApp</span>
            </label>
            {settings.whatsapp_enabled && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">WhatsApp Number</label>
                  <input
                    type="tel"
                    value={settings.whatsapp_number}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev, whatsapp_number: e.target.value }))
                    }
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                  />
                </div>
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  WhatsApp requires Twilio API access (paid service).
                </p>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg text-sm font-medium hover:bg-zinc-700 dark:hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
          {saved && (
            <span className="text-sm text-green-600 dark:text-green-400">Settings saved!</span>
          )}
        </div>
      </div>
    </div>
  );
}
