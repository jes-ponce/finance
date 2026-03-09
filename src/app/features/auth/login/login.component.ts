import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-12"
         style="background: radial-gradient(ellipse at 60% 0%, rgba(99,102,241,0.15) 0%, transparent 60%), radial-gradient(ellipse at 10% 80%, rgba(99,102,241,0.08) 0%, transparent 50%), #020617;">

      <div class="w-full max-w-md">

        <!-- Logo -->
        <div class="flex items-center justify-center gap-3 mb-10">
          <div class="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <span class="text-white font-bold text-xl tracking-tight">F</span>
          </div>
          <span class="text-white text-2xl font-semibold tracking-tight">FinanceApp</span>
        </div>

        <!-- Card -->
        <div class="bg-slate-900 rounded-2xl shadow-2xl shadow-black/60 border border-slate-800/60 px-8 py-10">

          <div class="mb-8">
            <h1 class="text-2xl font-bold text-white mb-1">Bienvenido de vuelta</h1>
            <p class="text-slate-400 text-sm">Ingresa tus credenciales para continuar</p>
          </div>

          <!-- Error alert -->
          @if (error()) {
            <div class="mb-6 flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
              <svg class="w-5 h-5 text-red-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <p class="text-red-400 text-sm">{{ error() }}</p>
            </div>
          }

          <form (ngSubmit)="onSubmit()" #loginForm="ngForm" class="space-y-5">

            <!-- Email -->
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">Correo electrónico</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <svg class="w-4.5 h-4.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                  </svg>
                </div>
                <input
                  type="email"
                  name="email"
                  [(ngModel)]="emailValue"
                  required
                  placeholder="tu@correo.com"
                  autocomplete="email"
                  class="w-full bg-slate-800/70 border border-slate-700/60 text-white placeholder-slate-500 rounded-xl pl-10 pr-4 py-3 text-sm
                         focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-200"
                />
              </div>
            </div>

            <!-- Password -->
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">Contraseña</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <svg class="w-4.5 h-4.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                  </svg>
                </div>
                <input
                  [type]="showPassword() ? 'text' : 'password'"
                  name="password"
                  [(ngModel)]="passwordValue"
                  required
                  placeholder="••••••••"
                  autocomplete="current-password"
                  class="w-full bg-slate-800/70 border border-slate-700/60 text-white placeholder-slate-500 rounded-xl pl-10 pr-11 py-3 text-sm
                         focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-200"
                />
                <button
                  type="button"
                  (click)="showPassword.set(!showPassword())"
                  class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                >
                  @if (showPassword()) {
                    <svg class="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                    </svg>
                  } @else {
                    <svg class="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                    </svg>
                  }
                </button>
              </div>
            </div>

            <!-- Submit button -->
            <button
              type="submit"
              [disabled]="loading()"
              class="w-full relative py-3 px-4 rounded-xl font-semibold text-white text-sm
                     bg-gradient-to-r from-indigo-600 to-indigo-500
                     hover:from-indigo-500 hover:to-indigo-400
                     disabled:opacity-60 disabled:cursor-not-allowed
                     shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40
                     transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0
                     focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              @if (loading()) {
                <span class="flex items-center justify-center gap-2">
                  <svg class="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path class="opacity-75" fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Ingresando...
                </span>
              } @else {
                Iniciar sesión
              }
            </button>

          </form>

          <!-- Divider + Register link -->
          <div class="mt-6 pt-6 border-t border-slate-800 text-center">
            <p class="text-slate-400 text-sm">
              ¿No tienes cuenta?
              <a routerLink="/auth/register"
                 class="text-indigo-400 font-medium hover:text-indigo-300 transition-colors ml-1">
                Regístrate
              </a>
            </p>
          </div>

        </div>

        <!-- Demo notice -->
        <div class="mt-6 flex items-start gap-2.5 bg-indigo-500/8 border border-indigo-500/20 rounded-xl px-4 py-3">
          <svg class="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <p class="text-indigo-300/80 text-xs leading-relaxed">
            <span class="font-semibold text-indigo-300">Demo:</span>
            usa cualquier correo y contraseña para registrarte y explorar la app.
          </p>
        </div>

      </div>
    </div>
  `,
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  email = signal('');
  password = signal('');
  loading = signal(false);
  error = signal('');
  showPassword = signal(false);

  // Two-way binding helpers for ngModel
  get emailValue() { return this.email(); }
  set emailValue(v: string) { this.email.set(v); }

  get passwordValue() { return this.password(); }
  set passwordValue(v: string) { this.password.set(v); }

  onSubmit(): void {
    this.error.set('');
    if (!this.email() || !this.password()) {
      this.error.set('Por favor completa todos los campos.');
      return;
    }
    this.loading.set(true);
    // Simulate async for UX feedback
    setTimeout(() => {
      const result = this.auth.login(this.email(), this.password());
      this.loading.set(false);
      if (!result.success) {
        this.error.set(result.error ?? 'Error al iniciar sesión.');
      } else {
        this.router.navigate(['/dashboard']);
      }
    }, 600);
  }
}
