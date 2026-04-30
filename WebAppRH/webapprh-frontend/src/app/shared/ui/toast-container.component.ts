import { Component, inject } from '@angular/core';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  template: `
    <div class="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          class="pointer-events-auto min-w-[280px] max-w-md rounded-lg shadow-lg border px-4 py-3 flex items-start gap-3 animate-slide-in"
          [class]="classFor(toast.type)"
        >
          <div class="flex-shrink-0 mt-0.5">
            @switch (toast.type) {
              @case ('success') {
                <svg class="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              }
              @case ('error') {
                <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              }
              @case ('info') {
                <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              }
            }
          </div>
          <div class="flex-1 text-sm font-medium">{{ toast.message }}</div>
          <button
            (click)="toastService.dismiss(toast.id)"
            class="flex-shrink-0 text-gray-400 hover:text-gray-600 transition"
            aria-label="Fermer"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    @keyframes slide-in {
      from { transform: translateX(20px); opacity: 0; }
      to   { transform: translateX(0);    opacity: 1; }
    }
    .animate-slide-in {
      animation: slide-in 200ms cubic-bezier(0.4, 0, 0.2, 1);
    }
  `]
})
export class ToastContainerComponent {
  toastService = inject(ToastService);

  classFor(type: 'success' | 'error' | 'info'): string {
    switch (type) {
      case 'success': return 'bg-white border-emerald-200 text-emerald-900';
      case 'error':   return 'bg-white border-red-200 text-red-900';
      case 'info':    return 'bg-white border-blue-200 text-blue-900';
    }
  }
}
