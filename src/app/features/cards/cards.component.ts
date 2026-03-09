import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardService } from '../../core/services/card.service';
import { InstallmentService } from '../../core/services/installment.service';
import { Card, CardType } from '../../core/models';

const CARD_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#10b981', '#3b82f6', '#14b8a6',
  '#1e293b', '#374151',
];

interface CardForm {
  name: string;
  bank: string;
  type: CardType;
  creditLimit: number | null;
  cutoffDay: number | null;
  paymentDays: number | null;
  color: string;
  lastFour: string;
}

function emptyForm(): CardForm {
  return {
    name: '',
    bank: '',
    type: 'credit',
    creditLimit: null,
    cutoffDay: null,
    paymentDays: null,
    color: CARD_COLORS[0],
    lastFour: '',
  };
}

@Component({
  selector: 'app-cards',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-slate-950 text-white p-4 md:p-6 lg:p-8">

      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-white">Tarjetas</h1>
          <p class="text-slate-400 text-sm mt-1">Administra tus tarjetas de crédito y débito</p>
        </div>
        <button
          (click)="openAddModal()"
          class="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-lg shadow-indigo-500/20">
          <span class="text-lg leading-none">+</span>
          <span>Nueva tarjeta</span>
        </button>
      </div>

      <!-- Empty State -->
      @if (cards().length === 0) {
        <div class="flex flex-col items-center justify-center py-24 text-center">
          <div class="w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center text-4xl mb-4 border border-slate-700">💳</div>
          <h2 class="text-xl font-semibold text-white mb-2">Sin tarjetas registradas</h2>
          <p class="text-slate-400 text-sm mb-6 max-w-xs">Agrega tus tarjetas para llevar un control de tus gastos e MSI</p>
          <button
            (click)="openAddModal()"
            class="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors">
            Agregar primera tarjeta
          </button>
        </div>
      }

      <!-- Cards Grid -->
      @if (cards().length > 0) {
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          @for (card of cards(); track card.id) {
            <div class="bg-slate-800 rounded-2xl border border-slate-700/50 overflow-hidden hover:border-slate-600/50 transition-colors group">

              <!-- Visual Credit Card Widget -->
              <div class="relative p-6 h-44 overflow-hidden"
                   [style.background]="cardGradient(card.color)">
                <!-- Background pattern -->
                <div class="absolute inset-0 opacity-10">
                  <div class="absolute top-4 right-4 w-32 h-32 rounded-full border-2 border-white"></div>
                  <div class="absolute top-8 right-8 w-32 h-32 rounded-full border-2 border-white"></div>
                </div>

                <!-- Card type badge -->
                <div class="absolute top-4 right-4">
                  <span class="text-xs font-bold tracking-widest text-white/80 uppercase bg-black/20 px-2 py-1 rounded-full">
                    {{ card.type === 'credit' ? 'Crédito' : 'Débito' }}
                  </span>
                </div>

                <!-- Chip icon -->
                <div class="w-8 h-6 bg-yellow-400/80 rounded-md mb-6 grid grid-cols-2 grid-rows-3 gap-px p-0.5">
                  @for (cell of chipCells; track $index) {
                    <div class="bg-yellow-300/60 rounded-sm"></div>
                  }
                </div>

                <!-- Card number -->
                <p class="text-white/90 font-mono text-sm tracking-widest mb-3">
                  •••• •••• •••• {{ card.lastFour ?? '••••' }}
                </p>

                <!-- Card name & bank -->
                <div class="flex items-end justify-between">
                  <div>
                    <p class="text-white font-semibold text-base leading-tight">{{ card.name }}</p>
                    <p class="text-white/60 text-xs">{{ card.bank }}</p>
                  </div>
                  @if (card.type === 'credit' && card.creditLimit) {
                    <div class="text-right">
                      <p class="text-white/60 text-xs">Límite</p>
                      <p class="text-white font-bold text-sm">{{ formatCurrency(card.creditLimit) }}</p>
                    </div>
                  }
                </div>
              </div>

              <!-- Card Details -->
              <div class="p-5">
                <!-- Stats row -->
                @if (card.type === 'credit') {
                  <div class="grid grid-cols-3 gap-3 mb-4">
                    <div class="text-center">
                      <p class="text-slate-400 text-xs mb-1">Corte</p>
                      <p class="text-white font-semibold text-sm">Día {{ card.cutoffDay ?? '—' }}</p>
                    </div>
                    <div class="text-center border-x border-slate-700">
                      <p class="text-slate-400 text-xs mb-1">Pago</p>
                      <p class="text-white font-semibold text-sm">+{{ card.paymentDays ?? '—' }} días</p>
                    </div>
                    <div class="text-center">
                      <p class="text-slate-400 text-xs mb-1">MSI activos</p>
                      <p class="text-white font-semibold text-sm">{{ getInstallmentCount(card.id) }}</p>
                    </div>
                  </div>
                  <!-- Available credit bar -->
                  <div class="mb-4">
                    <div class="flex justify-between items-center mb-1.5">
                      <p class="text-slate-400 text-xs">Crédito disponible</p>
                      <p class="text-white text-xs font-semibold">{{ formatCurrency(getAvailableCredit(card)) }}</p>
                    </div>
                    <div class="w-full bg-slate-700 rounded-full h-1.5">
                      <div class="h-1.5 rounded-full transition-all duration-500"
                           [style.width.%]="getAvailablePercent(card)"
                           [style.background-color]="card.color"></div>
                    </div>
                  </div>
                }

                @if (card.type === 'debit') {
                  <div class="flex items-center gap-2 mb-4 p-3 bg-slate-700/40 rounded-lg">
                    <span class="text-emerald-400 text-base">✅</span>
                    <p class="text-slate-300 text-sm">Tarjeta de débito</p>
                  </div>
                }

                <!-- Action buttons -->
                <div class="flex gap-2">
                  <button
                    (click)="openEditModal(card)"
                    class="flex-1 flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium py-2 rounded-lg transition-colors">
                    ✏️ Editar
                  </button>
                  <button
                    (click)="confirmDelete(card)"
                    class="flex items-center justify-center w-10 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors">
                    🗑️
                  </button>
                </div>
              </div>

            </div>
          }
        </div>
      }

      <!-- Add / Edit Modal -->
      @if (showModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
             (click)="closeModal()">
          <div class="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto"
               (click)="$event.stopPropagation()">

            <!-- Modal Header -->
            <div class="flex items-center justify-between p-6 border-b border-slate-700">
              <h2 class="text-xl font-bold text-white">
                {{ editingCard() ? 'Editar tarjeta' : 'Nueva tarjeta' }}
              </h2>
              <button (click)="closeModal()"
                      class="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors text-xl">
                ×
              </button>
            </div>

            <!-- Modal Form -->
            <form (ngSubmit)="saveCard()" #cardForm="ngForm" class="p-6 space-y-5">

              <!-- Name -->
              <div>
                <label class="block text-slate-300 text-sm font-medium mb-2">Nombre de la tarjeta *</label>
                <input
                  type="text"
                  [(ngModel)]="form.name"
                  name="name"
                  required
                  placeholder="Ej. AMEX Gold"
                  class="w-full bg-slate-700 border border-slate-600 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors" />
              </div>

              <!-- Bank -->
              <div>
                <label class="block text-slate-300 text-sm font-medium mb-2">Banco *</label>
                <input
                  type="text"
                  [(ngModel)]="form.bank"
                  name="bank"
                  required
                  placeholder="Ej. BBVA, Banamex, HSBC"
                  class="w-full bg-slate-700 border border-slate-600 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors" />
              </div>

              <!-- Type -->
              <div>
                <label class="block text-slate-300 text-sm font-medium mb-2">Tipo *</label>
                <select
                  [(ngModel)]="form.type"
                  name="type"
                  class="w-full bg-slate-700 border border-slate-600 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors">
                  <option value="credit">Crédito</option>
                  <option value="debit">Débito</option>
                </select>
              </div>

              <!-- Credit-only fields -->
              @if (form.type === 'credit') {
                <!-- Credit Limit -->
                <div>
                  <label class="block text-slate-300 text-sm font-medium mb-2">Límite de crédito (MXN)</label>
                  <input
                    type="number"
                    [(ngModel)]="form.creditLimit"
                    name="creditLimit"
                    min="0"
                    step="100"
                    placeholder="Ej. 30000"
                    class="w-full bg-slate-700 border border-slate-600 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors" />
                </div>

                <!-- Cutoff Day + Payment Days (side by side) -->
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-slate-300 text-sm font-medium mb-2">Día de corte</label>
                    <input
                      type="number"
                      [(ngModel)]="form.cutoffDay"
                      name="cutoffDay"
                      min="1"
                      max="31"
                      placeholder="1–31"
                      class="w-full bg-slate-700 border border-slate-600 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors" />
                  </div>
                  <div>
                    <label class="block text-slate-300 text-sm font-medium mb-2">Días para pago</label>
                    <input
                      type="number"
                      [(ngModel)]="form.paymentDays"
                      name="paymentDays"
                      min="1"
                      max="60"
                      placeholder="Ej. 20"
                      class="w-full bg-slate-700 border border-slate-600 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors" />
                  </div>
                </div>
              }

              <!-- Last Four -->
              <div>
                <label class="block text-slate-300 text-sm font-medium mb-2">Últimos 4 dígitos</label>
                <input
                  type="text"
                  [(ngModel)]="form.lastFour"
                  name="lastFour"
                  maxlength="4"
                  placeholder="1234"
                  class="w-full bg-slate-700 border border-slate-600 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors" />
              </div>

              <!-- Color Picker -->
              <div>
                <label class="block text-slate-300 text-sm font-medium mb-3">Color de la tarjeta</label>
                <div class="flex flex-wrap gap-2">
                  @for (color of cardColors; track color) {
                    <button
                      type="button"
                      (click)="form.color = color"
                      class="w-8 h-8 rounded-full border-2 transition-all hover:scale-110"
                      [style.background-color]="color"
                      [class.border-white]="form.color === color"
                      [class.border-transparent]="form.color !== color"
                      [class.scale-110]="form.color === color"
                      [class.ring-2]="form.color === color"
                      [class.ring-white/30]="form.color === color">
                    </button>
                  }
                </div>
                <!-- Preview mini card -->
                <div class="mt-3 h-12 rounded-xl flex items-center px-4 transition-all duration-300"
                     [style.background]="cardGradient(form.color)">
                  <span class="text-white/80 text-sm font-mono tracking-widest">•••• •••• •••• {{ form.lastFour || '••••' }}</span>
                </div>
              </div>

              <!-- Form Actions -->
              <div class="flex gap-3 pt-2">
                <button
                  type="button"
                  (click)="closeModal()"
                  class="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold py-3 rounded-xl transition-colors">
                  Cancelar
                </button>
                <button
                  type="submit"
                  [disabled]="!cardForm.valid || !form.name || !form.bank"
                  class="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors shadow-lg shadow-indigo-500/20">
                  {{ editingCard() ? 'Guardar cambios' : 'Crear tarjeta' }}
                </button>
              </div>

            </form>
          </div>
        </div>
      }

      <!-- Delete Confirmation Modal -->
      @if (deleteTarget()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
             (click)="cancelDelete()">
          <div class="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-sm shadow-2xl p-6"
               (click)="$event.stopPropagation()">

            <div class="flex flex-col items-center text-center">
              <div class="w-14 h-14 bg-red-500/20 rounded-2xl flex items-center justify-center text-3xl mb-4">🗑️</div>
              <h2 class="text-xl font-bold text-white mb-2">¿Eliminar tarjeta?</h2>
              <p class="text-slate-400 text-sm mb-1">
                Estás a punto de eliminar
              </p>
              <p class="text-white font-semibold mb-1">{{ deleteTarget()!.name }}</p>
              <p class="text-slate-500 text-xs mb-6">{{ deleteTarget()!.bank }}</p>
              <p class="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2 mb-6">
                Esta acción no se puede deshacer. Los MSI asociados también se eliminarán.
              </p>
            </div>

            <div class="flex gap-3">
              <button
                (click)="cancelDelete()"
                class="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold py-3 rounded-xl transition-colors">
                Cancelar
              </button>
              <button
                (click)="executeDelete()"
                class="flex-1 bg-red-600 hover:bg-red-500 text-white font-semibold py-3 rounded-xl transition-colors">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      }

    </div>
  `,
})
export class CardsComponent {
  static pageTitle = 'Tarjetas';

  private cardService = inject(CardService);
  private installmentService = inject(InstallmentService);

  readonly cards = this.cardService.cards;
  readonly cardColors = CARD_COLORS;
  readonly chipCells = Array(6).fill(0);

  readonly showModal = signal(false);
  readonly editingCard = signal<Card | null>(null);
  readonly deleteTarget = signal<Card | null>(null);

  form: CardForm = emptyForm();

  openAddModal(): void {
    this.form = emptyForm();
    this.editingCard.set(null);
    this.showModal.set(true);
  }

  openEditModal(card: Card): void {
    this.form = {
      name: card.name,
      bank: card.bank,
      type: card.type,
      creditLimit: card.creditLimit ?? null,
      cutoffDay: card.cutoffDay ?? null,
      paymentDays: card.paymentDays ?? null,
      color: card.color,
      lastFour: card.lastFour ?? '',
    };
    this.editingCard.set(card);
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingCard.set(null);
  }

  saveCard(): void {
    const data = {
      name: this.form.name.trim(),
      bank: this.form.bank.trim(),
      type: this.form.type,
      color: this.form.color,
      lastFour: this.form.lastFour.trim() || undefined,
      ...(this.form.type === 'credit' ? {
        creditLimit: this.form.creditLimit ?? undefined,
        cutoffDay: this.form.cutoffDay ?? undefined,
        paymentDays: this.form.paymentDays ?? undefined,
      } : {
        creditLimit: undefined,
        cutoffDay: undefined,
        paymentDays: undefined,
      }),
    };

    const editing = this.editingCard();
    if (editing) {
      this.cardService.update(editing.id, data);
    } else {
      this.cardService.create(data);
    }

    this.closeModal();
  }

  confirmDelete(card: Card): void {
    this.deleteTarget.set(card);
  }

  cancelDelete(): void {
    this.deleteTarget.set(null);
  }

  executeDelete(): void {
    const target = this.deleteTarget();
    if (target) {
      this.cardService.delete(target.id);
      this.deleteTarget.set(null);
    }
  }

  cardGradient(color: string): string {
    // Derive a slightly darker shade for the gradient end
    return `linear-gradient(135deg, ${color}ee 0%, ${color}99 100%)`;
  }

  formatCurrency(n: number): string {
    return `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  getInstallmentCount(cardId: string): number {
    return this.installmentService.installments()
      .filter(i => i.cardId === cardId && i.active).length;
  }

  getAvailableCredit(card: Card): number {
    if (!card.creditLimit) return 0;
    const now = new Date();
    const monthlyDue = this.installmentService.getMonthlyDueForCard(
      card.id, now.getFullYear(), now.getMonth()
    );
    return Math.max(0, card.creditLimit - monthlyDue);
  }

  getAvailablePercent(card: Card): number {
    if (!card.creditLimit || card.creditLimit === 0) return 100;
    return Math.round((this.getAvailableCredit(card) / card.creditLimit) * 100);
  }
}
