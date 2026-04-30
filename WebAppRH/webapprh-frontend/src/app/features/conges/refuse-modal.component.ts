import { Component, HostListener, inject, model, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-refuse-modal',
  standalone: true,
  imports: [FormsModule],
  template: `
    @if (open()) {
      <div
        class="fixed inset-0 z-[90] bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
        (click)="cancel()"
      >
        <div
          class="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-pop-in"
          (click)="$event.stopPropagation()"
          role="dialog"
          aria-modal="true"
        >
          <div class="flex items-start gap-4 mb-4">
            <div class="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </div>
            <div class="flex-1">
              <h3 class="text-base font-semibold text-gray-900">Refuser cette demande ?</h3>
              <p class="text-sm text-gray-600 mt-1">L'employé sera notifié. Vous pouvez préciser une raison.</p>
            </div>
          </div>

          <label class="block text-sm font-medium text-gray-700 mb-1.5">Motif (optionnel)</label>
          <textarea
            [(ngModel)]="motif"
            rows="3"
            placeholder="Ex: Période chargée, autre absence prévue..."
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition resize-none"
          ></textarea>

          <div class="mt-5 flex justify-end gap-2">
            <button
              type="button"
              (click)="cancel()"
              class="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition"
            >
              Annuler
            </button>
            <button
              type="button"
              (click)="confirm()"
              class="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 shadow-sm transition"
            >
              Refuser
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
export class RefuseModalComponent {
  open = model<boolean>(false);
  refused = output<string | null>();

  motif = signal<string>('');

  cancel() {
    this.open.set(false);
    this.motif.set('');
  }

  confirm() {
    const m = this.motif().trim();
    this.refused.emit(m.length > 0 ? m : null);
    this.open.set(false);
    this.motif.set('');
  }

  @HostListener('document:keydown.escape')
  onEscape() { if (this.open()) this.cancel(); }
}
