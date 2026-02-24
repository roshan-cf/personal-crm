'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';

interface Settings {
  name: string;
  email_enabled: boolean;
  notification_email: string;
  calendar_enabled: boolean;
  google_connected: boolean;
  whatsapp_enabled: boolean;
  whatsapp_number: string;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<Settings>({
    name: '',
    email_enabled: true,
    notification_email: '',
    calendar_enabled: false,
    google_connected: false,
    whatsapp_enabled: false,
    whatsapp_number: '',
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
          calendar_enabled: Boolean(settingsData.calendar_enabled),
          google_connected: Boolean(settingsData.google_refresh_token),
          whatsapp_enabled: Boolean(settingsData.whatsapp_enabled),
          whatsapp_number: settingsData.whatsapp_number || '',
        });
      })
      .catch(() => setError('Failed to load settings'))
      .finally(() => setLoading(false));
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      // Update name
      if (settings.name !== user?.name) {
        await fetch('/api/auth/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: settings.name }),
        });
      }

      // Update settings
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email_enabled: settings.email_enabled,
          notification_email: settings.notification_email,
          calendar_enabled: settings.calendar_enabled,
          whatsapp_enabled: settings.whatsapp_enabled,
          whatsapp_number: settings.whatsapp_number,
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-zinc-950 dark:to-zinc-900">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-200 dark:bg-zinc-800 rounded w-1/4"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-zinc-950 dark:to-zinc-900">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent mb-8">
          Settings
        </h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* Profile Section */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-slate-200 dark:border-zinc-800 p-6">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Profile</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-2">
                  What should we call you?
                </label>
                <input
                  type="text"
                  value={settings.name}
                  onChange={(e) => setSettings((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Your name"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/50 text-slate-500 dark:text-zinc-400"
                />
              </div>
            </div>
          </div>

          {/* Email Notifications */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-slate-200 dark:border-zinc-800 p-6">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Email Notifications</h2>
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.email_enabled}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, email_enabled: e.target.checked }))
                  }
                  className="w-5 h-5 rounded text-violet-600 focus:ring-violet-500"
                />
                <div>
                  <span className="text-sm font-medium text-slate-700 dark:text-zinc-300">
                    Send daily reminder emails
                  </span>
                  <p className="text-xs text-slate-500 dark:text-zinc-500">
                    Get notified at 9 AM IST about contacts you need to reach out to
                  </p>
                </div>
              </label>
              {settings.email_enabled && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-2">
                    Send reminders to
                  </label>
                  <input
                    type="email"
                    value={settings.notification_email}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev, notification_email: e.target.value }))
                    }
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Google Calendar */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-slate-200 dark:border-zinc-800 p-6">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Google Calendar</h2>
            <div className="space-y-4">
              {!settings.google_connected ? (
                <div className="space-y-4">
                  <p className="text-sm text-slate-600 dark:text-zinc-400">
                    Connect your Google Calendar to automatically create tasks for contacts you need to reach out to.
                  </p>
                  <button
                    onClick={connectGoogleCalendar}
                    className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-700 transition-colors"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span className="text-sm font-medium">Connect Google Calendar</span>
                  </button>
                  <div className="p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-xl">
                    <h3 className="text-sm font-medium text-slate-700 dark:text-zinc-300 mb-2">How it works:</h3>
                    <ul className="text-xs text-slate-600 dark:text-zinc-400 space-y-1">
                      <li>• Connect your Google account once</li>
                      <li>• Every morning at 9 AM IST, we create calendar events for contacts due that day</li>
                      <li>• Each event includes the contact's name and relation</li>
                      <li>• You can disable this anytime</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                    <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-green-700 dark:text-green-400 font-medium">
                      Google Calendar connected
                    </span>
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.calendar_enabled}
                      onChange={(e) =>
                        setSettings((prev) => ({ ...prev, calendar_enabled: e.target.checked }))
                      }
                      className="w-5 h-5 rounded text-violet-600 focus:ring-violet-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-slate-700 dark:text-zinc-300">
                        Create daily calendar tasks
                      </span>
                      <p className="text-xs text-slate-500 dark:text-zinc-500">
                        Automatically create calendar events for contacts due each day
                      </p>
                    </div>
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* WhatsApp */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-slate-200 dark:border-zinc-800 p-6">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">WhatsApp Notifications</h2>
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.whatsapp_enabled}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, whatsapp_enabled: e.target.checked }))
                  }
                  className="w-5 h-5 rounded text-violet-600 focus:ring-violet-500"
                />
                <div>
                  <span className="text-sm font-medium text-slate-700 dark:text-zinc-300">
                    Send daily reminders via WhatsApp
                  </span>
                  <p className="text-xs text-slate-500 dark:text-zinc-500">
                    Get notified on your phone about due contacts
                  </p>
                </div>
              </label>
              {settings.whatsapp_enabled && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-2">
                    WhatsApp Number
                  </label>
                  <input
                    type="tel"
                    value={settings.whatsapp_number}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev, whatsapp_number: e.target.value }))
                    }
                    placeholder="+91 98765 43210"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                  />
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                    Note: WhatsApp integration requires Twilio (coming soon)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-medium hover:from-violet-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-violet-500/25"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
            {saved && (
              <span className="text-sm text-green-600 dark:text-green-400 font-medium">Settings saved!</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
