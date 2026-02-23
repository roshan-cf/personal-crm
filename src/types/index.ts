export type Frequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export type Category = 'family' | 'friends' | 'professional';

export interface Contact {
  id: number;
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
  contact_id: number;
  interacted_at: string;
  notes: string | null;
}

export interface ContactWithLastInteraction extends Contact {
  last_interaction: string | null;
  days_since_interaction: number | null;
  is_due: boolean;
}
