import { Injectable, signal } from '@angular/core';
import { StorageService } from './storage.service';
import { AuthService } from './auth.service';
import { CardService } from './card.service';
import { InstallmentPurchase, InstallmentWithCard, InstallmentPaymentSchedule } from '../models';

const COLLECTION = 'installments';

@Injectable({ providedIn: 'root' })
export class InstallmentService {
  private _installments = signal<InstallmentPurchase[]>([]);
  readonly installments = this._installments.asReadonly();

  constructor(
    private storage: StorageService,
    private auth: AuthService,
    private cardService: CardService,
  ) {
    this.load();
  }

  private get userId(): string {
    return this.auth.userId() ?? '';
  }

  load(): void {
    if (!this.userId) { this._installments.set([]); return; }
    this._installments.set(this.storage.getAll<InstallmentPurchase>(COLLECTION, this.userId));
  }

  create(data: Omit<InstallmentPurchase, 'id' | 'userId' | 'monthlyPayment' | 'paidMonths' | 'active' | 'createdAt' | 'updatedAt'>): InstallmentPurchase {
    const now = new Date().toISOString();
    const purchase: InstallmentPurchase = {
      ...data,
      id: this.storage.generateId(),
      userId: this.userId,
      monthlyPayment: parseFloat((data.totalAmount / data.months).toFixed(2)),
      paidMonths: 0,
      active: true,
      createdAt: now,
      updatedAt: now,
    };
    this.storage.create(COLLECTION, purchase);
    this.load();
    return purchase;
  }

  update(id: string, data: Partial<InstallmentPurchase>): InstallmentPurchase {
    const existing = this.storage.getById<InstallmentPurchase>(COLLECTION, id);
    if (!existing) throw new Error('Installment not found');
    const updated: InstallmentPurchase = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.storage.update(COLLECTION, updated);
    this.load();
    return updated;
  }

  delete(id: string): void {
    this.storage.delete(COLLECTION, id);
    this.load();
  }

  markMonthPaid(id: string): void {
    const inst = this.storage.getById<InstallmentPurchase>(COLLECTION, id);
    if (!inst) return;
    const paidMonths = inst.paidMonths + 1;
    const active = paidMonths < inst.months;
    this.update(id, { paidMonths, active });
  }

  buildSchedule(inst: InstallmentPurchase): InstallmentPaymentSchedule[] {
    const start = new Date(inst.startDate);
    const schedule: InstallmentPaymentSchedule[] = [];
    for (let i = 0; i < inst.months; i++) {
      const due = new Date(start.getFullYear(), start.getMonth() + i, start.getDate());
      schedule.push({
        month: i + 1,
        dueDate: due.toISOString(),
        amount: inst.monthlyPayment,
        paid: i < inst.paidMonths,
        paidDate: i < inst.paidMonths ? due.toISOString() : undefined,
      });
    }
    return schedule;
  }

  getWithCards(): InstallmentWithCard[] {
    const cards = this.cardService.cards();
    return this._installments()
      .filter(i => i.active)
      .map(inst => {
        const card = cards.find(c => c.id === inst.cardId);
        const remaining = inst.months - inst.paidMonths;
        return {
          ...inst,
          cardName: card?.name ?? 'Tarjeta eliminada',
          cardColor: card?.color ?? '#6b7280',
          remainingMonths: remaining,
          remainingAmount: remaining * inst.monthlyPayment,
          schedule: this.buildSchedule(inst),
        } as InstallmentWithCard;
      });
  }

  getMonthlyDueForCard(cardId: string, year: number, month: number): number {
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);
    return this._installments()
      .filter(i => i.cardId === cardId && i.active)
      .reduce((sum, i) => {
        const startDate = new Date(i.startDate);
        const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + i.months, startDate.getDate());
        if (startDate <= end && endDate >= start) return sum + i.monthlyPayment;
        return sum;
      }, 0);
  }

  getTotalActiveMonthly(): number {
    return this._installments()
      .filter(i => i.active)
      .reduce((sum, i) => sum + i.monthlyPayment, 0);
  }
}
