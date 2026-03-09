import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ExpenseService } from '../../core/services/expense.service';
import { CardService } from '../../core/services/card.service';
import {
  Expense,
  ExpenseCategory,
  PaymentMethod,
  EXPENSE_CATEGORIES,
  PAYMENT_METHODS,
} from '../../core/models';

interface ExpenseForm {
  date: string;
  amount: number | null;
  category: ExpenseCategory;
  description: string;
  paymentMethod: PaymentMethod;
  cardId: string;
}

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="min-h-screen bg-slate-950 p-4 md:p-6 lg:p-8">

      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-white tracking-tight">Gastos</h1>
          <p class="text-slate-400 text-sm mt-0.5">Controla tus gastos y egresos</p>
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
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div class="bg-slate-900 rounded-2xl p-5 border border-slate-800/60">
          <p class="text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">Este mes</p>
          <p class="text-2xl font-bold text-rose-400">{{ formatCurrency(totalThisMonth()) }}</p>
          <p class="text-slate-500 text-xs mt-1">{{ countThisMonth() }} transacciones</p>
        </div>
        @for (pm of paymentMethodSummary(); track pm.method) {
          <div class="bg-slate-900 rounded-2xl p-5 border border-slate-800/60">
            <p class="text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">{{ pm.label }}</p>
            <p class="text-2xl font-bold text-white">{{ formatCurrency(pm.total) }}</p>
            <p class="text-slate-500 text-xs mt-1">{{ pm.count }} transacciones</p>
          </div>
        }
      </div>

      <!-- Filters -->
      <div class="bg-slate-900 rounded-2xl p-4 border border-slate-800/60 mb-4 flex flex-wrap gap-3 items-center">
        <div class="flex items-center gap-2">
          <label class="text-slate-400 text-sm">Mes:</label>
          <select
            [(ngModel)]="filterMonth"
            (ngModelChange)="applyFilters()"
            class="bg-slate-800 border border-slate-700/60 text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          >
            <option [value]="0">Todos</option>
            @for (m of months; track m.value) {
              <option [value]="m.value">{{ m.label }}</option>
            }
          </select>
        </div>
        <div class="flex items-center gap-2">
          <label class="text-slate-400 text-sm">Año:</label>
          <select
            [(ngModel)]="filterYear"
            (ngModelChange)="applyFilters()"
            class="bg-slate-800 border border-slate-700/60 text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          >
            @for (y of years; track y) {
              <option [value]="y">{{ y }}</option>
            }
          </select>
        </div>
        <div class="flex items-center gap-2">
          <label class="text-slate-400 text-sm">Categoría:</label>
          <select
            [(ngModel)]="filterCategory"
            (ngModelChange)="applyFilters()"
            class="bg-slate-800 border border-slate-700/60 text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          >
            <option value="">Todas</option>
            @for (cat of expenseCategories; track cat.value) {
              <option [value]="cat.value">{{ cat.icon }} {{ cat.label }}</option>
            }
          </select>
        </div>
        @if (filterCategory || filterMonth !== currentMonth || filterYear !== currentYear) {
          <button
            (click)="clearFilters()"
            class="text-indigo-400 hover:text-indigo-300 text-sm transition-colors flex items-center gap-1"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
            Limpiar
          </button>
        }
        <span class="ml-auto text-slate-500 text-sm">{{ filteredExpenses().length }} resultados</span>
      </div>

      <!-- Expense List -->
      @if (filteredExpenses().length === 0) {
        <div class="bg-slate-900 rounded-2xl border border-slate-800/60 p-16 flex flex-col items-center justify-center text-center">
          <div class="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mb-4">
            <span class="text-3xl">📦</span>
          </div>
          <p class="text-slate-300 font-semibold text-lg mb-1">Sin gastos registrados</p>
          <p class="text-slate-500 text-sm mb-6">Agrega tu primer gasto para comenzar a rastrear tus egresos</p>
          <button
            (click)="openAddModal()"
            class="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-2.5 rounded-xl transition-all duration-200 text-sm"
          >
            + Agregar gasto
          </button>
        </div>
      } @else {
        <div class="bg-slate-900 rounded-2xl border border-slate-800/60 overflow-hidden">
          <div class="hidden md:grid grid-cols-[1fr_2fr_1.5fr_1fr_1fr_auto] gap-4 px-6 py-3 border-b border-slate-800/60 text-xs text-slate-500 font-medium uppercase tracking-wider">
            <span>Fecha</span>
            <span>Descripción</span>
            <span>Categoría</span>
            <span>Método</span>
            <span class="text-right">Monto</span>
            <span></span>
          </div>
          <div class="divide-y divide-slate-800/40">
            @for (item of filteredExpenses(); track item.id) {
              <div class="px-4 md:px-6 py-4 hover:bg-slate-800/30 transition-colors">
                <!-- Mobile -->
                <div class="flex items-start justify-between md:hidden">
                  <div class="flex items-center gap-3">
                    <div
                      class="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                      [style.background]="getCategoryColor(item.category) + '22'"
                    >
                      {{ getCategoryIcon(item.category) }}
                    </div>
                    <div>
                      <p class="text-white text-sm font-medium">{{ item.description || getCategoryLabel(item.category) }}</p>
                      <div class="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span class="text-slate-500 text-xs">{{ formatDate(item.date) }}</span>
                        <span class="text-slate-600 text-xs">·</span>
                        <span class="text-slate-400 text-xs">{{ getPaymentMethodLabel(item.paymentMethod) }}</span>
                        @if (item.cardId) {
                          <span class="text-slate-600 text-xs">·</span>
                          <span class="text-slate-400 text-xs">{{ getCardName(item.cardId) }}</span>
                        }
                      </div>
                    </div>
                  </div>
                  <div class="flex items-center gap-2 ml-4">
                    <p class="text-rose-400 font-semibold text-sm">{{ formatCurrency(item.amount) }}</p>
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
                <!-- Desktop -->
                <div class="hidden md:grid grid-cols-[1fr_2fr_1.5fr_1fr_1fr_auto] gap-4 items-center">
                  <span class="text-slate-400 text-sm">{{ formatDate(item.date) }}</span>
                  <div>
                    <p class="text-white text-sm">{{ item.description || '—' }}</p>
                    @if (item.cardId) {
                      <p class="text-slate-500 text-xs mt-0.5">{{ getCardName(item.cardId) }}</p>
                    }
                  </div>
                  <div class="flex items-center gap-2">
                    <span
                      class="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
                      [style.background]="getCategoryColor(item.category) + '22'"
                    >{{ getCategoryIcon(item.category) }}</span>
                    <span class="text-slate-300 text-sm">{{ getCategoryLabel(item.category) }}</span>
                  </div>
                  <span class="text-slate-400 text-sm">{{ getPaymentMethodLabel(item.paymentMethod) }}</span>
                  <span class="text-rose-400 font-semibold text-sm text-right">{{ formatCurrency(item.amount) }}</span>
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
          <div class="bg-slate-800 rounded-2xl p-6 w-full max-w-lg mx-4 shadow-2xl max-h-[90vh] overflow-y-auto" (click)="$event.stopPropagation()">
            <div class="flex items-center justify-between mb-6">
              <h2 class="text-lg font-bold text-white">{{ editingId() ? 'Editar gasto' : 'Nuevo gasto' }}</h2>
              <button (click)="closeModal()" class="text-slate-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-700">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <form (ngSubmit)="onSubmit()" #expenseForm="ngForm" class="space-y-4">

              <!-- Date -->
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-1.5">Fecha</label>
                <input
                  type="date"
                  name="date"
                  [(ngModel)]="form.date"
                  required
                  class="w-full bg-slate-700/60 border border-slate-600/60 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
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
                    class="w-full bg-slate-700/60 border border-slate-600/60 text-white rounded-xl pl-8 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder-slate-500"
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
                  class="w-full bg-slate-700/60 border border-slate-600/60 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                >
                  @for (cat of expenseCategories; track cat.value) {
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
                  placeholder="Ej. Supermercado"
                  class="w-full bg-slate-700/60 border border-slate-600/60 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder-slate-500"
                />
              </div>

              <!-- Payment Method -->
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-1.5">Método de pago</label>
                <select
                  name="paymentMethod"
                  [(ngModel)]="form.paymentMethod"
                  required
                  (ngModelChange)="onPaymentMethodChange($event)"
                  class="w-full bg-slate-700/60 border border-slate-600/60 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                >
                  @for (pm of paymentMethods; track pm.value) {
                    <option [value]="pm.value">{{ pm.label }}</option>
                  }
                </select>
              </div>

              <!-- Card (only if credit/debit and cards exist) -->
              @if ((form.paymentMethod === 'credit' || form.paymentMethod === 'debit') && cardService.cards().length > 0) {
                <div>
                  <label class="block text-sm font-medium text-slate-300 mb-1.5">Tarjeta <span class="text-slate-500 font-normal">(opcional)</span></label>
                  <select
                    name="cardId"
                    [(ngModel)]="form.cardId"
                    class="w-full bg-slate-700/60 border border-slate-600/60 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                  >
                    <option value="">Sin tarjeta específica</option>
                    @for (card of cardService.cards(); track card.id) {
                      <option [value]="card.id">{{ card.name }} — {{ card.bank }}</option>
                    }
                  </select>
                </div>
              }

              @if (formError()) {
                <div class="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
                  {{ formError() }}
                </div>
              }

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
                  [disabled]="!expenseForm.valid"
                  class="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/25 transition-all"
                >
                  {{ editingId() ? 'Guardar cambios' : 'Agregar gasto' }}
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
              <h3 class="text-white font-semibold">Eliminar gasto</h3>
            </div>
            <p class="text-slate-400 text-sm mb-6">
              ¿Seguro que deseas eliminar este gasto de <span class="text-white font-medium">{{ formatCurrency(deleteTarget()!.amount) }}</span>? Esta acción es irreversible.
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
export class ExpensesComponent {
  readonly expenseService = inject(ExpenseService);
  readonly cardService = inject(CardService);

  readonly expenseCategories = EXPENSE_CATEGORIES;
  readonly paymentMethods = PAYMENT_METHODS;

  readonly currentMonth = new Date().getMonth() + 1;
  readonly currentYear = new Date().getFullYear();

  filterMonth = this.currentMonth;
  filterYear = this.currentYear;
  filterCategory = '';

  showModal = signal(false);
  editingId = signal<string | null>(null);
  deleteTarget = signal<Expense | null>(null);
  formError = signal('');

  form: ExpenseForm = this.defaultForm();

  filteredExpenses = computed(() => {
    let list = this.expenseService.expenses();
    if (this.filterMonth > 0) {
      list = list.filter(e => {
        const d = new Date(e.date);
        return d.getFullYear() === this.filterYear && d.getMonth() + 1 === this.filterMonth;
      });
    }
    if (this.filterCategory) {
      list = list.filter(e => e.category === this.filterCategory);
    }
    return list;
  });

  totalThisMonth = computed(() => {
    const now = new Date();
    return this.expenseService.expenses()
      .filter(e => {
        const d = new Date(e.date);
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      })
      .reduce((s, e) => s + e.amount, 0);
  });

  countThisMonth = computed(() => {
    const now = new Date();
    return this.expenseService.expenses().filter(e => {
      const d = new Date(e.date);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }).length;
  });

  paymentMethodSummary = computed(() => {
    const now = new Date();
    const thisMonth = this.expenseService.expenses().filter(e => {
      const d = new Date(e.date);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });
    return PAYMENT_METHODS.map(pm => ({
      method: pm.value,
      label: pm.label,
      total: thisMonth.filter(e => e.paymentMethod === pm.value).reduce((s, e) => s + e.amount, 0),
      count: thisMonth.filter(e => e.paymentMethod === pm.value).length,
    })).filter(pm => pm.count > 0);
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

  applyFilters(): void {
    // triggers filteredExpenses recomputation via signals
  }

  clearFilters(): void {
    this.filterMonth = this.currentMonth;
    this.filterYear = this.currentYear;
    this.filterCategory = '';
  }

  onPaymentMethodChange(method: PaymentMethod): void {
    if (method !== 'credit' && method !== 'debit') {
      this.form.cardId = '';
    }
  }

  openAddModal(): void {
    this.editingId.set(null);
    this.formError.set('');
    this.form = this.defaultForm();
    this.showModal.set(true);
  }

  openEditModal(item: Expense): void {
    this.editingId.set(item.id);
    this.formError.set('');
    this.form = {
      date: item.date.substring(0, 10),
      amount: item.amount,
      category: item.category,
      description: item.description,
      paymentMethod: item.paymentMethod,
      cardId: item.cardId ?? '',
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
    const payload: Omit<Expense, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
      date: this.form.date,
      amount: Number(this.form.amount),
      category: this.form.category,
      description: this.form.description,
      paymentMethod: this.form.paymentMethod,
      ...(this.form.cardId ? { cardId: this.form.cardId } : {}),
    };
    try {
      if (this.editingId()) {
        this.expenseService.update(this.editingId()!, payload);
      } else {
        this.expenseService.create(payload);
      }
      this.closeModal();
    } catch (e: any) {
      this.formError.set(e?.message ?? 'Error al guardar.');
    }
  }

  confirmDelete(item: Expense): void {
    this.deleteTarget.set(item);
  }

  doDelete(): void {
    if (this.deleteTarget()) {
      this.expenseService.delete(this.deleteTarget()!.id);
      this.deleteTarget.set(null);
    }
  }

  getCategoryIcon(cat: ExpenseCategory): string {
    return EXPENSE_CATEGORIES.find(c => c.value === cat)?.icon ?? '📦';
  }

  getCategoryLabel(cat: ExpenseCategory): string {
    return EXPENSE_CATEGORIES.find(c => c.value === cat)?.label ?? cat;
  }

  getCategoryColor(cat: ExpenseCategory): string {
    return EXPENSE_CATEGORIES.find(c => c.value === cat)?.color ?? '#6b7280';
  }

  getPaymentMethodLabel(pm: PaymentMethod): string {
    return PAYMENT_METHODS.find(p => p.value === pm)?.label ?? pm;
  }

  getCardName(cardId: string): string {
    const card = this.cardService.cards().find(c => c.id === cardId);
    return card ? `${card.name}` : 'Tarjeta eliminada';
  }

  formatCurrency(n: number): string {
    return `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  formatDate(str: string): string {
    return new Date(str).toLocaleDateString('es-MX');
  }

  private defaultForm(): ExpenseForm {
    return {
      date: new Date().toISOString().substring(0, 10),
      amount: null,
      category: 'food',
      description: '',
      paymentMethod: 'cash',
      cardId: '',
    };
  }
}
