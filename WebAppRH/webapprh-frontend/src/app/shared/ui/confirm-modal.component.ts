import { Component, HostListener, inject } from '@angular/core';
import { ConfirmService } from './confirm.service';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  template: `
    @if (svc.state(); as state) {
      <!-- Backdrop -->
      <div
        class="fixed inset-0 z-[90] bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
        (click)="svc.cancel()"
      >
        <!-- Dialog -->
        <div
          class="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-pop-in"
          (click)="$event.stopPropagation()"
          role="dialog"
          aria-modal="true"
        >
          <div class="flex items-start gap-4">
            <div
              class="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
              [class]="state.variant === 'danger' ? 'bg-red-100' : 'bg-emerald-100'"
            >
              @if (state.variant === 'danger') {
                <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
              } @else {
                <svg class="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              }
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="text-base font-semibold text-gray-900">{{ state.title }}</h3>
              <p class="text-sm text-gray-600 mt-1">{{ state.message }}</p>
            </div>
          </div>

          <div class="mt-6 flex justify-end gap-2">
            <button
              type="button"
              (click)="svc.cancel()"
              class="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition"
            >
              {{ state.cancelLabel }}
            </button>
            <button
              type="button"
              (click)="svc.confirm()"
              class="px-4 py-2 rounded-lg text-sm font-medium text-white shadow-sm transition"
              [class]="state.variant === 'danger'
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-emerald-600 hover:bg-emerald-700'"
            >
              {{ state.confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
    @keyframes pop-in {
      from { transform: scale(0.96); opacity: 0; }
      to   { transform: scale(1);    opacity: 1; }
    }
    .animate-fade-in { animation: fade-in 150ms ease-out; }
    .animate-pop-in  { animation: pop-in 180ms cubic-bezier(0.4, 0, 0.2, 1); }
  `]
})
export class ConfirmModalComponent {
  svc = inject(ConfirmService);

  @HostListener('document:keydown.escape')
  onEscape() { this.svc.cancel(); }
}
