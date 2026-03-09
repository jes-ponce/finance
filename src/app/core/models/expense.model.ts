export type ExpenseCategory =
  | 'food'
  | 'transport'
  | 'services'
  | 'entertainment'
  | 'health'
  | 'shopping'
  | 'education'
  | 'travel'
  | 'other';

export type PaymentMethod = 'cash' | 'debit' | 'credit' | 'transfer';

export const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string; icon: string; color: string }[] = [
  { value: 'food',          label: 'Comida',          icon: '🍔', color: '#f97316' },
  { value: 'transport',     label: 'Transporte',      icon: '🚗', color: '#3b82f6' },
  { value: 'services',      label: 'Servicios',       icon: '⚡', color: '#a855f7' },
  { value: 'entertainment', label: 'Entretenimiento', icon: '🎮', color: '#ec4899' },
  { value: 'health',        label: 'Salud',           icon: '🏥', color: '#10b981' },
  { value: 'shopping',      label: 'Compras',         icon: '🛍️', color: '#f59e0b' },
  { value: 'education',     label: 'Educación',       icon: '📚', color: '#6366f1' },
  { value: 'travel',        label: 'Viajes',          icon: '✈️', color: '#14b8a6' },
  { value: 'other',         label: 'Otro',            icon: '📦', color: '#6b7280' },
];

export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'cash',     label: 'Efectivo' },
  { value: 'debit',    label: 'Débito' },
  { value: 'credit',   label: 'Crédito' },
  { value: 'transfer', label: 'Transferencia' },
];

export interface Expense {
  id: string;
  userId: string;
  amount: number;
  category: ExpenseCategory;
  description: string;
  date: string; // ISO date string
  paymentMethod: PaymentMethod;
  cardId?: string;
  installmentId?: string; // If this expense came from an installment
  createdAt: string;
  updatedAt: string;
}
