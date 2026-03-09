import { Injectable, signal } from '@angular/core';
import { StorageService } from './storage.service';
import { AuthService } from './auth.service';
import { InstallmentService } from './installment.service';
import { ThirdParty, ThirdPartyPayment, ThirdPartySummary } from '../models';

const COLLECTION = 'third_parties';

@Injectable({ providedIn: 'root' })
export class ThirdPartyService {
  private _thirdParties = signal<ThirdParty[]>([]);
  readonly thirdParties = this._thirdParties.asReadonly();

  constructor(
    private storage: StorageService,
    private auth: AuthService,
    private installmentService: InstallmentService,
  ) {
    this.load();
  }

  private get userId(): string {
    return this.auth.userId() ?? '';
  }

  load(): void {
    if (!this.userId) { this._thirdParties.set([]); return; }
    this._thirdParties.set(this.storage.getAll<ThirdParty>(COLLECTION, this.userId));
  }

  create(data: Omit<ThirdParty, 'id' | 'userId' | 'payments' | 'createdAt' | 'updatedAt'>): ThirdParty {
    const now = new Date().toISOString();
    const tp: ThirdParty = {
      ...data,
      id: this.storage.generateId(),
      userId: this.userId,
      payments: [],
      createdAt: now,
      updatedAt: now,
    };
    this.storage.create(COLLECTION, tp);
    this.load();
    return tp;
  }

  update(id: string, data: Partial<ThirdParty>): ThirdParty {
    const existing = this.storage.getById<ThirdParty>(COLLECTION, id);
    if (!existing) throw new Error('ThirdParty not found');
    const updated: ThirdParty = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.storage.update(COLLECTION, updated);
    this.load();
    return updated;
  }

  delete(id: string): void {
    this.storage.delete(COLLECTION, id);
    this.load();
  }

  recordPayment(thirdPartyId: string, amount: number, month: string, note?: string): void {
    const tp = this.storage.getById<ThirdParty>(COLLECTION, thirdPartyId);
    if (!tp) return;
    const payment: ThirdPartyPayment = {
      id: this.storage.generateId(),
      thirdPartyId,
      amount,
      date: new Date().toISOString(),
      month,
      note,
    };
    const updated: ThirdParty = {
      ...tp,
      payments: [...tp.payments, payment],
      updatedAt: new Date().toISOString(),
    };
    this.storage.update(COLLECTION, updated);
    this.load();
  }

  removePayment(thirdPartyId: string, paymentId: string): void {
    const tp = this.storage.getById<ThirdParty>(COLLECTION, thirdPartyId);
    if (!tp) return;
    const updated: ThirdParty = {
      ...tp,
      payments: tp.payments.filter(p => p.id !== paymentId),
      updatedAt: new Date().toISOString(),
    };
    this.storage.update(COLLECTION, updated);
    this.load();
  }

  getSummaries(): ThirdPartySummary[] {
    const installments = this.installmentService.installments();
    return this._thirdParties().map(tp => {
      const inst = installments.find(i => i.id === tp.installmentId);
      const paidAmount = tp.payments.reduce((s, p) => s + p.amount, 0);
      const remaining = tp.totalExpected - paidAmount;
      return {
        ...tp,
        paidAmount,
        remainingAmount: Math.max(0, remaining),
        installmentMerchant: inst?.merchant ?? 'Compra eliminada',
        nextPaymentDue: this.getNextDue(tp),
        isComplete: remaining <= 0,
      } as ThirdPartySummary;
    });
  }

  private getNextDue(tp: ThirdParty): string {
    const now = new Date();
    const next = new Date(now.getFullYear(), now.getMonth(), 1);
    return next.toISOString();
  }
}
