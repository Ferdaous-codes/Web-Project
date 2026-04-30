import { Component, OnInit, computed, effect, inject, input, model, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';

import {
  EmployeDto,
  EmployeService,
  CreateEmployeRequest,
  UpdateEmployeRequest,
  TypeUtilisateur
} from './employe.service';
import { DepartementService, DepartementDto } from '../departements/departement.service';
import { ManagerService, ManagerDto } from '../departements/manager.service';
import { DrawerComponent } from '../../shared/ui/drawer.component';
import { ToastService } from '../../shared/ui/toast.service';

@Component({
  selector: 'app-employe-form',
  standalone: true,
  imports: [ReactiveFormsModule, DrawerComponent],
  template: `
    <app-drawer
      [(open)]="open"
      [title]="editing() ? 'Modifier l\\'utilisateur' : 'Nouvel utilisateur'"
      [subtitle]="editing() ? editing()!.prenom + ' ' + editing()!.nom : 'Créer un employé ou un manager.'"
    >
      <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4" id="emp-form">

        <!-- Type selector (Create only) -->
        @if (!editing()) {
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Type d'utilisateur *</label>
            <div class="grid grid-cols-2 gap-2">
              <button
                type="button"
                (click)="setType('Employe')"
                class="px-3 py-2.5 border-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
                [class]="form.controls.typeUtilisateur.value === 'Employe'
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
                Employé
              </button>
              <button
                type="button"
                (click)="setType('Manager')"
                class="px-3 py-2.5 border-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
                [class]="form.controls.typeUtilisateur.value === 'Manager'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
                </svg>
                Manager
              </button>
            </div>
          </div>
        }

        <!-- Identity -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Prénom *</label>
            <input
              type="text"
              formControlName="prenom"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
            />
            @if (showError(form.controls.prenom)) {
              <p class="text-xs text-red-600 mt-1">Obligatoire.</p>
            }
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Nom *</label>
            <input
              type="text"
              formControlName="nom"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
            />
            @if (showError(form.controls.nom)) {
              <p class="text-xs text-red-600 mt-1">Obligatoire.</p>
            }
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
          <input
            type="email"
            formControlName="email"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
          />
          @if (showError(form.controls.email)) {
            <p class="text-xs text-red-600 mt-1">Adresse email invalide.</p>
          }
        </div>

        <!-- Password (Create only) -->
        @if (!editing()) {
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Mot de passe initial *</label>
            <input
              type="text"
              formControlName="motDePasse"
              placeholder="Au moins 6 caractères"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition font-mono text-sm"
            />
            @if (showError(form.controls.motDePasse)) {
              <p class="text-xs text-red-600 mt-1">Au moins 6 caractères requis.</p>
            }
            <p class="text-xs text-gray-500 mt-1">L'utilisateur pourra le modifier après sa première connexion.</p>
          </div>
        }

        <!-- Department (always shown) -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Département</label>
          <select
            formControlName="departementId"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-white"
          >
            <option [ngValue]="null">— Aucun —</option>
            @for (d of departements(); track d.id) {
              <option [ngValue]="d.id">{{ d.nom }}</option>
            }
          </select>
        </div>

        <!-- Employe-specific fields -->
        @if (form.controls.typeUtilisateur.value === 'Employe') {
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Poste</label>
            <input
              type="text"
              formControlName="poste"
              placeholder="Ex: Développeur, Comptable"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
            />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Solde de congés</label>
              <input
                type="number"
                formControlName="soldeConge"
                min="0"
                max="365"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Manager</label>
              <select
                formControlName="managerId"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-white"
              >
                <option [ngValue]="null">— Aucun —</option>
                @for (m of managers(); track m.id) {
                  <option [ngValue]="m.id">{{ m.prenom }} {{ m.nom }}</option>
                }
              </select>
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
          form="emp-form"
          [disabled]="saving() || form.invalid"
          class="px-4 py-2 rounded-lg text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 disabled:cursor-not-allowed shadow-sm transition"
        >
          {{ saving() ? 'Enregistrement...' : (editing() ? 'Enregistrer' : 'Créer') }}
        </button>
      </ng-container>
    </app-drawer>
  `
})
export class EmployeFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private employeService = inject(EmployeService);
  private deptService = inject(DepartementService);
  private managerService = inject(ManagerService);
  private toast = inject(ToastService);

  open = model<boolean>(false);
  editing = input<EmployeDto | null>(null);
  saved = output<void>();

  saving = signal(false);
  departements = signal<DepartementDto[]>([]);
  managers = signal<ManagerDto[]>([]);

  form = this.fb.nonNullable.group({
    typeUtilisateur: ['Employe' as TypeUtilisateur, [Validators.required]],
    prenom: ['', [Validators.required]],
    nom: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    motDePasse: ['', [Validators.required, Validators.minLength(6)]],
    poste: [''],
    soldeConge: [25, [Validators.min(0)]],
    departementId: [null as number | null],
    managerId: [null as number | null]
  });

  constructor() {
    // Reset form when drawer opens (Edit pre-fills, Create resets)
    effect(() => {
      if (this.open()) {
        const e = this.editing();
        if (e) {
          // Edit mode: pre-fill, drop typeUtilisateur and motDePasse validators
          this.form.controls.typeUtilisateur.clearValidators();
          this.form.controls.motDePasse.clearValidators();
          this.form.controls.typeUtilisateur.updateValueAndValidity();
          this.form.controls.motDePasse.updateValueAndValidity();
          this.form.reset({
            typeUtilisateur: 'Employe',
            prenom: e.prenom,
            nom: e.nom,
            email: e.email,
            motDePasse: '',
            poste: e.poste,
            soldeConge: e.soldeConge,
            departementId: e.departementId,
            managerId: e.managerId
          });
        } else {
          this.form.controls.typeUtilisateur.setValidators([Validators.required]);
          this.form.controls.motDePasse.setValidators([Validators.required, Validators.minLength(6)]);
          this.form.controls.typeUtilisateur.updateValueAndValidity();
          this.form.controls.motDePasse.updateValueAndValidity();
          this.form.reset({
            typeUtilisateur: 'Employe',
            prenom: '',
            nom: '',
            email: '',
            motDePasse: '',
            poste: '',
            soldeConge: 25,
            departementId: null,
            managerId: null
          });
        }
      }
    });
  }

  ngOnInit(): void {
    this.deptService.getAll().subscribe({
      next: (list) => this.departements.set(list),
      error: () => this.departements.set([])
    });
    this.managerService.getAll().subscribe({
      next: (list) => this.managers.set(list),
      error: () => this.managers.set([])
    });
  }

  setType(t: TypeUtilisateur) {
    this.form.controls.typeUtilisateur.setValue(t);
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
    const v = this.form.getRawValue();
    const editing = this.editing();

    if (editing) {
      const payload: UpdateEmployeRequest = {
        nom: v.nom,
        prenom: v.prenom,
        email: v.email,
        poste: v.poste ?? '',
        soldeConge: v.soldeConge ?? 0,
        departementId: v.departementId,
        managerId: v.managerId
      };
      this.handle(this.employeService.update(editing.id, payload), 'Utilisateur mis à jour.');
    } else {
      const payload: CreateEmployeRequest = {
        typeUtilisateur: v.typeUtilisateur,
        nom: v.nom,
        prenom: v.prenom,
        email: v.email,
        motDePasse: v.motDePasse,
        poste: v.typeUtilisateur === 'Employe' ? (v.poste ?? '') : null,
        soldeConge: v.typeUtilisateur === 'Employe' ? (v.soldeConge ?? 25) : null,
        departementId: v.departementId,
        managerId: v.typeUtilisateur === 'Employe' ? v.managerId : null
      };
      this.handle(this.employeService.create(payload), `${v.typeUtilisateur === 'Manager' ? 'Manager' : 'Employé'} créé.`);
    }
  }

  private handle(obs: Observable<unknown>, successMsg: string) {
    obs.subscribe({
      next: () => {
        this.toast.success(successMsg);
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
