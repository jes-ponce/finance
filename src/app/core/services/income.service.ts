import { Injectable, signal } from '@angular/core';
import { StorageService } from './storage.service';
import { AuthService } from './auth.service';
import { Income } from '../models';

const COLLECTION = 'income';

@Injectable({ providedIn: 'root' })
export class IncomeService {
  private _income = signal<Income[]>([]);
  readonly income = this._income.asReadonly();

  constructor(private storage: StorageService, private auth: AuthService) {
    this.load();
  }

  private get userId(): string {
    return this.auth.userId() ?? '';
  }

  load(): void {
    if (!this.userId) { this._income.set([]); return; }
    const all = this.storage.getAll<Income>(COLLECTION, this.userId);
    this._income.set(all.sort((a, b) => b.date.localeCompare(a.date)));
  }

  create(data: Omit<Income, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Income {
    const now = new Date().toISOString();
    const income: Income = {
      ...data,
      id: this.storage.generateId(),
      userId: this.userId,
      createdAt: now,
      updatedAt: now,
    };
    this.storage.create(COLLECTION, income);
    this.load();
    return income;
  }

  update(id: string, data: Partial<Income>): Income {
    const existing = this.storage.getById<Income>(COLLECTION, id);
    if (!existing) throw new Error('Income not found');
    const updated: Income = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.storage.update(COLLECTION, updated);
    this.load();
    return updated;
  }

  delete(id: string): void {
    this.storage.delete(COLLECTION, id);
    this.load();
  }

  getByMonth(year: number, month: number): Income[] {
    return this._income().filter(i => {
      const d = new Date(i.date);
      return d.getFullYear() === year && d.getMonth() === month;
    });
  }

  getTotalByMonth(year: number, month: number): number {
    return this.getByMonth(year, month).reduce((sum, i) => sum + i.amount, 0);
  }
}
