import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IncomeService } from '../../core/services/income.service';
import { Income, IncomeCategory, INCOME_CATEGORIES } from '../../core/models';

interface IncomeForm {
  date: string;
  amount: number | null;
  category: IncomeCategory;
  description: string;
}

@Component({
  selector: 'app-income',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="min-h-screen bg-slate-950 p-4 md:p-6 lg:p-8">

      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-white tracking-tight">Ingresos</h1>
          <p class="text-slate-400 text-sm mt-0.5">Administra tus fuentes de ingresos</p>
        </div>
        <button
          (click)="openAddModal()"
          class="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 text-sm"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Agregar
        </button>
      </div>

      <!-- Summary Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div class="bg-slate-900 rounded-2xl p-5 border border-slate-800/60">
          <p class="text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">Este mes</p>
          <p class="text-2xl font-bold text-emerald-400">{{ formatCurrency(totalThisMonth()) }}</p>
          <p class="text-slate-500 text-xs mt-1">{{ countThisMonth() }} registros</p>
        </div>
        <div class="bg-slate-900 rounded-2xl p-5 border border-slate-800/60">
          <p class="text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">Total histórico</p>
          <p class="text-2xl font-bold text-white">{{ formatCurrency(totalAllTime()) }}</p>
          <p class="text-slate-500 text-xs mt-1">{{ incomeService.income().length }} registros</p>
        </div>
        <div class="bg-slate-900 rounded-2xl p-5 border border-slate-800/60">
          <p class="text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">Promedio mensual</p>
          <p class="text-2xl font-bold text-indigo-400">{{ formatCurrency(monthlyAverage()) }}</p>
          <p class="text-slate-500 text-xs mt-1">Últimos 6 meses</p>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-slate-900 rounded-2xl p-4 border border-slate-800/60 mb-4 flex flex-wrap gap-3 items-center">
        <div class="flex items-center gap-2">
          <label class="text-slate-400 text-sm">Mes:</label>
          <select
            [(ngModel)]="filterMonth"
            (ngModelChange)="onFilterChange()"
            class="bg-slate-800 border border-slate-700/60 text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          >
            @for (m of months; track m.value) {
              <option [value]="m.value">{{ m.label }}</option>
            }
          </select>
        </div>
        <div class="flex items-center gap-2">
          <label class="text-slate-400 text-sm">Año:</label>
          <select
            [(ngModel)]="filterYear"
            (ngModelChange)="onFilterChange()"
            class="bg-slate-800 border border-slate-700/60 text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          >
            @for (y of years; track y) {
              <option [value]="y">{{ y }}</option>
            }
          </select>
        </div>
        @if (isFiltered()) {
          <button
            (click)="clearFilter()"
            class="text-indigo-400 hover:text-indigo-300 text-sm transition-colors flex items-center gap-1"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
            Limpiar filtros
          </button>
        }
        <span class="ml-auto text-slate-500 text-sm">{{ filteredIncome().length }} resultados</span>
      </div>

      <!-- Income List -->
      @if (filteredIncome().length === 0) {
        <div class="bg-slate-900 rounded-2xl border border-slate-800/60 p-16 flex flex-col items-center justify-center text-center">
          <div class="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mb-4">
            <span class="text-3xl">💰</span>
          </div>
          <p class="text-slate-300 font-semibold text-lg mb-1">Sin ingresos registrados</p>
          <p class="text-slate-500 text-sm mb-6">Agrega tu primer ingreso para comenzar a rastrear tus finanzas</p>
          <button
            (click)="openAddModal()"
            class="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-2.5 rounded-xl transition-all duration-200 text-sm"
          >
            + Agregar ingreso
          </button>
        </div>
      } @else {
        <div class="bg-slate-900 rounded-2xl border border-slate-800/60 overflow-hidden">
          <!-- Table header (desktop) -->
          <div class="hidden md:grid grid-cols-[1fr_2fr_1.5fr_auto_auto] gap-4 px-6 py-3 border-b border-slate-800/60 text-xs text-slate-500 font-medium uppercase tracking-wider">
            <span>Fecha</span>
            <span>Descripción</span>
            <span>Categoría</span>
            <span class="text-right">Monto</span>
            <span></span>
          </div>
          <!-- Rows -->
          <div class="divide-y divide-slate-800/40">
            @for (item of filteredIncome(); track item.id) {
              <div class="px-4 md:px-6 py-4 hover:bg-slate-800/30 transition-colors">
                <!-- Mobile layout -->
                <div class="flex items-start justify-between md:hidden">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-lg shrink-0">
                      {{ getCategoryIcon(item.category) }}
                    </div>
                    <div>
                      <p class="text-white text-sm font-medium">{{ item.description || getCategoryLabel(item.category) }}</p>
                      <p class="text-slate-500 text-xs mt-0.5">{{ getCategoryLabel(item.category) }} · {{ formatDate(item.date) }}</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-2 ml-4">
                    <p class="text-emerald-400 font-semibold text-sm">{{ formatCurrency(item.amount) }}</p>
                    <div class="flex gap-1">
                      <button (click)="openEditModal(item)" class="p-1.5 text-slate-500 hover:text-indigo-400 transition-colors rounded-lg hover:bg-slate-700/50">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                        </svg>
                      </button>
                      <button (click)="confirmDelete(item)" class="p-1.5 text-slate-500 hover:text-red-400 transition-colors rounded-lg hover:bg-slate-700/50">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
                <!-- Desktop layout -->
                <div class="hidden md:grid grid-cols-[1fr_2fr_1.5fr_auto_auto] gap-4 items-center">
                  <span class="text-slate-400 text-sm">{{ formatDate(item.date) }}</span>
                  <span class="text-white text-sm">{{ item.description || '—' }}</span>
                  <div class="flex items-center gap-2">
                    <span class="text-base">{{ getCategoryIcon(item.category) }}</span>
                    <span class="text-slate-300 text-sm">{{ getCategoryLabel(item.category) }}</span>
                  </div>
                  <span class="text-emerald-400 font-semibold text-sm text-right">{{ formatCurrency(item.amount) }}</span>
                  <div class="flex gap-1">
                    <button (click)="openEditModal(item)" class="p-1.5 text-slate-500 hover:text-indigo-400 transition-colors rounded-lg hover:bg-slate-700/50">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                      </svg>
                    </button>
                    <button (click)="confirmDelete(item)" class="p-1.5 text-slate-500 hover:text-red-400 transition-colors rounded-lg hover:bg-slate-700/50">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- FAB mobile -->
      <button
        (click)="openAddModal()"
        class="fixed bottom-6 right-6 md:hidden w-14 h-14 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-xl shadow-indigo-500/40 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 z-40"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
        </svg>
      </button>

      <!-- Add/Edit Modal -->
      @if (showModal()) {
        <div class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" (click)="closeModal()">
          <div class="bg-slate-800 rounded-2xl p-6 w-full max-w-lg mx-4 shadow-2xl" (click)="$event.stopPropagation()">
            <div class="flex items-center justify-between mb-6">
              <h2 class="text-lg font-bold text-white">{{ editingId() ? 'Editar ingreso' : 'Nuevo ingreso' }}</h2>
              <button (click)="closeModal()" class="text-slate-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-700">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <form (ngSubmit)="onSubmit()" #incomeForm="ngForm" class="space-y-4">

              <!-- Date -->
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-1.5">Fecha</label>
                <input
                  type="date"
                  name="date"
                  [(ngModel)]="form.date"
                  required
                  class="w-full bg-slate-700/60 border border-slate-600/60 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                />
              </div>

              <!-- Amount -->
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-1.5">Monto</label>
                <div class="relative">
                  <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                  <input
                    type="number"
                    name="amount"
                    [(ngModel)]="form.amount"
                    required
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    class="w-full bg-slate-700/60 border border-slate-600/60 text-white rounded-xl pl-8 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all placeholder-slate-500"
                  />
                </div>
              </div>

              <!-- Category -->
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-1.5">Categoría</label>
                <select
                  name="category"
                  [(ngModel)]="form.category"
                  required
                  class="w-full bg-slate-700/60 border border-slate-600/60 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                >
                  @for (cat of categories; track cat.value) {
                    <option [value]="cat.value">{{ cat.icon }} {{ cat.label }}</option>
                  }
                </select>
              </div>

              <!-- Description -->
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-1.5">Descripción <span class="text-slate-500 font-normal">(opcional)</span></label>
                <input
                  type="text"
                  name="description"
                  [(ngModel)]="form.description"
                  placeholder="Ej. Salario de enero"
                  class="w-full bg-slate-700/60 border border-slate-600/60 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all placeholder-slate-500"
                />
              </div>

              @if (formError()) {
                <div class="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
                  {{ formError() }}
                </div>
              }

              <!-- Actions -->
              <div class="flex gap-3 pt-2">
                <button
                  type="button"
                  (click)="closeModal()"
                  class="flex-1 py-2.5 px-4 rounded-xl text-sm font-medium text-slate-300 bg-slate-700/60 hover:bg-slate-700 border border-slate-600/60 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  [disabled]="!incomeForm.valid"
                  class="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/25 transition-all"
                >
                  {{ editingId() ? 'Guardar cambios' : 'Agregar ingreso' }}
                </button>
              </div>

            </form>
          </div>
        </div>
      }

      <!-- Delete Confirmation Modal -->
      @if (deleteTarget()) {
        <div class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" (click)="deleteTarget.set(null)">
          <div class="bg-slate-800 rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl" (click)="$event.stopPropagation()">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center">
                <svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
              </div>
              <h3 class="text-white font-semibold">Eliminar ingreso</h3>
            </div>
            <p class="text-slate-400 text-sm mb-6">
              ¿Estás seguro de que deseas eliminar este ingreso de <span class="text-white font-medium">{{ formatCurrency(deleteTarget()!.amount) }}</span>? Esta acción no se puede deshacer.
            </p>
            <div class="flex gap-3">
              <button
                (click)="deleteTarget.set(null)"
                class="flex-1 py-2.5 px-4 rounded-xl text-sm font-medium text-slate-300 bg-slate-700/60 hover:bg-slate-700 border border-slate-600/60 transition-all"
              >
                Cancelar
              </button>
              <button
                (click)="doDelete()"
                class="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-500 transition-all shadow-lg shadow-red-500/25"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      }

    </div>
  `,
})
export class IncomeComponent {
  readonly incomeService = inject(IncomeService);
  readonly categories = INCOME_CATEGORIES;

  // Filter state
  filterMonth = signal(new Date().getMonth() + 1);
  filterYear = signal(new Date().getFullYear());
  isFiltered = signal(false);

  // Modal state
  showModal = signal(false);
  editingId = signal<string | null>(null);
  deleteTarget = signal<Income | null>(null);
  formError = signal('');

  form: IncomeForm = {
    date: this.todayISO(),
    amount: null,
    category: 'salary',
    description: '',
  };

  // Derived data
  filteredIncome = computed(() => {
    const all = this.incomeService.income();
    if (!this.isFiltered()) return all;
    const m = this.filterMonth();
    const y = this.filterYear();
    return all.filter(i => {
      const d = new Date(i.date);
      return d.getFullYear() === y && d.getMonth() + 1 === m;
    });
  });

  totalThisMonth = computed(() => {
    const now = new Date();
    return this.incomeService.income()
      .filter(i => {
        const d = new Date(i.date);
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      })
      .reduce((s, i) => s + i.amount, 0);
  });

  countThisMonth = computed(() => {
    const now = new Date();
    return this.incomeService.income().filter(i => {
      const d = new Date(i.date);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }).length;
  });

  totalAllTime = computed(() =>
    this.incomeService.income().reduce((s, i) => s + i.amount, 0)
  );

  monthlyAverage = computed(() => {
    const now = new Date();
    let total = 0;
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      total += this.incomeService.income()
        .filter(inc => {
          const id = new Date(inc.date);
          return id.getFullYear() === d.getFullYear() && id.getMonth() === d.getMonth();
        })
        .reduce((s, inc) => s + inc.amount, 0);
    }
    return total / 6;
  });

  months = [
    { value: 1, label: 'Enero' }, { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' }, { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' }, { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' }, { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' }, { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' }, { value: 12, label: 'Diciembre' },
  ];

  years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  onFilterChange(): void {
    this.isFiltered.set(true);
  }

  clearFilter(): void {
    this.isFiltered.set(false);
    this.filterMonth.set(new Date().getMonth() + 1);
    this.filterYear.set(new Date().getFullYear());
  }

  openAddModal(): void {
    this.editingId.set(null);
    this.formError.set('');
    this.form = { date: this.todayISO(), amount: null, category: 'salary', description: '' };
    this.showModal.set(true);
  }

  openEditModal(item: Income): void {
    this.editingId.set(item.id);
    this.formError.set('');
    this.form = {
      date: item.date.substring(0, 10),
      amount: item.amount,
      category: item.category,
      description: item.description,
    };
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingId.set(null);
    this.formError.set('');
  }

  onSubmit(): void {
    if (!this.form.amount || this.form.amount <= 0) {
      this.formError.set('Ingresa un monto válido mayor a cero.');
      return;
    }
    const payload = {
      date: this.form.date,
      amount: Number(this.form.amount),
      category: this.form.category,
      description: this.form.description,
    };
    try {
      if (this.editingId()) {
        this.incomeService.update(this.editingId()!, payload);
      } else {
        this.incomeService.create(payload);
      }
      this.closeModal();
    } catch (e: any) {
      this.formError.set(e?.message ?? 'Error al guardar.');
    }
  }

  confirmDelete(item: Income): void {
    this.deleteTarget.set(item);
  }

  doDelete(): void {
    if (this.deleteTarget()) {
      this.incomeService.delete(this.deleteTarget()!.id);
      this.deleteTarget.set(null);
    }
  }

  getCategoryIcon(cat: IncomeCategory): string {
    return INCOME_CATEGORIES.find(c => c.value === cat)?.icon ?? '💰';
  }

  getCategoryLabel(cat: IncomeCategory): string {
    return INCOME_CATEGORIES.find(c => c.value === cat)?.label ?? cat;
  }

  formatCurrency(n: number): string {
    return `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  formatDate(str: string): string {
    return new Date(str).toLocaleDateString('es-MX');
  }

  private todayISO(): string {
    return new Date().toISOString().substring(0, 10);
  }
}
