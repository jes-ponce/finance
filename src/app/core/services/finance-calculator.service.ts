import { Injectable, computed } from '@angular/core';
import { IncomeService } from './income.service';
import { ExpenseService } from './expense.service';
import { InstallmentService } from './installment.service';
import { CardService } from './card.service';
import { ThirdPartyService } from './third-party.service';
import { EXPENSE_CATEGORIES } from '../models';

export interface MonthlySnapshot {
  year: number;
  month: number;
  totalIncome: number;
  totalExpenses: number;
  installmentExpenses: number;
  balance: number;
  savingsRate: number;
}

export interface DashboardSummary {
  currentMonthIncome: number;
  currentMonthExpenses: number;
  currentMonthBalance: number;
  totalActiveDebt: number;
  monthlyInstallmentBurden: number;
  availableCash: number;
  categoryBreakdown: { category: string; label: string; icon: string; color: string; amount: number; percentage: number }[];
  last6Months: MonthlySnapshot[];
  upcomingPayments: { description: string; amount: number; dueDate: string; type: string; color: string }[];
  thirdPartyPending: number;
}

@Injectable({ providedIn: 'root' })
export class FinanceCalculatorService {
  constructor(
    private incomeService: IncomeService,
    private expenseService: ExpenseService,
    private installmentService: InstallmentService,
    private cardService: CardService,
    private thirdPartyService: ThirdPartyService,
  ) {}

  getDashboardSummary(): DashboardSummary {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    const currentMonthIncome = this.incomeService.getTotalByMonth(year, month);
    const currentMonthExpenses = this.expenseService.getTotalByMonth(year, month);
    const monthlyInstallmentBurden = this.installmentService.getTotalActiveMonthly();
    const currentMonthBalance = currentMonthIncome - currentMonthExpenses - monthlyInstallmentBurden;

    // Category breakdown for current month
    const expenses = this.expenseService.getByMonth(year, month);
    const totalExp = expenses.reduce((s, e) => s + e.amount, 0) + monthlyInstallmentBurden;
    const categoryBreakdown = EXPENSE_CATEGORIES.map(cat => {
      const amount = expenses
        .filter(e => e.category === cat.value)
        .reduce((s, e) => s + e.amount, 0);
      return {
        category: cat.value,
        label: cat.label,
        icon: cat.icon,
        color: cat.color,
        amount,
        percentage: totalExp > 0 ? Math.round((amount / totalExp) * 100) : 0,
      };
    }).filter(c => c.amount > 0).sort((a, b) => b.amount - a.amount);

    // Last 6 months
    const last6Months: MonthlySnapshot[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(year, month - i, 1);
      const y = d.getFullYear();
      const m = d.getMonth();
      const totalIncome = this.incomeService.getTotalByMonth(y, m);
      const totalExpenses = this.expenseService.getTotalByMonth(y, m);
      const installmentExpenses = this.installmentService.getTotalActiveMonthly();
      const balance = totalIncome - totalExpenses - installmentExpenses;
      last6Months.push({
        year: y,
        month: m,
        totalIncome,
        totalExpenses: totalExpenses + installmentExpenses,
        installmentExpenses,
        balance,
        savingsRate: totalIncome > 0 ? Math.round((balance / totalIncome) * 100) : 0,
      });
    }

    // Upcoming payments (next 30 days from installments)
    const upcomingPayments: DashboardSummary['upcomingPayments'] = [];
    const installments = this.installmentService.getWithCards();
    installments.forEach(inst => {
      const nextPayment = inst.schedule.find(s => !s.paid);
      if (nextPayment) {
        const due = new Date(nextPayment.dueDate);
        const daysFromNow = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysFromNow <= 30) {
          upcomingPayments.push({
            description: `${inst.merchant} (${inst.paidMonths + 1}/${inst.months})`,
            amount: inst.monthlyPayment,
            dueDate: nextPayment.dueDate,
            type: 'installment',
            color: inst.cardColor,
          });
        }
      }
    });

    // Card payment due dates
    this.cardService.cards().forEach(card => {
      if (card.type === 'credit') {
        const payDate = this.cardService.getNextPaymentDate(card);
        const daysFromNow = Math.ceil((payDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysFromNow <= 30) {
          upcomingPayments.push({
            description: `Pago ${card.name}`,
            amount: this.installmentService.getMonthlyDueForCard(card.id, year, month),
            dueDate: payDate.toISOString(),
            type: 'card',
            color: card.color,
          });
        }
      }
    });

    upcomingPayments.sort((a, b) => a.dueDate.localeCompare(b.dueDate));

    // Total active debt
    const totalActiveDebt = this.installmentService.installments()
      .filter(i => i.active)
      .reduce((s, i) => s + (i.months - i.paidMonths) * i.monthlyPayment, 0);

    // Third party pending
    const thirdPartyPending = this.thirdPartyService.getSummaries()
      .filter(tp => !tp.isComplete)
      .reduce((s, tp) => s + tp.remainingAmount, 0);

    return {
      currentMonthIncome,
      currentMonthExpenses: currentMonthExpenses + monthlyInstallmentBurden,
      currentMonthBalance,
      totalActiveDebt,
      monthlyInstallmentBurden,
      availableCash: Math.max(0, currentMonthBalance),
      categoryBreakdown,
      last6Months,
      upcomingPayments,
      thirdPartyPending,
    };
  }

  formatMonth(year: number, month: number): string {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
                    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${months[month]} ${year}`;
  }
}
