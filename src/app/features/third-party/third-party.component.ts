import { Component, inject, signal, computed } from '@angular/core';
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ThirdPartyService } from '../../core/services/third-party.service';
import { InstallmentService } from '../../core/services/installment.service';
import { ThirdPartySummary, ThirdPartyPayment } from '../../core/models';

interface ThirdPartyForm {
  name: string;
  description: string;
  installmentId: string;
  monthlyAmount: number | null;
  totalExpected: number | null;
}

interface PaymentForm {
  month: string;
  amount: number | null;
  note: string;
}

@Component({
  selector: 'app-third-party',
  standalone: true,
  imports: [FormsModule, NgClass],
  template: `
    <div class="min-h-screen bg-slate-950 p-4 md:p-6 lg:p-8">

      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-white tracking-tight">Pagos de Terceros</h1>
          <p class="text-slate-400 text-sm mt-0.5">Personas que te pagan a través de tus compras a meses</p>
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
          <p class="text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">Total recibido</p>
          <p class="text-2xl font-bold text-emerald-400">{{ formatCurrency(totalReceived()) }}</p>
          <p class="text-slate-500 text-xs mt-1">De todos los terceros</p>
        </div>
        <div class="bg-slate-900 rounded-2xl p-5 border border-slate-800/60">
          <p class="text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">Por cobrar</p>
          <p class="text-2xl font-bold text-rose-400">{{ formatCurrency(totalPending()) }}</p>
          <p class="text-slate-500 text-xs mt-1">Restante total</p>
        </div>
        <div class="bg-slate-900 rounded-2xl p-5 border border-slate-800/60">
          <p class="text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">Terceros activos</p>
          <p class="text-2xl font-bold text-white">{{ activeSummaries().length }}</p>
          <p class="text-slate-500 text-xs mt-1">{{ completedSummaries().length }} completados</p>
        </div>
      </div>

      <!-- Third Party List -->
      @if (summaries().length === 0) {
        <div class="bg-slate-900 rounded-2xl border border-slate-800/60 p-16 flex flex-col items-center justify-center text-center">
          <div class="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mb-4">
            <span class="text-3xl">🤝</span>
          </div>
          <p class="text-slate-300 font-semibold text-lg mb-1">Sin terceros registrados</p>
          <p class="text-slate-500 text-sm mb-6">Registra personas que te pagan a través de tus compras a meses</p>
          <button
            (click)="openAddModal()"
            class="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-2.5 rounded-xl transition-all duration-200 text-sm"
          >
            + Agregar tercero
          </button>
        </div>
      } @else {
        <div class="space-y-4">
          @for (tp of summaries(); track tp.id) {
            <div class="bg-slate-900 rounded-2xl border border-slate-800/60 overflow-hidden">
              <!-- Card Header -->
              <div class="p-5">
                <div class="flex items-start justify-between gap-4">
                  <div class="flex items-center gap-3 flex-1 min-w-0">
                    <div class="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-sm shrink-0">
                      {{ tp.name.charAt(0).toUpperCase() }}
                    </div>
                    <div class="min-w-0">
                      <div class="flex items-center gap-2 flex-wrap mb-0.5">
                        <h3 class="text-white font-semibold text-base">{{ tp.name }}</h3>
                        @if (tp.isComplete) {
                          <span class="inline-flex items-center gap-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-medium px-2 py-0.5 rounded-lg">
                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
                            </svg>
                            Completado
                          </span>
                        } @else {
                          <span class="inline-flex items-center bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 text-xs font-medium px-2 py-0.5 rounded-lg">
                            En curso
                          </span>
                        }
                      </div>
                      @if (tp.description) {
                        <p class="text-slate-400 text-sm">{{ tp.description }}</p>
                      }
                      <div class="flex items-center gap-2 mt-1 flex-wrap">
                        <span class="text-slate-500 text-xs">Compra:</span>
                        <span class="text-slate-300 text-sm font-medium">{{ tp.installmentMerchant }}</span>
                        <span class="text-slate-600 text-xs">·</span>
                        <span class="text-slate-400 text-sm">{{ formatCurrency(tp.monthlyAmount) }}/mes</span>
                      </div>
                    </div>
                  </div>
                  <div class="text-right shrink-0">
                    <p class="text-emerald-400 font-bold text-lg">{{ formatCurrency(tp.paidAmount) }}</p>
                    <p class="text-slate-500 text-xs mt-0.5">de {{ formatCurrency(tp.totalExpected) }}</p>
                    @if (!tp.isComplete) {
                      <p class="text-rose-400 text-xs mt-1">Faltan {{ formatCurrency(tp.remainingAmount) }}</p>
                    }
                  </div>
                </div>

                <!-- Progress bar -->
                <div class="mt-4">
                  <div class="flex justify-between items-center mb-1.5">
                    <span class="text-xs text-slate-500">Progreso de pago</span>
                    <span class="text-xs text-slate-400 font-medium">{{ progressPercent(tp) }}%</span>
                  </div>
                  <div class="h-2 bg-slate-700/60 rounded-full overflow-hidden">
                    <div
                      class="h-full rounded-full transition-all duration-500"
                      [style.width]="progressPercent(tp) + '%'"
                      [ngClass]="tp.isComplete
                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                        : 'bg-gradient-to-r from-indigo-600 to-indigo-400'"
                    ></div>
                  </div>
                </div>

                <!-- Actions -->
                <div class="flex items-center gap-2 mt-4 flex-wrap">
                  @if (!tp.isComplete) {
                    <button
                      (click)="openPaymentModal(tp)"
                      class="flex items-center gap-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-600/40 text-emerald-400 text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
                    >
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                      </svg>
                      Registrar pago
                    </button>
                  }
                  <button
                    (click)="openEditModal(tp)"
                    class="flex items-center gap-1.5 bg-slate-700/40 hover:bg-slate-700 border border-slate-600/40 text-slate-300 text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                    Editar
                  </button>
                  <button
                    (click)="toggleHistory(tp.id)"
                    class="flex items-center gap-1.5 bg-slate-700/40 hover:bg-slate-700 border border-slate-600/40 text-slate-300 text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
                  >
                    <svg
                      class="w-3.5 h-3.5 transition-transform duration-200"
                      [class.rotate-180]="expandedHistory() === tp.id"
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                    </svg>
                    Historial ({{ tp.payments.length }})
                  </button>
                  <button
                    (click)="confirmDelete(tp)"
                    class="ml-auto flex items-center gap-1.5 text-slate-500 hover:text-red-400 text-xs font-medium px-3 py-1.5 rounded-lg transition-all hover:bg-red-500/10"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                    Eliminar
                  </button>
                </div>
              </div>

              <!-- Payment History Accordion -->
              @if (expandedHistory() === tp.id) {
                <div class="border-t border-slate-800/60 px-5 pb-5 pt-4">
                  <h4 class="text-slate-400 text-xs font-medium uppercase tracking-wider mb-3">Historial de pagos</h4>
                  @if (tp.payments.length === 0) {
                    <p class="text-slate-500 text-sm text-center py-4">Sin pagos registrados aún</p>
                  } @else {
                    <div class="space-y-2">
                      @for (payment of sortedPayments(tp.payments); track payment.id) {
                        <div class="flex items-center justify-between bg-slate-800/50 rounded-xl px-4 py-3 border border-slate-700/40">
                          <div>
                            <div class="flex items-center gap-2 flex-wrap">
                              <span class="text-white text-sm font-medium">{{ formatCurrency(payment.amount) }}</span>
                              <span class="text-slate-500 text-xs bg-slate-700/60 px-2 py-0.5 rounded-md">{{ payment.month }}</span>
                            </div>
                            @if (payment.note) {
                              <p class="text-slate-500 text-xs mt-0.5">{{ payment.note }}</p>
                            }
                          </div>
                          <div class="flex items-center gap-2">
                            <span class="text-slate-500 text-xs">{{ formatDate(payment.date) }}</span>
                            <button
                              (click)="removePayment(tp.id, payment.id)"
                              class="p-1 text-slate-600 hover:text-red-400 transition-colors rounded"
                            >
                              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                              </svg>
                            </button>
                          </div>
                        </div>
                      }
                    </div>
                  }
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

      <!-- Add/Edit Third Party Modal -->
      @if (showAddModal()) {
        <div class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" (click)="closeAddModal()">
          <div class="bg-slate-800 rounded-2xl p-6 w-full max-w-lg mx-4 shadow-2xl max-h-[90vh] overflow-y-auto" (click)="$event.stopPropagation()">
            <div class="flex items-center justify-between mb-6">
              <h2 class="text-lg font-bold text-white">{{ editingId() ? 'Editar tercero' : 'Nuevo tercero' }}</h2>
              <button (click)="closeAddModal()" class="text-slate-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-700">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <form (ngSubmit)="onSubmitAdd()" #tpForm="ngForm" class="space-y-4">

              <!-- Name -->
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-1.5">Nombre</label>
                <input
                  type="text"
                  name="name"
                  [(ngModel)]="tpFormData.name"
                  required
                  placeholder="Ej. Juan García"
                  class="w-full bg-slate-700/60 border border-slate-600/60 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder-slate-500"
                />
              </div>

              <!-- Description -->
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-1.5">Descripción <span class="text-slate-500 font-normal">(opcional)</span></label>
                <input
                  type="text"
                  name="description"
                  [(ngModel)]="tpFormData.description"
                  placeholder="Ej. Comparte el costo del laptop"
                  class="w-full bg-slate-700/60 border border-slate-600/60 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder-slate-500"
                />
              </div>

              <!-- Installment -->
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-1.5">Compra a meses</label>
                @if (activeInstallments().length === 0) {
                  <p class="text-slate-500 text-sm bg-slate-700/40 rounded-xl px-4 py-2.5 border border-slate-600/40">
                    No hay compras a meses activas. Agrega una compra primero.
                  </p>
                } @else {
                  <select
                    name="installmentId"
                    [(ngModel)]="tpFormData.installmentId"
                    required
                    class="w-full bg-slate-700/60 border border-slate-600/60 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                  >
                    <option value="">Seleccionar compra</option>
                    @for (inst of activeInstallments(); track inst.id) {
                      <option [value]="inst.id">{{ inst.merchant }} — {{ formatCurrency(inst.monthlyPayment) }}/mes</option>
                    }
                  </select>
                }
              </div>

              <!-- Monthly Amount + Total Expected -->
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm font-medium text-slate-300 mb-1.5">Pago mensual</label>
                  <div class="relative">
                    <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                    <input
                      type="number"
                      name="monthlyAmount"
                      [(ngModel)]="tpFormData.monthlyAmount"
                      required
                      min="1"
                      step="0.01"
                      placeholder="0.00"
                      class="w-full bg-slate-700/60 border border-slate-600/60 text-white rounded-xl pl-8 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder-slate-500"
                    />
                  </div>
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-300 mb-1.5">Total esperado</label>
                  <div class="relative">
                    <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                    <input
                      type="number"
                      name="totalExpected"
                      [(ngModel)]="tpFormData.totalExpected"
                      required
                      min="1"
                      step="0.01"
                      placeholder="0.00"
                      class="w-full bg-slate-700/60 border border-slate-600/60 text-white rounded-xl pl-8 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder-slate-500"
                    />
                  </div>
                </div>
              </div>

              @if (addFormError()) {
                <div class="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
                  {{ addFormError() }}
                </div>
              }

              <div class="flex gap-3 pt-2">
                <button
                  type="button"
                  (click)="closeAddModal()"
                  class="flex-1 py-2.5 px-4 rounded-xl text-sm font-medium text-slate-300 bg-slate-700/60 hover:bg-slate-700 border border-slate-600/60 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  [disabled]="!tpForm.valid"
                  class="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/25 transition-all"
                >
                  {{ editingId() ? 'Guardar cambios' : 'Agregar tercero' }}
                </button>
              </div>

            </form>
          </div>
        </div>
      }

      <!-- Record Payment Modal -->
      @if (paymentTarget()) {
        <div class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" (click)="closePaymentModal()">
          <div class="bg-slate-800 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl" (click)="$event.stopPropagation()">
            <div class="flex items-center justify-between mb-6">
              <div>
                <h2 class="text-lg font-bold text-white">Registrar pago</h2>
                <p class="text-slate-400 text-sm mt-0.5">{{ paymentTarget()!.name }}</p>
              </div>
              <button (click)="closePaymentModal()" class="text-slate-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-700">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <form (ngSubmit)="onSubmitPayment()" #payForm="ngForm" class="space-y-4">

              <!-- Month -->
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-1.5">Mes del pago</label>
                <input
                  type="month"
                  name="month"
                  [(ngModel)]="paymentForm.month"
                  required
                  class="w-full bg-slate-700/60 border border-slate-600/60 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                />
              </div>

              <!-- Amount -->
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-1.5">Monto recibido</label>
                <div class="relative">
                  <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                  <input
                    type="number"
                    name="amount"
                    [(ngModel)]="paymentForm.amount"
                    required
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    class="w-full bg-slate-700/60 border border-slate-600/60 text-white rounded-xl pl-8 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder-slate-500"
                  />
                </div>
                <p class="text-slate-500 text-xs mt-1">Monto mensual acordado: {{ formatCurrency(paymentTarget()!.monthlyAmount) }}</p>
              </div>

              <!-- Note -->
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-1.5">Nota <span class="text-slate-500 font-normal">(opcional)</span></label>
                <input
                  type="text"
                  name="note"
                  [(ngModel)]="paymentForm.note"
                  placeholder="Ej. Transferencia SPEI"
                  class="w-full bg-slate-700/60 border border-slate-600/60 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder-slate-500"
                />
              </div>

              @if (paymentFormError()) {
                <div class="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
                  {{ paymentFormError() }}
                </div>
              }

              <div class="flex gap-3 pt-2">
                <button
                  type="button"
                  (click)="closePaymentModal()"
                  class="flex-1 py-2.5 px-4 rounded-xl text-sm font-medium text-slate-300 bg-slate-700/60 hover:bg-slate-700 border border-slate-600/60 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  [disabled]="!payForm.valid"
                  class="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/25 transition-all"
                >
                  Registrar pago
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
              <h3 class="text-white font-semibold">Eliminar tercero</h3>
            </div>
            <p class="text-slate-400 text-sm mb-6">
              ¿Seguro que deseas eliminar a <span class="text-white font-medium">{{ deleteTarget()!.name }}</span> y todo su historial de pagos?
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
export class ThirdPartyComponent {
  readonly pageTitle = 'Pagos de Terceros';
  readonly thirdPartyService = inject(ThirdPartyService);
  readonly installmentService = inject(InstallmentService);

  // Modal visibility
  showAddModal = signal(false);
  editingId = signal<string | null>(null);
  paymentTarget = signal<ThirdPartySummary | null>(null);
  deleteTarget = signal<ThirdPartySummary | null>(null);
  expandedHistory = signal<string | null>(null);

  // Form errors
  addFormError = signal('');
  paymentFormError = signal('');

  // Forms
  tpFormData: ThirdPartyForm = this.defaultTpForm();
  paymentForm: PaymentForm = this.defaultPaymentForm();

  // Derived data
  summaries = computed(() => this.thirdPartyService.getSummaries());
  activeSummaries = computed(() => this.summaries().filter(tp => !tp.isComplete));
  completedSummaries = computed(() => this.summaries().filter(tp => tp.isComplete));
  activeInstallments = computed(() => this.installmentService.installments().filter(i => i.active));

  totalReceived = computed(() => this.summaries().reduce((s, tp) => s + tp.paidAmount, 0));
  totalPending = computed(() => this.summaries().reduce((s, tp) => s + tp.remainingAmount, 0));

  progressPercent(tp: ThirdPartySummary): number {
    if (tp.totalExpected <= 0) return 0;
    return Math.min(100, Math.round((tp.paidAmount / tp.totalExpected) * 100));
  }

  toggleHistory(id: string): void {
    this.expandedHistory.set(this.expandedHistory() === id ? null : id);
  }

  sortedPayments(payments: ThirdPartyPayment[]): ThirdPartyPayment[] {
    return [...payments].sort((a, b) => b.date.localeCompare(a.date));
  }

  removePayment(tpId: string, paymentId: string): void {
    this.thirdPartyService.removePayment(tpId, paymentId);
  }

  openAddModal(): void {
    this.editingId.set(null);
    this.tpFormData = this.defaultTpForm();
    this.addFormError.set('');
    this.showAddModal.set(true);
  }

  openEditModal(tp: ThirdPartySummary): void {
    this.editingId.set(tp.id);
    this.tpFormData = {
      name: tp.name,
      description: tp.description ?? '',
      installmentId: tp.installmentId,
      monthlyAmount: tp.monthlyAmount,
      totalExpected: tp.totalExpected,
    };
    this.addFormError.set('');
    this.showAddModal.set(true);
  }

  closeAddModal(): void {
    this.showAddModal.set(false);
    this.editingId.set(null);
    this.addFormError.set('');
  }

  onSubmitAdd(): void {
    if (!this.tpFormData.monthlyAmount || this.tpFormData.monthlyAmount <= 0) {
      this.addFormError.set('Ingresa un monto mensual válido.');
      return;
    }
    if (!this.tpFormData.totalExpected || this.tpFormData.totalExpected <= 0) {
      this.addFormError.set('Ingresa un total esperado válido.');
      return;
    }
    if (!this.tpFormData.installmentId) {
      this.addFormError.set('Selecciona una compra a meses.');
      return;
    }
    const payload = {
      name: this.tpFormData.name,
      description: this.tpFormData.description || undefined,
      installmentId: this.tpFormData.installmentId,
      monthlyAmount: Number(this.tpFormData.monthlyAmount),
      totalExpected: Number(this.tpFormData.totalExpected),
    };
    try {
      const id = this.editingId();
      if (id) {
        this.thirdPartyService.update(id, payload);
      } else {
        this.thirdPartyService.create(payload);
      }
      this.closeAddModal();
    } catch (e: any) {
      this.addFormError.set(e?.message ?? 'Error al guardar.');
    }
  }

  openPaymentModal(tp: ThirdPartySummary): void {
    this.paymentTarget.set(tp);
    this.paymentForm = {
      month: this.currentMonthStr(),
      amount: tp.monthlyAmount,
      note: '',
    };
    this.paymentFormError.set('');
  }

  closePaymentModal(): void {
    this.paymentTarget.set(null);
    this.paymentFormError.set('');
  }

  onSubmitPayment(): void {
    if (!this.paymentForm.amount || this.paymentForm.amount <= 0) {
      this.paymentFormError.set('Ingresa un monto válido.');
      return;
    }
    if (!this.paymentForm.month) {
      this.paymentFormError.set('Selecciona el mes del pago.');
      return;
    }
    const tp = this.paymentTarget();
    if (!tp) return;
    try {
      this.thirdPartyService.recordPayment(
        tp.id,
        Number(this.paymentForm.amount),
        this.paymentForm.month,
        this.paymentForm.note || undefined,
      );
      this.closePaymentModal();
    } catch (e: any) {
      this.paymentFormError.set(e?.message ?? 'Error al registrar.');
    }
  }

  confirmDelete(tp: ThirdPartySummary): void {
    this.deleteTarget.set(tp);
  }

  doDelete(): void {
    if (this.deleteTarget()) {
      this.thirdPartyService.delete(this.deleteTarget()!.id);
      this.deleteTarget.set(null);
    }
  }

  formatCurrency(n: number): string {
    return `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  formatDate(str: string): string {
    return new Date(str).toLocaleDateString('es-MX');
  }

  private currentMonthStr(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  private defaultTpForm(): ThirdPartyForm {
    return { name: '', description: '', installmentId: '', monthlyAmount: null, totalExpected: null };
  }

  private defaultPaymentForm(): PaymentForm {
    return { month: this.currentMonthStr(), amount: null, note: '' };
  }
}
