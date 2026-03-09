export interface InstallmentPurchase {
  id: string;
  userId: string;
  cardId: string;
  merchant: string;
  description: string;
  totalAmount: number;
  months: number;           // Total number of installments
  monthlyPayment: number;   // Calculated: totalAmount / months
  startDate: string;        // ISO date string - month/year of first payment
  category: string;
  thirdPartyId?: string;    // If a third party is paying this back
  paidMonths: number;       // How many months have been paid
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InstallmentPaymentSchedule {
  month: number;           // 1-based (1 = first month)
  dueDate: string;         // ISO date string
  amount: number;
  paid: boolean;
  paidDate?: string;
}

export interface InstallmentWithCard extends InstallmentPurchase {
  cardName: string;
  cardColor: string;
  remainingMonths: number;
  remainingAmount: number;
  schedule: InstallmentPaymentSchedule[];
}
