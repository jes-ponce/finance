import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { StorageService } from './storage.service';
import { User, AuthSession } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  // inject() fields are initialized first, in declaration order
  private readonly storage = inject(StorageService);
  private readonly router = inject(Router);

  private readonly SESSION_KEY = 'session';
  private readonly USERS_KEY = 'users';

  // loadSession() is safe here because storage is already initialized above
  private _session = signal<AuthSession | null>(this.loadSession());

  readonly session = this._session.asReadonly();
  readonly isLoggedIn = computed(() => !!this._session());
  readonly currentUser = computed(() => this._session());
  readonly userId = computed(() => this._session()?.userId ?? null);

  private loadSession(): AuthSession | null {
    const session = this.storage.get<AuthSession>(this.SESSION_KEY);
    if (!session) return null;
    if (new Date(session.expiresAt) < new Date()) {
      this.storage.remove(this.SESSION_KEY);
      return null;
    }
    return session;
  }

  private hashPassword(password: string): string {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const chr = password.charCodeAt(i);
      hash = (hash << 5) - hash + chr;
      hash |= 0;
    }
    return `hash_${Math.abs(hash)}_${password.length}`;
  }

  register(name: string, email: string, password: string): { success: boolean; error?: string } {
    const users = this.storage.get<User[]>(this.USERS_KEY) ?? [];
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      return { success: false, error: 'Este correo ya está registrado.' };
    }
    const now = new Date().toISOString();
    const user: User = {
      id: this.storage.generateId(),
      email: email.toLowerCase(),
      name,
      passwordHash: this.hashPassword(password),
      plan: 'free',
      createdAt: now,
      updatedAt: now,
    };
    users.push(user);
    this.storage.set(this.USERS_KEY, users);
    this.createSession(user);
    return { success: true };
  }

  login(email: string, password: string): { success: boolean; error?: string } {
    const users = this.storage.get<User[]>(this.USERS_KEY) ?? [];
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return { success: false, error: 'Correo no encontrado.' };
    if (user.passwordHash !== this.hashPassword(password)) {
      return { success: false, error: 'Contraseña incorrecta.' };
    }
    this.createSession(user);
    return { success: true };
  }

  logout(): void {
    this.storage.remove(this.SESSION_KEY);
    this._session.set(null);
    this.router.navigate(['/auth/login']);
  }

  private createSession(user: User): void {
    const expires = new Date();
    expires.setDate(expires.getDate() + 30);
    const session: AuthSession = {
      userId: user.id,
      email: user.email,
      name: user.name,
      token: this.storage.generateId(),
      expiresAt: expires.toISOString(),
    };
    this.storage.set(this.SESSION_KEY, session);
    this._session.set(session);
  }

  updateProfile(name: string): void {
    const session = this._session();
    if (!session) return;
    const users = this.storage.get<User[]>(this.USERS_KEY) ?? [];
    const idx = users.findIndex(u => u.id === session.userId);
    if (idx !== -1) {
      users[idx] = { ...users[idx], name, updatedAt: new Date().toISOString() };
      this.storage.set(this.USERS_KEY, users);
    }
    const updated = { ...session, name };
    this.storage.set(this.SESSION_KEY, updated);
    this._session.set(updated);
  }
}
