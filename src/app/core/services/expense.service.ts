import { Injectable, signal } from '@angular/core';
import { StorageService } from './storage.service';
import { AuthService } from './auth.service';
import { Expense } from '../models';

const COLLECTION = 'expenses';

@Injectable({ providedIn: 'root' })
export class ExpenseService {
  private _expenses = signal<Expense[]>([]);
  readonly expenses = this._expenses.asReadonly();

  constructor(private storage: StorageService, private auth: AuthService) {
    this.load();
  }

  private get userId(): string {
    return this.auth.userId() ?? '';
  }

  load(): void {
    if (!this.userId) { this._expenses.set([]); return; }
    const all = this.storage.getAll<Expense>(COLLECTION, this.userId);
    this._expenses.set(all.sort((a, b) => b.date.localeCompare(a.date)));
  }

  create(data: Omit<Expense, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Expense {
    const now = new Date().toISOString();
    const expense: Expense = {
      ...data,
      id: this.storage.generateId(),
      userId: this.userId,
      createdAt: now,
      updatedAt: now,
    };
    this.storage.create(COLLECTION, expense);
    this.load();
    return expense;
  }

  update(id: string, data: Partial<Expense>): Expense {
    const existing = this.storage.getById<Expense>(COLLECTION, id);
    if (!existing) throw new Error('Expense not found');
    const updated: Expense = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.storage.update(COLLECTION, updated);
    this.load();
    return updated;
  }

  delete(id: string): void {
    this.storage.delete(COLLECTION, id);
    this.load();
  }

  getByMonth(year: number, month: number): Expense[] {
    return this._expenses().filter(e => {
      const d = new Date(e.date);
      return d.getFullYear() === year && d.getMonth() === month;
    });
  }

  getTotalByMonth(year: number, month: number): number {
    return this.getByMonth(year, month).reduce((sum, e) => sum + e.amount, 0);
  }

  getByCard(cardId: string): Expense[] {
    return this._expenses().filter(e => e.cardId === cardId);
  }

  getByCategory(category: string, year?: number, month?: number): Expense[] {
    let list = this._expenses().filter(e => e.category === category);
    if (year !== undefined && month !== undefined) {
      list = list.filter(e => {
        const d = new Date(e.date);
        return d.getFullYear() === year && d.getMonth() === month;
      });
    }
    return list;
  }
}
