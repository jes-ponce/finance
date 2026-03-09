import { Component, signal, inject, output } from '@angular/core';
import { NgClass } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, NgClass],
  styles: [`
    /* On desktop the sidebar is always visible regardless of the open signal.
       Tailwind's lg: media-query rule overrides the base -translate-x-full class. */
    :host { display: contents; }
  `],
  template: `
    <!-- lg:translate-x-0 is ALWAYS applied as a static class — it wins on desktop
         via the media query cascade, overriding whatever ngClass sets for mobile. -->
    <aside
      class="fixed inset-y-0 left-0 z-50 flex flex-col w-64 bg-slate-900 border-r border-slate-800 transition-transform duration-300 lg:translate-x-0"
      [ngClass]="open() ? 'translate-x-0' : '-translate-x-full'"
    >
      <!-- Logo -->
      <div class="flex items-center gap-3 px-6 py-5 border-b border-slate-800">
        <div class="w-9 h-9 rounded-xl bg-indigo-500 flex items-center justify-center text-white font-bold text-lg">F</div>
        <div>
          <p class="text-white font-semibold text-sm">FinanceApp</p>
          <p class="text-slate-400 text-xs">{{ auth.currentUser()?.name }}</p>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 overflow-y-auto py-4 px-3">
        <p class="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Principal</p>
        @for (item of mainNav; track item.path) {
          <a
            [routerLink]="item.path"
            routerLinkActive="bg-indigo-500/10 text-indigo-400 border-indigo-500"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all duration-200 mb-1 border-l-2 border-transparent"
            (click)="closeSidebar()"
          >
            <span class="text-lg leading-none">{{ item.icon }}</span>
            <span class="text-sm font-medium">{{ item.label }}</span>
          </a>
        }

        <p class="px-3 py-2 mt-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Registros</p>
        @for (item of recordNav; track item.path) {
          <a
            [routerLink]="item.path"
            routerLinkActive="bg-indigo-500/10 text-indigo-400 border-indigo-500"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all duration-200 mb-1 border-l-2 border-transparent"
            (click)="closeSidebar()"
          >
            <span class="text-lg leading-none">{{ item.icon }}</span>
            <span class="text-sm font-medium">{{ item.label }}</span>
          </a>
        }
      </nav>

      <!-- User footer -->
      <div class="p-4 border-t border-slate-800">
        <button
          (click)="auth.logout()"
          class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-all duration-200"
        >
          <span class="text-lg">🚪</span>
          <span class="text-sm font-medium">Cerrar sesión</span>
        </button>
      </div>
    </aside>

    <!-- Mobile overlay — only shown when sidebar is open on small screens -->
    @if (open()) {
      <div
        class="fixed inset-0 z-40 bg-black/60 lg:hidden"
        (click)="closeSidebar()"
      ></div>
    }
  `,
})
export class SidebarComponent {
  readonly auth = inject(AuthService);
  readonly closed = output<void>();

  open = signal(false);

  readonly mainNav: NavItem[] = [
    { path: '/dashboard',    label: 'Dashboard',           icon: '📊' },
    { path: '/reports',      label: 'Reportes',            icon: '📈' },
  ];

  readonly recordNav: NavItem[] = [
    { path: '/cards',        label: 'Tarjetas',            icon: '💳' },
    { path: '/income',       label: 'Ingresos',            icon: '💰' },
    { path: '/expenses',     label: 'Gastos',              icon: '🧾' },
    { path: '/installments', label: 'Meses sin intereses', icon: '📅' },
    { path: '/third-party',  label: 'Pagos de terceros',   icon: '🤝' },
  ];

  toggle(): void { this.open.update(v => !v); }
  closeSidebar(): void { this.open.set(false); }
}
