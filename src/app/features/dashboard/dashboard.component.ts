import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { FinanceCalculatorService } from '../../core/services/finance-calculator.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-slate-950 text-white p-4 md:p-6 lg:p-8">

      <!-- Header / Greeting -->
      <div class="mb-8">
        <p class="text-slate-400 text-sm font-medium tracking-wide uppercase">{{ greeting }}</p>
        <h1 class="text-3xl font-bold text-white mt-1">{{ userName }} 👋</h1>
        <p class="text-slate-500 text-sm mt-1">{{ today }}</p>
      </div>

      <!-- TOP SECTION: 4 Stat Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">

        <!-- Ingresos -->
        <div class="bg-slate-800 rounded-2xl p-5 border border-slate-700/50 hover:border-emerald-500/30 transition-colors">
          <div class="flex items-center justify-between mb-4">
            <div class="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center text-xl">💰</div>
            <span class="text-xs text-emerald-400 font-medium bg-emerald-500/10 px-2 py-1 rounded-full">Mes actual</span>
          </div>
          <p class="text-2xl font-bold text-white">{{ formatCurrency(summary().currentMonthIncome) }}</p>
          <p class="text-slate-400 text-sm mt-1">Ingresos del mes</p>
        </div>

        <!-- Gastos -->
        <div class="bg-slate-800 rounded-2xl p-5 border border-slate-700/50 hover:border-red-500/30 transition-colors">
          <div class="flex items-center justify-between mb-4">
            <div class="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center text-xl">🧾</div>
            <span class="text-xs text-red-400 font-medium bg-red-500/10 px-2 py-1 rounded-full">Mes actual</span>
          </div>
          <p class="text-2xl font-bold text-white">{{ formatCurrency(summary().currentMonthExpenses) }}</p>
          <p class="text-slate-400 text-sm mt-1">Gastos del mes</p>
        </div>

        <!-- Balance -->
        <div class="bg-slate-800 rounded-2xl p-5 border border-slate-700/50 transition-colors"
             [class.hover:border-indigo-500/30]="summary().currentMonthBalance >= 0"
             [class.hover:border-red-500/30]="summary().currentMonthBalance < 0">
          <div class="flex items-center justify-between mb-4">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                 [class.bg-indigo-500/20]="summary().currentMonthBalance >= 0"
                 [class.bg-red-500/20]="summary().currentMonthBalance < 0">⚖️</div>
            <span class="text-xs font-medium px-2 py-1 rounded-full"
                  [class.text-indigo-400]="summary().currentMonthBalance >= 0"
                  [class.bg-indigo-500/10]="summary().currentMonthBalance >= 0"
                  [class.text-red-400]="summary().currentMonthBalance < 0"
                  [class.bg-red-500/10]="summary().currentMonthBalance < 0">
              {{ summary().currentMonthBalance >= 0 ? 'Positivo' : 'Negativo' }}
            </span>
          </div>
          <p class="text-2xl font-bold"
             [class.text-indigo-400]="summary().currentMonthBalance >= 0"
             [class.text-red-400]="summary().currentMonthBalance < 0">
            {{ formatCurrency(summary().currentMonthBalance) }}
          </p>
          <p class="text-slate-400 text-sm mt-1">Balance</p>
        </div>

        <!-- Deuda activa -->
        <div class="bg-slate-800 rounded-2xl p-5 border border-slate-700/50 hover:border-amber-500/30 transition-colors">
          <div class="flex items-center justify-between mb-4">
            <div class="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center text-xl">💳</div>
            <span class="text-xs text-amber-400 font-medium bg-amber-500/10 px-2 py-1 rounded-full">Total activo</span>
          </div>
          <p class="text-2xl font-bold text-amber-400">{{ formatCurrency(summary().totalActiveDebt) }}</p>
          <p class="text-slate-400 text-sm mt-1">Deuda activa</p>
        </div>

      </div>

      <!-- MIDDLE SECTION: Chart + Category Breakdown -->
      <div class="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">

        <!-- Bar Chart: Last 6 months -->
        <div class="lg:col-span-3 bg-slate-800 rounded-2xl p-6 border border-slate-700/50">
          <h2 class="text-lg font-semibold text-white mb-1">Últimos 6 meses</h2>
          <p class="text-slate-400 text-sm mb-6">Ingresos vs Gastos</p>

          <div class="flex items-end gap-2 h-48">
            @for (m of summary().last6Months; track m.month) {
              <div class="flex-1 flex flex-col items-center gap-1">
                <!-- Bars container -->
                <div class="flex items-end gap-0.5 w-full justify-center" style="height: 160px;">
                  <!-- Income bar -->
                  <div class="flex-1 bg-emerald-500/80 rounded-t-sm transition-all duration-500 hover:bg-emerald-400 cursor-default relative group"
                       [style.height.%]="getBarHeight(m.totalIncome, maxBarValue())"
                       [style.min-height.px]="m.totalIncome > 0 ? 4 : 0">
                    <div class="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-700 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                      {{ formatCurrency(m.totalIncome) }}
                    </div>
                  </div>
                  <!-- Expense bar -->
                  <div class="flex-1 bg-red-500/80 rounded-t-sm transition-all duration-500 hover:bg-red-400 cursor-default relative group"
                       [style.height.%]="getBarHeight(m.totalExpenses, maxBarValue())"
                       [style.min-height.px]="m.totalExpenses > 0 ? 4 : 0">
                    <div class="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-700 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                      {{ formatCurrency(m.totalExpenses) }}
                    </div>
                  </div>
                </div>
                <!-- Month label -->
                <p class="text-slate-400 text-xs font-medium">{{ formatMonthShort(m.year, m.month) }}</p>
              </div>
            }
          </div>

          <!-- Legend -->
          <div class="flex items-center gap-6 mt-4">
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded-sm bg-emerald-500/80"></div>
              <span class="text-slate-400 text-xs">Ingresos</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded-sm bg-red-500/80"></div>
              <span class="text-slate-400 text-xs">Gastos</span>
            </div>
          </div>
        </div>

        <!-- Category Breakdown -->
        <div class="lg:col-span-2 bg-slate-800 rounded-2xl p-6 border border-slate-700/50">
          <h2 class="text-lg font-semibold text-white mb-1">Por categoría</h2>
          <p class="text-slate-400 text-sm mb-6">Distribución de gastos</p>

          @if (summary().categoryBreakdown.length === 0) {
            <div class="flex flex-col items-center justify-center h-40 text-slate-500">
              <span class="text-3xl mb-2">📊</span>
              <p class="text-sm">Sin gastos registrados</p>
            </div>
          } @else {
            <div class="space-y-4">
              @for (cat of summary().categoryBreakdown; track cat.category) {
                <div>
                  <div class="flex items-center justify-between mb-1.5">
                    <div class="flex items-center gap-2">
                      <span class="text-base">{{ cat.icon }}</span>
                      <span class="text-slate-300 text-sm font-medium">{{ cat.label }}</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="text-slate-400 text-xs">{{ cat.percentage }}%</span>
                      <span class="text-white text-sm font-semibold">{{ formatCurrency(cat.amount) }}</span>
                    </div>
                  </div>
                  <div class="w-full bg-slate-700 rounded-full h-1.5">
                    <div class="h-1.5 rounded-full transition-all duration-500"
                         [style.width.%]="cat.percentage"
                         [style.background-color]="cat.color"></div>
                  </div>
                </div>
              }
            </div>
          }
        </div>

      </div>

      <!-- BOTTOM SECTION: Upcoming Payments + Financial Summary -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <!-- Upcoming Payments -->
        <div class="bg-slate-800 rounded-2xl p-6 border border-slate-700/50">
          <h2 class="text-lg font-semibold text-white mb-1">Próximos pagos</h2>
          <p class="text-slate-400 text-sm mb-6">Vencimientos en los próximos 30 días</p>

          @if (summary().upcomingPayments.length === 0) {
            <div class="flex flex-col items-center justify-center h-32 text-slate-500">
              <span class="text-3xl mb-2">✅</span>
              <p class="text-sm font-medium">Sin pagos próximos</p>
              <p class="text-xs mt-1">No hay vencimientos en los próximos 30 días</p>
            </div>
          } @else {
            <div class="space-y-3">
              @for (payment of summary().upcomingPayments; track payment.dueDate + payment.description) {
                <div class="flex items-center gap-4 p-3 bg-slate-700/50 rounded-xl hover:bg-slate-700 transition-colors">
                  <div class="w-2.5 h-2.5 rounded-full flex-shrink-0" [style.background-color]="payment.color"></div>
                  <div class="flex-1 min-w-0">
                    <p class="text-slate-200 text-sm font-medium truncate">{{ payment.description }}</p>
                    <p class="text-slate-500 text-xs mt-0.5">{{ formatDate(payment.dueDate) }}</p>
                  </div>
                  <p class="text-white font-semibold text-sm flex-shrink-0">{{ formatCurrency(payment.amount) }}</p>
                </div>
              }
            </div>
          }
        </div>

        <!-- Quick Financial Summary -->
        <div class="bg-slate-800 rounded-2xl p-6 border border-slate-700/50">
          <h2 class="text-lg font-semibold text-white mb-1">Resumen financiero</h2>
          <p class="text-slate-400 text-sm mb-6">Estado actual de tus finanzas</p>

          <div class="space-y-4">

            <!-- Monthly Installment Burden -->
            <div class="flex items-center justify-between p-4 bg-slate-700/40 rounded-xl border border-slate-700/60">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 bg-purple-500/20 rounded-lg flex items-center justify-center text-base">📅</div>
                <div>
                  <p class="text-slate-300 text-sm font-medium">Cargo en MSI mensual</p>
                  <p class="text-slate-500 text-xs">Compromisos recurrentes</p>
                </div>
              </div>
              <p class="text-purple-400 font-bold text-base">{{ formatCurrency(summary().monthlyInstallmentBurden) }}</p>
            </div>

            <!-- Third Party Pending -->
            <div class="flex items-center justify-between p-4 bg-slate-700/40 rounded-xl border border-slate-700/60">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 bg-orange-500/20 rounded-lg flex items-center justify-center text-base">🤝</div>
                <div>
                  <p class="text-slate-300 text-sm font-medium">Terceros pendiente</p>
                  <p class="text-slate-500 text-xs">Por cobrar / por pagar</p>
                </div>
              </div>
              <p class="text-orange-400 font-bold text-base">{{ formatCurrency(summary().thirdPartyPending) }}</p>
            </div>

            <!-- Available Cash - Highlighted -->
            <div class="flex items-center justify-between p-4 rounded-xl border"
                 [class.bg-emerald-500/10]="summary().availableCash > 0"
                 [class.border-emerald-500/30]="summary().availableCash > 0"
                 [class.bg-red-500/10]="summary().availableCash === 0"
                 [class.border-red-500/30]="summary().availableCash === 0">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-lg flex items-center justify-center text-base"
                     [class.bg-emerald-500/20]="summary().availableCash > 0"
                     [class.bg-red-500/20]="summary().availableCash === 0">💵</div>
                <div>
                  <p class="text-white text-sm font-semibold">Efectivo disponible</p>
                  <p class="text-xs"
                     [class.text-emerald-500]="summary().availableCash > 0"
                     [class.text-red-500]="summary().availableCash === 0">
                    {{ summary().availableCash > 0 ? 'Saldo libre este mes' : 'Sin saldo disponible' }}
                  </p>
                </div>
              </div>
              <p class="font-bold text-lg"
                 [class.text-emerald-400]="summary().availableCash > 0"
                 [class.text-red-400]="summary().availableCash === 0">
                {{ formatCurrency(summary().availableCash) }}
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  `,
})
export class DashboardComponent {
  static pageTitle = 'Dashboard';

  private auth = inject(AuthService);
  private calculator = inject(FinanceCalculatorService);

  readonly summary = computed(() => this.calculator.getDashboardSummary());

  readonly maxBarValue = computed(() => {
    const months = this.summary().last6Months;
    return Math.max(...months.map(m => Math.max(m.totalIncome, m.totalExpenses)), 1);
  });

  get userName(): string {
    return this.auth.currentUser()?.name ?? 'Usuario';
  }

  get greeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 19) return 'Buenas tardes';
    return 'Buenas noches';
  }

  get today(): string {
    return new Date().toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  formatCurrency(n: number): string {
    return `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  formatMonthShort(year: number, month: number): string {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
                    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return months[month];
  }

  getBarHeight(value: number, max: number): number {
    if (max === 0) return 0;
    return Math.max((value / max) * 100, value > 0 ? 2 : 0);
  }
}
