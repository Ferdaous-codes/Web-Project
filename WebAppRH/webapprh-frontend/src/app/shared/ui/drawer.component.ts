import { Component, HostListener, computed, input, model, output } from '@angular/core';

@Component({
  selector: 'app-drawer',
  standalone: true,
  template: `
    @if (open()) {
      <!-- Backdrop -->
      <div
        class="fixed inset-0 z-[80] bg-gray-900/40 backdrop-blur-sm animate-fade-in"
        (click)="onBackdrop()"
      ></div>

      <!-- Panel -->
      <aside
        class="fixed top-0 right-0 bottom-0 z-[81] w-full sm:max-w-md bg-white shadow-2xl flex flex-col animate-slide-in-right"
        role="dialog"
        aria-modal="true"
        [attr.aria-label]="title()"
      >
        <header class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 class="text-base font-semibold text-gray-900">{{ title() }}</h2>
            @if (subtitle()) {
              <p class="text-xs text-gray-500 mt-0.5">{{ subtitle() }}</p>
            }
          </div>
          <button
            type="button"
            (click)="close()"
            class="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
            aria-label="Fermer"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </header>

        <div class="flex-1 overflow-y-auto px-6 py-5">
          <ng-content></ng-content>
        </div>

        @if (showFooter()) {
          <footer class="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
            <ng-content select="[footer]"></ng-content>
          </footer>
        }
      </aside>
    }
  `,
  styles: [`
    @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slide-in-right {
      from { transform: translateX(100%); }
      to   { transform: translateX(0); }
    }
    .animate-fade-in       { animation: fade-in 150ms ease-out; }
    .animate-slide-in-right { animation: slide-in-right 240ms cubic-bezier(0.4, 0, 0.2, 1); }
  `]
})
export class DrawerComponent {
  open = model<boolean>(false);
  title = input<string>('');
  subtitle = input<string>('');
  closeOnBackdrop = input<boolean>(true);
  showFooter = input<boolean>(true);
  closed = output<void>();

  close() {
    this.open.set(false);
    this.closed.emit();
  }

  onBackdrop() {
    if (this.closeOnBackdrop()) this.close();
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.open()) this.close();
  }
}
