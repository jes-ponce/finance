export type IncomeCategory =
  | 'salary'
  | 'transfer'
  | 'freelance'
  | 'investment'
  | 'rental'
  | 'gift'
  | 'refund'
  | 'other';

export const INCOME_CATEGORIES: { value: IncomeCategory; label: string; icon: string }[] = [
  { value: 'salary',     label: 'Salario',      icon: '💼' },
  { value: 'transfer',   label: 'Transferencia', icon: '🔁' },
  { value: 'freelance',  label: 'Freelance',    icon: '💻' },
  { value: 'investment', label: 'Inversión',    icon: '📈' },
  { value: 'rental',     label: 'Renta',        icon: '🏠' },
  { value: 'gift',       label: 'Regalo',       icon: '🎁' },
  { value: 'refund',     label: 'Reembolso',    icon: '↩️' },
  { value: 'other',      label: 'Otro',         icon: '💰' },
];

export interface Income {
  id: string;
  userId: string;
  amount: number;
  category: IncomeCategory;
  description: string;
  date: string; // ISO date string
  createdAt: string;
  updatedAt: string;
}
