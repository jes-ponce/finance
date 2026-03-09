import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IncomeService } from '../../core/services/income.service';
import { ExpenseService } from '../../core/services/expense.service';
import { InstallmentService } from '../../core/services/installment.service';
import { FinanceCalculatorService } from '../../core/services/finance-calculator.service';
import { EXPENSE_CATEGORIES } from '../../core/models';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const MONTH_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function formatCurrency(n: number): string {
  return `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

type ReportTab = 'monthly' | 'category' | 'comparison' | 'debts';

interface Tab {
  id: ReportTab;
  label: string;
}

const TABS: Tab[] = [
  { id: 'monthly',    label: 'Resumen Mensual' },
  { id: 'category',  label: 'Gastos por Categoría' },
  { id: 'comparison',label: 'Ingresos vs Gastos' },
  { id: 'debts',     label: 'Deudas' },
];

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-slate-950 text-white p-4 md:p-6 space-y-6">

      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-white">Reportes</h1>
          <p class="text-slate-400 text-sm mt-1">Análisis financiero detallado</p>
        </div>
      </div>

      <!-- Tab Selector -->
      <div class="bg-slate-800 rounded-xl p-1 flex gap-1 overflow-x-auto scrollbar-none">
        @for (tab of tabs; track tab.id) {
          <button
            (click)="selectedReport.set(tab.id)"
            [class]="selectedReport() === tab.id
              ? 'flex-shrink-0 px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 text-white transition-all'
              : 'flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white transition-all'"
          >{{ tab.label }}</button>
        }
      </div>

      <!-- Year / Month Filters -->
      <div class="flex gap-3 flex-wrap">
        <div class="flex flex-col gap-1">
          <label class="text-xs text-slate-400 uppercase tracking-wider">Año</label>
          <select
            [value]="selectedYear()"
            (change)="selectedYear.set(+$any($event.target).value)"
            class="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            @for (y of availableYears; track y) {
              <option [value]="y">{{ y }}</option>
            }
          </select>
        </div>

        @if (selectedReport() !== 'comparison' && selectedReport() !== 'debts') {
          <div class="flex flex-col gap-1">
            <label class="text-xs text-slate-400 uppercase tracking-wider">Mes</label>
            <select
              [value]="selectedMonth()"
              (change)="selectedMonth.set(+$any($event.target).value)"
              class="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              @if (selectedReport() === 'monthly') {
                <option [value]="-1">Todos los meses</option>
              }
              @for (m of monthOptions; track m.value) {
                <option [value]="m.value">{{ m.label }}</option>
              }
            </select>
          </div>
        }
      </div>

      <!-- ===== RESUMEN MENSUAL ===== -->
      @if (selectedReport() === 'monthly') {
        <div class="bg-slate-800 rounded-xl overflow-hidden border border-slate-700">
          <div class="p-4 border-b border-slate-700">
            <h2 class="text-base font-semibold text-white">Resumen Mensual {{ selectedYear() }}</h2>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-slate-700">
                  <th class="text-left p-3 text-slate-400 font-medium">Mes</th>
                  <th class="text-right p-3 text-slate-400 font-medium">Ingresos</th>
                  <th class="text-right p-3 text-slate-400 font-medium">Gastos</th>
                  <th class="text-right p-3 text-slate-400 font-medium">MSI</th>
                  <th class="text-right p-3 text-slate-400 font-medium">Balance</th>
                  <th class="text-right p-3 text-slate-400 font-medium">Ahorro %</th>
                </tr>
              </thead>
              <tbody>
                @for (row of monthlyReport(); track row.month) {
                  <tr
                    [class]="row.isCurrent
                      ? 'border-b border-slate-700 bg-indigo-950/40'
                      : 'border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors'"
                  >
                    <td class="p-3">
                      <div class="flex items-center gap-2">
                        <span class="font-medium text-white">{{ row.monthName }}</span>
                        @if (row.isCurrent) {
                          <span class="text-xs bg-indigo-600 text-white px-1.5 py-0.5 rounded font-medium">Actual</span>
                        }
                      </div>
                    </td>
                    <td class="p-3 text-right text-emerald-400 font-medium">{{ formatCurrency(row.income) }}</td>
                    <td class="p-3 text-right text-rose-400 font-medium">{{ formatCurrency(row.expenses) }}</td>
                    <td class="p-3 text-right text-amber-400 font-medium">{{ formatCurrency(row.installments) }}</td>
                    <td class="p-3 text-right font-semibold" [class]="row.balance >= 0 ? 'text-emerald-400' : 'text-rose-400'">
                      {{ formatCurrency(row.balance) }}
                    </td>
                    <td class="p-3 text-right">
                      <span
                        class="text-xs font-semibold px-2 py-1 rounded-full"
                        [class]="row.savingsRate >= 20
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : row.savingsRate >= 0
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-rose-500/20 text-rose-400'"
                      >{{ row.savingsRate }}%</span>
                    </td>
                  </tr>
                }
              </tbody>
              <tfoot>
                <tr class="bg-slate-700/40 border-t-2 border-slate-600">
                  <td class="p-3 font-bold text-white">Total Anual</td>
                  <td class="p-3 text-right font-bold text-emerald-400">{{ formatCurrency(monthlyTotals().income) }}</td>
                  <td class="p-3 text-right font-bold text-rose-400">{{ formatCurrency(monthlyTotals().expenses) }}</td>
                  <td class="p-3 text-right font-bold text-amber-400">{{ formatCurrency(monthlyTotals().installments) }}</td>
                  <td class="p-3 text-right font-bold" [class]="monthlyTotals().balance >= 0 ? 'text-emerald-400' : 'text-rose-400'">
                    {{ formatCurrency(monthlyTotals().balance) }}
                  </td>
                  <td class="p-3 text-right">
                    <span
                      class="text-xs font-bold px-2 py-1 rounded-full"
                      [class]="monthlyTotals().savingsRate >= 20
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : monthlyTotals().savingsRate >= 0
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-rose-500/20 text-rose-400'"
                    >{{ monthlyTotals().savingsRate }}%</span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      }

      <!-- ===== GASTOS POR CATEGORÍA ===== -->
      @if (selectedReport() === 'category') {
        <div class="space-y-4">
          <!-- Summary card -->
          <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div class="bg-slate-800 rounded-xl p-4 border border-slate-700">
              <p class="text-xs text-slate-400 uppercase tracking-wider mb-1">Total Gastos</p>
              <p class="text-xl font-bold text-rose-400">{{ formatCurrency(categoryTotal()) }}</p>
            </div>
            <div class="bg-slate-800 rounded-xl p-4 border border-slate-700">
              <p class="text-xs text-slate-400 uppercase tracking-wider mb-1">Categorías</p>
              <p class="text-xl font-bold text-white">{{ categoryReport().length }}</p>
            </div>
            <div class="bg-slate-800 rounded-xl p-4 border border-slate-700 col-span-2 md:col-span-1">
              <p class="text-xs text-slate-400 uppercase tracking-wider mb-1">Mayor Gasto</p>
              @if (categoryReport().length > 0) {
                <p class="text-xl font-bold text-white">{{ categoryReport()[0].label }}</p>
              } @else {
                <p class="text-xl font-bold text-slate-500">—</p>
              }
            </div>
          </div>

          <!-- Category bars -->
          <div class="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <div class="p-4 border-b border-slate-700">
              <h2 class="text-base font-semibold text-white">
                Desglose por Categoría — {{ monthNames[selectedMonth()] }} {{ selectedYear() }}
              </h2>
            </div>
            <div class="p-4 space-y-4">
              @if (categoryReport().length === 0) {
                <div class="text-center py-12">
                  <p class="text-4xl mb-3">📊</p>
                  <p class="text-slate-400">No hay gastos registrados en este período</p>
                </div>
              }
              @for (cat of categoryReport(); track cat.value) {
                <div class="space-y-1.5">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <span class="text-lg">{{ cat.icon }}</span>
                      <span class="text-sm font-medium text-white">{{ cat.label }}</span>
                    </div>
                    <div class="flex items-center gap-3">
                      <span class="text-sm font-semibold text-white">{{ formatCurrency(cat.amount) }}</span>
                      <span class="text-xs text-slate-400 w-10 text-right">{{ cat.percentage }}%</span>
                    </div>
                  </div>
                  <div class="h-2.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      class="h-full rounded-full transition-all duration-500"
                      [style.width.%]="cat.percentage"
                      [style.background-color]="cat.color"
                    ></div>
                  </div>
                </div>
              }
            </div>
            @if (categoryReport().length > 0) {
              <div class="px-4 pb-4 pt-2 border-t border-slate-700 flex justify-between items-center">
                <span class="text-sm font-semibold text-slate-300">Total</span>
                <span class="text-base font-bold text-rose-400">{{ formatCurrency(categoryTotal()) }}</span>
              </div>
            }
          </div>
        </div>
      }

      <!-- ===== INGRESOS VS GASTOS ===== -->
      @if (selectedReport() === 'comparison') {
        <div class="space-y-4">
          <!-- Legend -->
          <div class="flex items-center gap-6">
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded-sm bg-emerald-500"></div>
              <span class="text-sm text-slate-300">Ingresos</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded-sm bg-rose-500"></div>
              <span class="text-sm text-slate-300">Gastos</span>
            </div>
          </div>

          <!-- Bar chart -->
          <div class="bg-slate-800 rounded-xl border border-slate-700 p-4 md:p-6">
            <h2 class="text-base font-semibold text-white mb-6">Últimos 12 Meses</h2>
            <div class="flex items-end gap-1 md:gap-2 h-48 overflow-x-auto pb-1">
              @for (m of comparisonReport(); track m.key) {
                <div class="flex flex-col items-center gap-1 flex-shrink-0 min-w-[40px] md:min-w-0 md:flex-1">
                  <!-- Bars -->
                  <div class="flex items-end gap-0.5 h-40 w-full justify-center">
                    <!-- Income bar -->
                    <div
                      class="flex-1 max-w-[18px] md:max-w-[22px] rounded-t-sm bg-emerald-500 transition-all duration-700 hover:opacity-80"
                      [style.height.%]="m.incomeHeight"
                      [title]="'Ingresos: ' + formatCurrency(m.income)"
                    ></div>
                    <!-- Expense bar -->
                    <div
                      class="flex-1 max-w-[18px] md:max-w-[22px] rounded-t-sm bg-rose-500 transition-all duration-700 hover:opacity-80"
                      [style.height.%]="m.expenseHeight"
                      [title]="'Gastos: ' + formatCurrency(m.expenses)"
                    ></div>
                  </div>
                  <!-- Month label -->
                  <span class="text-[10px] text-slate-400 font-medium">{{ m.shortMonth }}</span>
                </div>
              }
            </div>

            <!-- Data table below chart -->
            <div class="mt-6 overflow-x-auto">
              <table class="w-full text-xs">
                <thead>
                  <tr class="border-b border-slate-700">
                    <th class="text-left py-2 text-slate-400">Mes</th>
                    <th class="text-right py-2 text-slate-400">Ingresos</th>
                    <th class="text-right py-2 text-slate-400">Gastos</th>
                    <th class="text-right py-2 text-slate-400">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  @for (m of comparisonReport(); track m.key) {
                    <tr class="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors">
                      <td class="py-2 text-slate-300">{{ m.label }}</td>
                      <td class="py-2 text-right text-emerald-400 font-medium">{{ formatCurrency(m.income) }}</td>
                      <td class="py-2 text-right text-rose-400 font-medium">{{ formatCurrency(m.expenses) }}</td>
                      <td class="py-2 text-right font-semibold" [class]="m.balance >= 0 ? 'text-emerald-400' : 'text-rose-400'">
                        {{ formatCurrency(m.balance) }}
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      }

      <!-- ===== DEUDAS ===== -->
      @if (selectedReport() === 'debts') {
        <div class="space-y-4">
          <!-- Debt summary cards -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div class="bg-slate-800 rounded-xl p-4 border border-slate-700">
              <p class="text-xs text-slate-400 uppercase tracking-wider mb-1">Deuda Total Activa</p>
              <p class="text-xl font-bold text-rose-400">{{ formatCurrency(debtSummary().totalDebt) }}</p>
            </div>
            <div class="bg-slate-800 rounded-xl p-4 border border-slate-700">
              <p class="text-xs text-slate-400 uppercase tracking-wider mb-1">Pago Mensual MSI</p>
              <p class="text-xl font-bold text-amber-400">{{ formatCurrency(debtSummary().monthlyBurden) }}</p>
            </div>
            <div class="bg-slate-800 rounded-xl p-4 border border-slate-700">
              <p class="text-xs text-slate-400 uppercase tracking-wider mb-1">MSI Activos</p>
              <p class="text-xl font-bold text-white">{{ debtSummary().activeCount }}</p>
            </div>
          </div>

          <!-- Estimated payoff -->
          @if (debtSummary().latestPayoff) {
            <div class="bg-indigo-950/50 border border-indigo-800/60 rounded-xl p-4 flex items-center gap-3">
              <span class="text-2xl">📅</span>
              <div>
                <p class="text-sm font-semibold text-indigo-300">Fin estimado de deudas</p>
                <p class="text-xs text-slate-400 mt-0.5">{{ debtSummary().latestPayoff }}</p>
              </div>
            </div>
          }

          <!-- Installment list -->
          <div class="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <div class="p-4 border-b border-slate-700">
              <h2 class="text-base font-semibold text-white">Compras en MSI Activas</h2>
            </div>

            @if (debtReport().length === 0) {
              <div class="text-center py-12">
                <p class="text-4xl mb-3">✅</p>
                <p class="text-slate-400">No tienes deudas activas</p>
              </div>
            }

            <div class="divide-y divide-slate-700/60">
              @for (inst of debtReport(); track inst.id) {
                <div class="p-4 hover:bg-slate-700/20 transition-colors">
                  <div class="flex items-start justify-between gap-3">
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 flex-wrap">
                        <span class="font-semibold text-white">{{ inst.merchant }}</span>
                        <span
                          class="text-xs px-2 py-0.5 rounded-full font-medium text-white"
                          [style.background-color]="inst.cardColor + '33'"
                          [style.color]="inst.cardColor"
                        >{{ inst.cardName }}</span>
                      </div>
                      @if (inst.description) {
                        <p class="text-xs text-slate-400 mt-0.5 truncate">{{ inst.description }}</p>
                      }

                      <!-- Progress -->
                      <div class="mt-3 space-y-1">
                        <div class="flex items-center justify-between text-xs text-slate-400">
                          <span>{{ inst.paidMonths }} de {{ inst.months }} meses pagados</span>
                          <span class="font-medium text-white">{{ inst.progressPct }}%</span>
                        </div>
                        <div class="h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            class="h-full rounded-full transition-all duration-500"
                            [style.width.%]="inst.progressPct"
                            [style.background-color]="inst.cardColor"
                          ></div>
                        </div>
                        <div class="flex items-center justify-between text-xs mt-1">
                          <span class="text-slate-400">Pagado: <span class="text-emerald-400 font-medium">{{ formatCurrency(inst.paidAmount) }}</span></span>
                          <span class="text-slate-400">Restante: <span class="text-rose-400 font-medium">{{ formatCurrency(inst.remainingAmount) }}</span></span>
                        </div>
                      </div>
                    </div>

                    <div class="text-right flex-shrink-0">
                      <p class="text-xs text-slate-400">Total</p>
                      <p class="text-base font-bold text-white">{{ formatCurrency(inst.totalAmount) }}</p>
                      <p class="text-xs text-amber-400 mt-1">{{ formatCurrency(inst.monthlyPayment) }}/mes</p>
                      @if (inst.estimatedEnd) {
                        <p class="text-xs text-slate-500 mt-1">hasta {{ inst.estimatedEnd }}</p>
                      }
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      }

    </div>
  `,
})
export class ReportsComponent {
  private incomeService = inject(IncomeService);
  private expenseService = inject(ExpenseService);
  private installmentService = inject(InstallmentService);
  private financeCalculator = inject(FinanceCalculatorService);

  readonly pageTitle = 'Reportes';
  readonly tabs = TABS;
  readonly monthNames = MONTH_NAMES;
  readonly formatCurrency = formatCurrency;

  // --- Filters ---
  readonly selectedReport = signal<ReportTab>('monthly');

  private readonly now = new Date();
  readonly selectedYear = signal<number>(this.now.getFullYear());
  readonly selectedMonth = signal<number>(this.now.getMonth());

  readonly availableYears: number[] = [
    this.now.getFullYear(),
    this.now.getFullYear() - 1,
    this.now.getFullYear() - 2,
  ];

  readonly monthOptions = MONTH_NAMES.map((label, value) => ({ value, label }));

  // ===== MONTHLY REPORT =====
  readonly monthlyReport = computed(() => {
    const year = this.selectedYear();
    const today = new Date();

    return Array.from({ length: 12 }, (_, month) => {
      const income = this.incomeService.getTotalByMonth(year, month);
      const expenses = this.expenseService.getTotalByMonth(year, month);
      const installments = this.installmentService.getTotalActiveMonthly();
      const balance = income - expenses - installments;
      const savingsRate = income > 0 ? Math.round((balance / income) * 100) : 0;
      const isCurrent = year === today.getFullYear() && month === today.getMonth();

      return {
        month,
        monthName: MONTH_NAMES[month],
        income,
        expenses,
        installments,
        balance,
        savingsRate,
        isCurrent,
      };
    });
  });

  readonly monthlyTotals = computed(() => {
    const rows = this.monthlyReport();
    const income = rows.reduce((s, r) => s + r.income, 0);
    const expenses = rows.reduce((s, r) => s + r.expenses, 0);
    const installments = rows.reduce((s, r) => s + r.installments, 0);
    const balance = income - expenses - installments;
    const savingsRate = income > 0 ? Math.round((balance / income) * 100) : 0;
    return { income, expenses, installments, balance, savingsRate };
  });

  // ===== CATEGORY REPORT =====
  readonly categoryReport = computed(() => {
    const year = this.selectedYear();
    const month = this.selectedMonth();
    const expenses = this.expenseService.getByMonth(year, month);
    const total = expenses.reduce((s, e) => s + e.amount, 0);

    return EXPENSE_CATEGORIES
      .map(cat => {
        const amount = expenses
          .filter(e => e.category === cat.value)
          .reduce((s, e) => s + e.amount, 0);
        const percentage = total > 0 ? Math.round((amount / total) * 100) : 0;
        return { ...cat, amount, percentage };
      })
      .filter(c => c.amount > 0)
      .sort((a, b) => b.amount - a.amount);
  });

  readonly categoryTotal = computed(() =>
    this.categoryReport().reduce((s, c) => s + c.amount, 0)
  );

  // ===== COMPARISON REPORT =====
  readonly comparisonReport = computed(() => {
    const today = new Date();
    const months: {
      key: string;
      label: string;
      shortMonth: string;
      income: number;
      expenses: number;
      balance: number;
      incomeHeight: number;
      expenseHeight: number;
    }[] = [];

    for (let i = 11; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = d.getMonth();
      const income = this.incomeService.getTotalByMonth(y, m);
      const expenses = this.expenseService.getTotalByMonth(y, m)
        + this.installmentService.getTotalActiveMonthly();
      months.push({
        key: `${y}-${m}`,
        label: `${MONTH_SHORT[m]} ${y}`,
        shortMonth: MONTH_SHORT[m],
        income,
        expenses,
        balance: income - expenses,
        incomeHeight: 0,
        expenseHeight: 0,
      });
    }

    const maxVal = Math.max(...months.map(m => Math.max(m.income, m.expenses)), 1);
    return months.map(m => ({
      ...m,
      incomeHeight: Math.round((m.income / maxVal) * 100),
      expenseHeight: Math.round((m.expenses / maxVal) * 100),
    }));
  });

  // ===== DEBT REPORT =====
  readonly debtReport = computed(() => {
    const today = new Date();
    return this.installmentService.getWithCards()
      .map(inst => {
        const progressPct = inst.months > 0
          ? Math.round((inst.paidMonths / inst.months) * 100)
          : 0;
        const paidAmount = inst.paidMonths * inst.monthlyPayment;

        // Estimate end date
        const remaining = inst.months - inst.paidMonths;
        let estimatedEnd: string | null = null;
        if (remaining > 0) {
          const endDate = new Date(today.getFullYear(), today.getMonth() + remaining, 1);
          estimatedEnd = `${MONTH_NAMES[endDate.getMonth()]} ${endDate.getFullYear()}`;
        }

        return {
          ...inst,
          progressPct,
          paidAmount,
          estimatedEnd,
        };
      })
      .sort((a, b) => b.remainingAmount - a.remainingAmount);
  });

  readonly debtSummary = computed(() => {
    const installments = this.installmentService.installments().filter(i => i.active);
    const totalDebt = installments.reduce(
      (s, i) => s + (i.months - i.paidMonths) * i.monthlyPayment, 0
    );
    const monthlyBurden = this.installmentService.getTotalActiveMonthly();
    const activeCount = installments.length;

    // Find latest payoff date
    const today = new Date();
    let latestPayoff: string | null = null;
    let maxMonths = 0;

    for (const inst of installments) {
      const remaining = inst.months - inst.paidMonths;
      if (remaining > maxMonths) {
        maxMonths = remaining;
        const endDate = new Date(today.getFullYear(), today.getMonth() + remaining, 1);
        latestPayoff = `${MONTH_NAMES[endDate.getMonth()]} ${endDate.getFullYear()}`;
      }
    }

    return { totalDebt, monthlyBurden, activeCount, latestPayoff };
  });
}
