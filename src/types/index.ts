export type Frequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export type Category = 'family' | 'friends' | 'professional';

export interface User {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
}

export interface Contact {
  id: number;
  user_id: string;
  name: string;
  relation: string;
  remarks: string | null;
  frequency: Frequency;
  frequency_day: number | null;
  category: Category;
  created_at: string;
  updated_at: string;
}

export interface Interaction {
  id: number;
  user_id: string;
  contact_id: number;
  interacted_at: string;
  notes: string | null;
}

export interface ContactWithLastInteraction extends Contact {
  last_interaction: string | null;
  days_since_interaction: number | null;
  is_due: boolean;
}

export interface UserSettings {
  user_id: string;
  email_enabled: boolean;
  notification_email: string | null;
  calendar_enabled: boolean;
  whatsapp_enabled: boolean;
  whatsapp_number: string | null;
  google_refresh_token: string | null;
  google_calendar_id: string | null;
}
