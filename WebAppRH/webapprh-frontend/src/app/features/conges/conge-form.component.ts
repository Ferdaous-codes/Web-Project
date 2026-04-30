import { Component, computed, effect, inject, input, model, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';

import {
  CongeService,
  DemandeCongeDto,
  CreateDemandeCongeRequest,
  TypeConge
} from './conge.service';
import { DrawerComponent } from '../../shared/ui/drawer.component';
import { ToastService } from '../../shared/ui/toast.service';

@Component({
  selector: 'app-conge-form',
  standalone: true,
  imports: [ReactiveFormsModule, DrawerComponent],
  template: `
    <app-drawer
      [(open)]="open"
      [title]="editing() ? 'Modifier la demande' : 'Nouvelle demande de congé'"
      [subtitle]="editing() ? 'Vous pouvez modifier tant qu\\'elle est en attente.' : 'Soumettez une demande à votre manager.'"
    >
      <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4" id="conge-form">

        <!-- Type -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Type de congé *</label>
          <div class="grid grid-cols-3 gap-2">
            @for (t of types; track t.value) {
              <button
                type="button"
                (click)="setType(t.value)"
                class="px-3 py-2.5 border-2 rounded-lg text-sm font-medium transition flex flex-col items-center gap-1"
                [class]="typeValue() === t.value
                  ? t.activeClass
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'"
              >
                <span class="text-lg">{{ t.icon }}</span>
                <span class="text-xs">{{ t.label }}</span>
              </button>
            }
          </div>
        </div>

        <!-- Date début -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Date de début *</label>
          <input
            type="date"
            formControlName="dateDebut"
            [min]="todayIso"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
          />
          @if (showError(form.controls.dateDebut)) {
            <p class="text-xs text-red-600 mt-1">Date obligatoire.</p>
          }
        </div>

        <!-- Date fin -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Date de fin *</label>
          <input
            type="date"
            formControlName="dateFin"
            [min]="dateDebutValue() || todayIso"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
          />
          @if (showError(form.controls.dateFin)) {
            <p class="text-xs text-red-600 mt-1">Date obligatoire.</p>
          }
          @if (form.errors?.['endBeforeStart']) {
            <p class="text-xs text-red-600 mt-1">La date de fin doit être après la date de début.</p>
          }
        </div>

        <!-- Duration preview -->
        @if (durationDays() !== null) {
          <div class="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 flex items-center gap-3">
            <svg class="w-5 h-5 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
            <div class="text-sm text-emerald-900">
              Durée : <strong class="tabular-nums">{{ durationDays() }} jour{{ durationDays()! > 1 ? 's' : '' }}</strong>
            </div>
          </div>
        }
      </form>

      <ng-container footer>
        <button
          type="button"
          (click)="open.set(false)"
          class="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition"
        >
          Annuler
        </button>
        <button
          type="submit"
          form="conge-form"
          [disabled]="saving() || form.invalid"
          class="px-4 py-2 rounded-lg text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 disabled:cursor-not-allowed shadow-sm transition"
        >
          {{ saving() ? 'Envoi...' : (editing() ? 'Enregistrer' : 'Soumettre') }}
        </button>
      </ng-container>
    </app-drawer>
  `
})
export class CongeFormComponent {
  private fb = inject(FormBuilder);
  private congeService = inject(CongeService);
  private toast = inject(ToastService);

  open = model<boolean>(false);
  editing = input<DemandeCongeDto | null>(null);
  saved = output<void>();

  saving = signal(false);
  todayIso = new Date().toISOString().split('T')[0];

  // Mirror form values into signals so `computed()` recomputes reactively
  typeValue = signal<TypeConge>('Annuel');
  dateDebutValue = signal<string>('');
  dateFinValue = signal<string>('');

  types: { value: TypeConge; label: string; icon: string; activeClass: string }[] = [
    { value: 'Annuel',    label: 'Annuel',    icon: '🌴', activeClass: 'border-emerald-500 bg-emerald-50 text-emerald-700' },
    { value: 'Maladie',   label: 'Maladie',   icon: '🏥', activeClass: 'border-blue-500 bg-blue-50 text-blue-700' },
    { value: 'SansSolde', label: 'Sans solde', icon: '📋', activeClass: 'border-gray-500 bg-gray-100 text-gray-700' }
  ];

  form = this.fb.nonNullable.group(
    {
      type: ['Annuel' as TypeConge, [Validators.required]],
      dateDebut: ['', [Validators.required]],
      dateFin: ['', [Validators.required]]
    },
    {
      validators: (g) => {
        const a = g.get('dateDebut')?.value;
        const b = g.get('dateFin')?.value;
        if (a && b && new Date(b) < new Date(a)) return { endBeforeStart: true };
        return null;
      }
    }
  );

  durationDays = computed(() => {
    const a = this.dateDebutValue();
    const b = this.dateFinValue();
    if (!a || !b) return null;
    const start = new Date(a);
    const end = new Date(b);
    if (end < start) return null;
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  });

  constructor() {
    // Sync form values into signals
    this.form.valueChanges.subscribe(v => {
      this.typeValue.set((v.type ?? 'Annuel') as TypeConge);
      this.dateDebutValue.set(v.dateDebut ?? '');
      this.dateFinValue.set(v.dateFin ?? '');
    });

    // Reset form when drawer opens
    effect(() => {
      if (this.open()) {
        const e = this.editing();
        if (e) {
          this.form.reset({
            type: e.type,
            dateDebut: e.dateDebut.split('T')[0],
            dateFin: e.dateFin.split('T')[0]
          });
        } else {
          this.form.reset({ type: 'Annuel', dateDebut: '', dateFin: '' });
        }
      }
    });
  }

  setType(t: TypeConge) { this.form.controls.type.setValue(t); }

  showError(c: { invalid: boolean; touched: boolean; dirty: boolean }) {
    return c.invalid && (c.touched || c.dirty);
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    const v = this.form.getRawValue();
    const payload: CreateDemandeCongeRequest = {
      dateDebut: v.dateDebut,
      dateFin: v.dateFin,
      type: v.type
    };
    const editing = this.editing();
    const obs: Observable<unknown> = editing
      ? this.congeService.update(editing.id, payload)
      : this.congeService.create(payload);

    obs.subscribe({
      next: () => {
        this.toast.success(editing ? 'Demande mise à jour.' : 'Demande envoyée.');
        this.saving.set(false);
        this.open.set(false);
        this.saved.emit();
      },
      error: (err: any) => {
        this.toast.error(err?.error?.message ?? 'Erreur lors de l\'envoi.');
        this.saving.set(false);
      }
    });
  }
}
