import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class StorageService {
  private prefix = 'financeapp_';

  get<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(this.prefix + key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  set<T>(key: string, value: T): void {
    localStorage.setItem(this.prefix + key, JSON.stringify(value));
  }

  remove(key: string): void {
    localStorage.removeItem(this.prefix + key);
  }

  clear(): void {
    Object.keys(localStorage)
      .filter(k => k.startsWith(this.prefix))
      .forEach(k => localStorage.removeItem(k));
  }

  // Generic CRUD for entity collections
  getAll<T extends { id: string; userId: string }>(collection: string, userId: string): T[] {
    const all = this.get<T[]>(collection) ?? [];
    return all.filter(item => item.userId === userId);
  }

  getById<T extends { id: string }>(collection: string, id: string): T | null {
    const all = this.get<T[]>(collection) ?? [];
    return all.find(item => item.id === id) ?? null;
  }

  create<T extends { id: string }>(collection: string, item: T): T {
    const all = this.get<T[]>(collection) ?? [];
    all.push(item);
    this.set(collection, all);
    return item;
  }

  update<T extends { id: string }>(collection: string, updated: T): T {
    const all = this.get<T[]>(collection) ?? [];
    const idx = all.findIndex(item => item.id === updated.id);
    if (idx === -1) throw new Error(`Item ${updated.id} not found in ${collection}`);
    all[idx] = updated;
    this.set(collection, all);
    return updated;
  }

  delete(collection: string, id: string): void {
    const all = this.get<{ id: string }[]>(collection) ?? [];
    this.set(collection, all.filter(item => item.id !== id));
  }

  generateId(): string {
    return crypto.randomUUID();
  }
}
