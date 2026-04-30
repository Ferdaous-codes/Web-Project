import { Injectable, signal } from '@angular/core';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
}

interface ConfirmState extends ConfirmOptions {
  resolve: (result: boolean) => void;
}

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  readonly state = signal<ConfirmState | null>(null);

  ask(options: ConfirmOptions): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.state.set({
        confirmLabel: 'Confirmer',
        cancelLabel: 'Annuler',
        variant: 'primary',
        ...options,
        resolve
      });
    });
  }

  confirm(): void {
    const s = this.state();
    if (!s) return;
    this.state.set(null);
    s.resolve(true);
  }

  cancel(): void {
    const s = this.state();
    if (!s) return;
    this.state.set(null);
    s.resolve(false);
  }
}
