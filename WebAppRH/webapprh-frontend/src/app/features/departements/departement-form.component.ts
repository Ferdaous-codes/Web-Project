import { Component, OnInit, effect, inject, input, model, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
 
import {
  DepartementDto,
  DepartementService,
  CreateDepartementRequest
} from './departement.service';
import { ManagerService, ManagerDto } from './manager.service';
import { DrawerComponent } from '../../shared/ui/drawer.component';
import { ToastService } from '../../shared/ui/toast.service';
 
@Component({
  selector: 'app-departement-form',
  standalone: true,
  imports: [ReactiveFormsModule, DrawerComponent],
  template: `
    <app-drawer
      [(open)]="open"
      [title]="editing() ? 'Modifier le département' : 'Nouveau département'"
      [subtitle]="editing() ? editing()!.nom : 'Créez un nouveau département.'"
    >
      <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4" id="dept-form">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Nom du département *</label>
          <input
            type="text"
            formControlName="nom"
            placeholder="Ex: Ressources Humaines"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
          />
          @if (showError(form.controls.nom)) {
            <p class="text-xs text-red-600 mt-1">Le nom est obligatoire.</p>
          }
        </div>
 
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Budget annuel (TND) *</label>
          <input
            type="number"
            formControlName="budget"
            min="0"
            step="1000"
            placeholder="0"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
          />
          @if (showError(form.controls.budget)) {
            <p class="text-xs text-red-600 mt-1">Le budget doit être supérieur ou égal à 0.</p>
          }
        </div>
 
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Responsable (Manager)</label>
          <select
            formControlName="responsableId"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-white"
          >
            <option [ngValue]="null">— Aucun —</option>
            @for (m of managers(); track m.id) {
              <option [ngValue]="m.id">{{ m.prenom }} {{ m.nom }}</option>
            }
          </select>
          <p class="text-xs text-gray-500 mt-1">Optionnel. Vous pourrez l'assigner plus tard.</p>
        </div>
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
          form="dept-form"
          [disabled]="saving() || form.invalid"
          class="px-4 py-2 rounded-lg text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 disabled:cursor-not-allowed shadow-sm transition"
        >
          {{ saving() ? 'Enregistrement...' : (editing() ? 'Enregistrer' : 'Créer') }}
        </button>
      </ng-container>
    </app-drawer>
  `
})
export class DepartementFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private deptService = inject(DepartementService);
  private managerService = inject(ManagerService);
  private toast = inject(ToastService);
 
  open = model<boolean>(false);
  editing = input<DepartementDto | null>(null);
  saved = output<void>();
 
  saving = signal(false);
  managers = signal<ManagerDto[]>([]);
 
  form = this.fb.nonNullable.group({
    nom: ['', [Validators.required]],
    budget: [0, [Validators.required, Validators.min(0)]],
    responsableId: [null as number | null]
  });
 
  constructor() {
    // When the drawer opens, sync the form with the current `editing` input.
    effect(() => {
      if (this.open()) {
        const e = this.editing();
        if (e) {
          this.form.reset({
            nom: e.nom,
            budget: e.budget,
            responsableId: e.responsableId
          });
        } else {
          this.form.reset({ nom: '', budget: 0, responsableId: null });
        }
      }
    });
  }
 
  ngOnInit(): void {
    this.managerService.getAll().subscribe({
      next: (list) => this.managers.set(list),
      error: () => this.managers.set([])
    });
  }
 
  showError(control: { invalid: boolean; touched: boolean; dirty: boolean }): boolean {
    return control.invalid && (control.touched || control.dirty);
  }
 
  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    const payload = this.form.getRawValue() as CreateDepartementRequest;
    const editing = this.editing();
 
    const obs: Observable<unknown> = editing
      ? this.deptService.update(editing.id, payload)
      : this.deptService.create(payload);
 
    obs.subscribe({
      next: () => {
        this.toast.success(editing ? 'Département mis à jour.' : 'Département créé.');
        this.saving.set(false);
        this.open.set(false);
        this.saved.emit();
      },
      error: (err: any) => {
        this.toast.error(err?.error?.message ?? 'Une erreur est survenue.');
        this.saving.set(false);
      }
    });
  }
}