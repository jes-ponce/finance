export type CardType = 'credit' | 'debit';

export interface Card {
  id: string;
  userId: string;
  name: string;
  bank: string;
  type: CardType;
  creditLimit?: number;
  currentBalance?: number;
  cutoffDay?: number;       // Day of month (1-31) when billing cycle closes
  paymentDays?: number;     // Days after cutoff to pay
  color: string;            // Hex color for card UI
  lastFour?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CardSummary extends Card {
  spentThisCycle: number;
  availableCredit: number;
  nextCutoffDate: string;
  nextPaymentDate: string;
  minimumPayment: number;
  totalDue: number;
  installmentDue: number;
}
