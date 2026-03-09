import { Component, inject, signal, computed } from '@angular/core';
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InstallmentService } from '../../core/services/installment.service';
import { CardService } from '../../core/services/card.service';
import { InstallmentWithCard, InstallmentPurchase } from '../../core/models';

interface InstallmentForm {
  merchant: string;
  description: string;
  totalAmount: number | null;
  months: number;
  startDate: string;
  cardId: string;
  category: string;
  thirdPartyId: string;
}

const INSTALLMENT_MONTHS = [3, 6, 9, 12, 18, 24];

const INSTALLMENT_CATEGORIES = [
  { value: 'electronics', label: 'Electrónicos' },
  { value: 'appliances', label: 'Electrodomésticos' },
  { value: 'furniture', label: 'Muebles' },
  { value: 'travel', label: 'Viajes' },
  { value: 'health', label: 'Salud' },
  { value: 'education', label: 'Educación' },
  { value: 'clothing', label: 'Ropa' },
  { value: 'other', label: 'Otro' },
];

@Component({
  selector: 'app-installments',
  standalone: true,
  imports: [FormsModule, NgClass],
  template: `
    <div class="min-h-screen bg-slate-950 p-4 md:p-6 lg:p-8">

      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-white tracking-tight">Compras a Meses</h1>
          <p class="text-slate-400 text-sm mt-0.5">Administra tus compras a plazos</p>
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
          <p class="text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">Cuota mensual total</p>
          <p class="text-2xl font-bold text-indigo-400">{{ formatCurrency(totalMonthlyBurden()) }}</p>
          <p class="text-slate-500 text-xs mt-1">Compromisos activos</p>
        </div>
        <div class="bg-slate-900 rounded-2xl p-5 border border-slate-800/60">
          <p class="text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">Compras activas</p>
          <p class="text-2xl font-bold text-white">{{ installmentsWithCards().length }}</p>
          <p class="text-slate-500 text-xs mt-1">En progreso</p>
        </div>
        <div class="bg-slate-900 rounded-2xl p-5 border border-slate-800/60">
          <p class="text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">Deuda restante</p>
          <p class="text-2xl font-bold text-rose-400">{{ formatCurrency(totalRemainingDebt()) }}</p>
          <p class="text-slate-500 text-xs mt-1">Por pagar</p>
        </div>
      </div>

      <!-- Installments List -->
      @if (installmentsWithCards().length === 0) {
        <div class="bg-slate-900 rounded-2xl border border-slate-800/60 p-16 flex flex-col items-center justify-center text-center">
          <div class="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mb-4">
            <span class="text-3xl">💳</span>
          </div>
          <p class="text-slate-300 font-semibold text-lg mb-1">Sin compras a meses</p>
          <p class="text-slate-500 text-sm mb-6">Registra tus compras a plazos para llevar un control de tus mensualidades</p>
          <button
            (click)="openAddModal()"
            class="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-2.5 rounded-xl transition-all duration-200 text-sm"
          >
            + Agregar compra
          </button>
        </div>
      } @else {
        <div class="space-y-4">
          @for (inst of installmentsWithCards(); track inst.id) {
            <div class="bg-slate-900 rounded-2xl border border-slate-800/60 overflow-hidden">
              <!-- Card Header -->
              <div class="p-5">
                <div class="flex items-start justify-between gap-4">
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 flex-wrap mb-1">
                      <h3 class="text-white font-semibold text-base">{{ inst.merchant }}</h3>
                      <!-- Card chip -->
                      <span
                        class="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium text-white"
                        [style.background]="inst.cardColor + '33'"
                        [style.border]="'1px solid ' + inst.cardColor + '66'"
                        [style.color]="inst.cardColor"
                      >
                        {{ inst.cardName }}
                      </span>
                    </div>
                    @if (inst.description) {
                      <p class="text-slate-400 text-sm">{{ inst.description }}</p>
                    }
                    <div class="flex items-center gap-4 mt-2 flex-wrap">
                      <span class="text-slate-500 text-xs">{{ inst.paidMonths }}/{{ inst.months }} meses pagados</span>
                      <span class="text-slate-500 text-xs">·</span>
                      <span class="text-slate-400 text-sm font-medium">{{ formatCurrency(inst.monthlyPayment) }}/mes</span>
                      <span class="text-slate-500 text-xs">·</span>
                      <span class="text-slate-500 text-xs">{{ inst.remainingMonths }} meses restantes</span>
                    </div>
                  </div>
                  <div class="text-right shrink-0">
                    <p class="text-rose-400 font-bold text-lg">{{ formatCurrency(inst.remainingAmount) }}</p>
                    <p class="text-slate-500 text-xs mt-0.5">restante de {{ formatCurrency(inst.totalAmount) }}</p>
                  </div>
                </div>

                <!-- Progress bar -->
                <div class="mt-4">
                  <div class="flex justify-between items-center mb-1.5">
                    <span class="text-xs text-slate-500">Progreso</span>
                    <span class="text-xs text-slate-400 font-medium">{{ progressPercent(inst) }}%</span>
                  </div>
                  <div class="h-2 bg-slate-700/60 rounded-full overflow-hidden">
                    <div
                      class="h-full rounded-full transition-all duration-500"
                      [style.width]="progressPercent(inst) + '%'"
                      [style.background]="'linear-gradient(90deg, ' + inst.cardColor + ', ' + inst.cardColor + 'aa)'"
                    ></div>
                  </div>
                </div>

                <!-- Action buttons -->
                <div class="flex items-center gap-2 mt-4 flex-wrap">
                  <button
                    (click)="markPaid(inst)"
                    [disabled]="inst.paidMonths >= inst.months"
                    class="flex items-center gap-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-600/40 text-emerald-400 text-xs font-medium px-3 py-1.5 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                    </svg>
                    Marcar mes pagado
                  </button>
                  <button
                    (click)="toggleSchedule(inst.id)"
                    class="flex items-center gap-1.5 bg-slate-700/40 hover:bg-slate-700 border border-slate-600/40 text-slate-300 text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
                  >
                    <svg
                      class="w-3.5 h-3.5 transition-transform duration-200"
                      [class.rotate-180]="expandedSchedule() === inst.id"
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                    </svg>
                    {{ expandedSchedule() === inst.id ? 'Ocultar' : 'Ver' }} calendario
                  </button>
                  <button
                    (click)="confirmDelete(inst)"
                    class="ml-auto flex items-center gap-1.5 text-slate-500 hover:text-red-400 text-xs font-medium px-3 py-1.5 rounded-lg transition-all hover:bg-red-500/10"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                    Eliminar
                  </button>
                </div>
              </div>

              <!-- Payment Schedule Accordion -->
              @if (expandedSchedule() === inst.id) {
                <div class="border-t border-slate-800/60 px-5 pb-5 pt-4">
                  <h4 class="text-slate-400 text-xs font-medium uppercase tracking-wider mb-3">Calendario de pagos</h4>
                  <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                    @for (s of inst.schedule; track s.month) {
                      <div
                        class="rounded-xl p-3 text-center border transition-all"
                        [class.bg-emerald-500_15]="s.paid"
                        [class.border-emerald-500_40]="s.paid"
                        [class.bg-slate-800_50]="!s.paid"
                        [class.border-slate-700_40]="!s.paid"
                        [ngClass]="s.paid
                          ? 'bg-emerald-500/10 border-emerald-500/30'
                          : 'bg-slate-800/50 border-slate-700/40'"
                      >
                        <div class="flex items-center justify-center mb-1">
                          @if (s.paid) {
                            <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
                            </svg>
                          } @else {
                            <span class="text-slate-500 text-xs font-semibold">{{ s.month }}</span>
                          }
                        </div>
                        <p class="text-xs" [class.text-emerald-400]="s.paid" [class.text-slate-400]="!s.paid">
                          {{ formatDateShort(s.dueDate) }}
                        </p>
                        <p class="text-xs font-medium mt-0.5" [class.text-emerald-300]="s.paid" [class.text-slate-300]="!s.paid">
                          {{ formatCurrency(s.amount) }}
                        </p>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          }
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

      <!-- Add Modal -->
      @if (showModal()) {
        <div class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" (click)="closeModal()">
          <div class="bg-slate-800 rounded-2xl p-6 w-full max-w-lg mx-4 shadow-2xl max-h-[90vh] overflow-y-auto" (click)="$event.stopPropagation()">
            <div class="flex items-center justify-between mb-6">
              <h2 class="text-lg font-bold text-white">Nueva compra a meses</h2>
              <button (click)="closeModal()" class="text-slate-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-700">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <form (ngSubmit)="onSubmit()" #instForm="ngForm" class="space-y-4">

              <!-- Merchant -->
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-1.5">Comercio / Tienda</label>
                <input
                  type="text"
                  name="merchant"
                  [(ngModel)]="form.merchant"
                  required
                  placeholder="Ej. Liverpool, Best Buy..."
                  class="w-full bg-slate-700/60 border border-slate-600/60 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder-slate-500"
                />
              </div>

              <!-- Description -->
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-1.5">Descripción <span class="text-slate-500 font-normal">(opcional)</span></label>
                <input
                  type="text"
                  name="description"
                  [(ngModel)]="form.description"
                  placeholder="Ej. iPhone 15 Pro"
                  class="w-full bg-slate-700/60 border border-slate-600/60 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder-slate-500"
                />
              </div>

              <!-- Total Amount + Months (2 columns) -->
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm font-medium text-slate-300 mb-1.5">Monto total</label>
                  <div class="relative">
                    <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                    <input
                      type="number"
                      name="totalAmount"
                      [(ngModel)]="form.totalAmount"
                      required
                      min="1"
                      step="0.01"
                      placeholder="0.00"
                      class="w-full bg-slate-700/60 border border-slate-600/60 text-white rounded-xl pl-8 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder-slate-500"
                    />
                  </div>
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-300 mb-1.5">Meses</label>
                  <select
                    name="months"
                    [(ngModel)]="form.months"
                    required
                    class="w-full bg-slate-700/60 border border-slate-600/60 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                  >
                    @for (m of installmentMonths; track m) {
                      <option [value]="m">{{ m }} meses</option>
                    }
                  </select>
                </div>
              </div>

              <!-- Monthly payment preview -->
              @if (form.totalAmount && form.months) {
                <div class="bg-indigo-500/10 border border-indigo-500/30 rounded-xl px-4 py-3 flex items-center justify-between">
                  <span class="text-indigo-300 text-sm">Cuota mensual estimada</span>
                  <span class="text-indigo-400 font-bold text-base">{{ formatCurrency(monthlyPreview()) }}</span>
                </div>
              }

              <!-- Start Date -->
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-1.5">Fecha de primer pago</label>
                <input
                  type="date"
                  name="startDate"
                  [(ngModel)]="form.startDate"
                  required
                  class="w-full bg-slate-700/60 border border-slate-600/60 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                />
              </div>

              <!-- Card -->
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-1.5">Tarjeta de crédito</label>
                @if (cardService.cards().length === 0) {
                  <p class="text-slate-500 text-sm bg-slate-700/40 rounded-xl px-4 py-2.5 border border-slate-600/40">
                    No hay tarjetas registradas. Agrega una tarjeta primero.
                  </p>
                } @else {
                  <select
                    name="cardId"
                    [(ngModel)]="form.cardId"
                    required
                    class="w-full bg-slate-700/60 border border-slate-600/60 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                  >
                    <option value="">Seleccionar tarjeta</option>
                    @for (card of cardService.cards(); track card.id) {
                      <option [value]="card.id">{{ card.name }} — {{ card.bank }}</option>
                    }
                  </select>
                }
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
                  @for (cat of installmentCategories; track cat.value) {
                    <option [value]="cat.value">{{ cat.label }}</option>
                  }
                </select>
              </div>

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
                  [disabled]="!instForm.valid"
                  class="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/25 transition-all"
                >
                  Agregar compra
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
              <h3 class="text-white font-semibold">Eliminar compra</h3>
            </div>
            <p class="text-slate-400 text-sm mb-6">
              ¿Seguro que deseas eliminar la compra en <span class="text-white font-medium">{{ deleteTarget()!.merchant }}</span>? Esta acción es irreversible.
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
export class InstallmentsComponent {
  readonly installmentService = inject(InstallmentService);
  readonly cardService = inject(CardService);

  readonly installmentMonths = INSTALLMENT_MONTHS;
  readonly installmentCategories = INSTALLMENT_CATEGORIES;

  showModal = signal(false);
  deleteTarget = signal<InstallmentWithCard | null>(null);
  expandedSchedule = signal<string | null>(null);
  formError = signal('');

  form: InstallmentForm = this.defaultForm();

  installmentsWithCards = computed(() => this.installmentService.getWithCards());

  totalMonthlyBurden = computed(() =>
    this.installmentsWithCards().reduce((s, i) => s + i.monthlyPayment, 0)
  );

  totalRemainingDebt = computed(() =>
    this.installmentsWithCards().reduce((s, i) => s + i.remainingAmount, 0)
  );

  monthlyPreview(): number {
    if (!this.form.totalAmount || !this.form.months) return 0;
    return Number(this.form.totalAmount) / Number(this.form.months);
  }

  progressPercent(inst: InstallmentWithCard): number {
    return Math.round((inst.paidMonths / inst.months) * 100);
  }

  toggleSchedule(id: string): void {
    this.expandedSchedule.set(this.expandedSchedule() === id ? null : id);
  }

  markPaid(inst: InstallmentWithCard): void {
    if (inst.paidMonths < inst.months) {
      this.installmentService.markMonthPaid(inst.id);
    }
  }

  openAddModal(): void {
    this.formError.set('');
    this.form = this.defaultForm();
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.formError.set('');
  }

  onSubmit(): void {
    if (!this.form.totalAmount || this.form.totalAmount <= 0) {
      this.formError.set('Ingresa un monto total válido.');
      return;
    }
    if (!this.form.cardId) {
      this.formError.set('Selecciona una tarjeta de crédito.');
      return;
    }
    const payload = {
      merchant: this.form.merchant,
      description: this.form.description,
      totalAmount: Number(this.form.totalAmount),
      months: Number(this.form.months),
      startDate: this.form.startDate,
      cardId: this.form.cardId,
      category: this.form.category,
      ...(this.form.thirdPartyId ? { thirdPartyId: this.form.thirdPartyId } : {}),
    };
    try {
      this.installmentService.create(payload);
      this.closeModal();
    } catch (e: any) {
      this.formError.set(e?.message ?? 'Error al guardar.');
    }
  }

  confirmDelete(inst: InstallmentWithCard): void {
    this.deleteTarget.set(inst);
  }

  doDelete(): void {
    if (this.deleteTarget()) {
      this.installmentService.delete(this.deleteTarget()!.id);
      this.deleteTarget.set(null);
    }
  }

  formatCurrency(n: number): string {
    return `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  formatDate(str: string): string {
    return new Date(str).toLocaleDateString('es-MX');
  }

  formatDateShort(str: string): string {
    return new Date(str).toLocaleDateString('es-MX', { month: 'short', year: '2-digit' });
  }

  private defaultForm(): InstallmentForm {
    return {
      merchant: '',
      description: '',
      totalAmount: null,
      months: 12,
      startDate: new Date().toISOString().substring(0, 10),
      cardId: '',
      category: 'other',
      thirdPartyId: '',
    };
  }
}
