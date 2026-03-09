import { Injectable, signal, computed } from '@angular/core';
import { StorageService } from './storage.service';
import { AuthService } from './auth.service';
import { Card, CardSummary } from '../models';

const COLLECTION = 'cards';

@Injectable({ providedIn: 'root' })
export class CardService {
  private _cards = signal<Card[]>([]);

  readonly cards = this._cards.asReadonly();

  readonly CARD_COLORS = [
    '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
    '#f97316', '#10b981', '#3b82f6', '#14b8a6',
    '#1e293b', '#374151',
  ];

  constructor(private storage: StorageService, private auth: AuthService) {
    this.load();
  }

  private get userId(): string {
    return this.auth.userId() ?? '';
  }

  load(): void {
    if (!this.userId) { this._cards.set([]); return; }
    this._cards.set(this.storage.getAll<Card>(COLLECTION, this.userId));
  }

  getById(id: string): Card | null {
    return this._cards().find(c => c.id === id) ?? null;
  }

  create(data: Omit<Card, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Card {
    const now = new Date().toISOString();
    const card: Card = {
      ...data,
      id: this.storage.generateId(),
      userId: this.userId,
      createdAt: now,
      updatedAt: now,
    };
    this.storage.create(COLLECTION, card);
    this.load();
    return card;
  }

  update(id: string, data: Partial<Card>): Card {
    const existing = this.storage.getById<Card>(COLLECTION, id);
    if (!existing) throw new Error('Card not found');
    const updated: Card = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.storage.update(COLLECTION, updated);
    this.load();
    return updated;
  }

  delete(id: string): void {
    this.storage.delete(COLLECTION, id);
    this.load();
  }

  getNextCutoffDate(card: Card): Date {
    if (!card.cutoffDay) return new Date();
    const now = new Date();
    const cutoff = new Date(now.getFullYear(), now.getMonth(), card.cutoffDay);
    if (cutoff <= now) cutoff.setMonth(cutoff.getMonth() + 1);
    return cutoff;
  }

  getNextPaymentDate(card: Card): Date {
    const cutoff = this.getNextCutoffDate(card);
    const payDays = card.paymentDays ?? 20;
    const payment = new Date(cutoff);
    payment.setDate(payment.getDate() + payDays);
    return payment;
  }

  buildSummary(card: Card, spentThisCycle: number, installmentDue: number): CardSummary {
    const creditLimit = card.creditLimit ?? 0;
    const totalDue = spentThisCycle + installmentDue;
    return {
      ...card,
      spentThisCycle,
      availableCredit: Math.max(0, creditLimit - totalDue),
      nextCutoffDate: this.getNextCutoffDate(card).toISOString(),
      nextPaymentDate: this.getNextPaymentDate(card).toISOString(),
      minimumPayment: totalDue * 0.1,
      totalDue,
      installmentDue,
    };
  }
}
