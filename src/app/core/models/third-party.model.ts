export interface ThirdPartyPayment {
  id: string;
  thirdPartyId: string;
  amount: number;
  date: string;       // ISO date string
  month: string;      // "YYYY-MM" format
  note?: string;
}

export interface ThirdParty {
  id: string;
  userId: string;
  name: string;
  description?: string;
  installmentId: string;  // The purchase they are paying back
  monthlyAmount: number;
  totalExpected: number;  // Total they owe
  payments: ThirdPartyPayment[];
  createdAt: string;
  updatedAt: string;
}

export interface ThirdPartySummary extends ThirdParty {
  paidAmount: number;
  remainingAmount: number;
  installmentMerchant: string;
  nextPaymentDue: string;
  isComplete: boolean;
}
