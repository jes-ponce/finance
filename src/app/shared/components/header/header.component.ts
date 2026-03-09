import { Component, input, output, inject } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-header',
  template: `
    <header class="sticky top-0 z-30 flex items-center justify-between h-16 px-4 bg-slate-900/95 backdrop-blur border-b border-slate-800">
      <div class="flex items-center gap-3">
        <button
          (click)="menuClick.emit()"
          class="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>
        <h1 class="text-white font-semibold text-base">{{ title() }}</h1>
      </div>

      <div class="flex items-center gap-3">
        <!-- Current date -->
        <span class="hidden sm:block text-slate-400 text-sm">{{ today }}</span>

        <!-- Avatar -->
        <div class="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm font-semibold">
          {{ initial }}
        </div>
      </div>
    </header>
  `,
})
export class HeaderComponent {
  readonly auth = inject(AuthService);
  title = input<string>('Dashboard');
  menuClick = output<void>();

  get initial(): string {
    return (this.auth.currentUser()?.name ?? 'U').charAt(0).toUpperCase();
  }

  get today(): string {
    return new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }
}
