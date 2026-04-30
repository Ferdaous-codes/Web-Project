import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { CompteService, CompteDto } from './compte.service';
import { ToastService } from '../../shared/ui/toast.service';
import { ConfirmService } from '../../shared/ui/confirm.service';

type Tab = 'profil' | 'securite';

@Component({
  selector: 'app-compte',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="max-w-3xl">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-gray-900">Mon compte</h1>
        <p class="text-gray-500 mt-1">Gérez vos informations personnelles et la sécurité de votre compte.</p>
      </div>

      @if (loading()) {
        <div class="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-emerald-600"></div>
          <p class="mt-3 text-sm text-gray-500">Chargement...</p>
        </div>
      } @else if (compte(); as c) {
        <!-- Identity card -->
        <div class="bg-white border border-gray-200 rounded-xl p-6 mb-6 flex items-center gap-4">
          <div class="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 text-white flex items-center justify-center text-xl font-semibold">
            {{ initials(c) }}
          </div>
          <div class="flex-1 min-w-0">
            <h2 class="text-lg font-semibold text-gray-900">{{ c.prenom }} {{ c.nom }}</h2>
            <p class="text-sm text-gray-500 truncate">{{ c.email }}</p>
          </div>
          <span class="px-2.5 py-1 rounded-full text-xs font-medium"
                [class]="badgeClass(c.role)">
            {{ c.role }}
          </span>
        </div>

        <!-- Tabs -->
        <div class="border-b border-gray-200 mb-6">
          <nav class="flex gap-6">
            <button
              type="button"
              (click)="activeTab.set('profil')"
              class="pb-3 px-0.5 text-sm font-medium border-b-2 transition"
              [class]="activeTab() === 'profil'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
            >
              Profil
            </button>
            <button
              type="button"
              (click)="activeTab.set('securite')"
              class="pb-3 px-0.5 text-sm font-medium border-b-2 transition"
              [class]="activeTab() === 'securite'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
            >
              Sécurité
            </button>
          </nav>
        </div>

        <!-- ============ PROFIL TAB ============ -->
        @if (activeTab() === 'profil') {
          <div class="bg-white border border-gray-200 rounded-xl p-6">
            <h3 class="text-base font-semibold text-gray-900 mb-1">Informations personnelles</h3>
            <p class="text-sm text-gray-500 mb-6">Mettez à jour votre nom et votre adresse email.</p>

            <form [formGroup]="profilForm" (ngSubmit)="saveProfil()" class="space-y-4">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">Prénom</label>
                  <input
                    type="text"
                    formControlName="prenom"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                  />
                  @if (showError(profilForm.controls.prenom)) {
                    <p class="text-xs text-red-600 mt-1">Le prénom est obligatoire.</p>
                  }
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">Nom</label>
                  <input
                    type="text"
                    formControlName="nom"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                  />
                  @if (showError(profilForm.controls.nom)) {
                    <p class="text-xs text-red-600 mt-1">Le nom est obligatoire.</p>
                  }
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input
                  type="email"
                  formControlName="email"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                />
                @if (showError(profilForm.controls.email)) {
                  <p class="text-xs text-red-600 mt-1">Adresse email invalide.</p>
                }
              </div>

              <div class="flex justify-end pt-2">
                <button
                  type="submit"
                  [disabled]="profilSaving() || profilForm.invalid"
                  class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg shadow-sm transition"
                >
                  {{ profilSaving() ? 'Enregistrement...' : 'Enregistrer les modifications' }}
                </button>
              </div>
            </form>
          </div>
        }

        <!-- ============ SECURITE TAB ============ -->
        @if (activeTab() === 'securite') {
          <div class="bg-white border border-gray-200 rounded-xl p-6">
            <h3 class="text-base font-semibold text-gray-900 mb-1">Changer le mot de passe</h3>
            <p class="text-sm text-gray-500 mb-6">Choisissez un mot de passe d'au moins 6 caractères.</p>

            <form [formGroup]="passwordForm" (ngSubmit)="changePassword()" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Mot de passe actuel</label>
                <input
                  type="password"
                  formControlName="motDePasseActuel"
                  autocomplete="current-password"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                />
                @if (showError(passwordForm.controls.motDePasseActuel)) {
                  <p class="text-xs text-red-600 mt-1">Veuillez saisir votre mot de passe actuel.</p>
                }
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Nouveau mot de passe</label>
                <input
                  type="password"
                  formControlName="nouveauMotDePasse"
                  autocomplete="new-password"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                />
                @if (showError(passwordForm.controls.nouveauMotDePasse)) {
                  <p class="text-xs text-red-600 mt-1">Le mot de passe doit faire au moins 6 caractères.</p>
                }
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Confirmer le nouveau mot de passe</label>
                <input
                  type="password"
                  formControlName="confirmation"
                  autocomplete="new-password"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                />
                @if (passwordForm.errors?.['mismatch'] && passwordForm.controls.confirmation.touched) {
                  <p class="text-xs text-red-600 mt-1">Les deux mots de passe ne correspondent pas.</p>
                }
              </div>

              <div class="flex justify-end pt-2">
                <button
                  type="submit"
                  [disabled]="passwordSaving() || passwordForm.invalid"
                  class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg shadow-sm transition"
                >
                  {{ passwordSaving() ? 'Enregistrement...' : 'Modifier le mot de passe' }}
                </button>
              </div>
            </form>
          </div>
        }
      }
    </div>
  `
})
export class CompteComponent implements OnInit {
  private fb = inject(FormBuilder);
  private compteService = inject(CompteService);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);

  loading = signal(true);
  compte = signal<CompteDto | null>(null);
  activeTab = signal<Tab>('profil');
  profilSaving = signal(false);
  passwordSaving = signal(false);

  profilForm = this.fb.nonNullable.group({
    prenom: ['', [Validators.required]],
    nom: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]]
  });

  passwordForm = this.fb.nonNullable.group(
    {
      motDePasseActuel: ['', [Validators.required]],
      nouveauMotDePasse: ['', [Validators.required, Validators.minLength(6)]],
      confirmation: ['', [Validators.required]]
    },
    {
      validators: (group) => {
        const a = group.get('nouveauMotDePasse')?.value;
        const b = group.get('confirmation')?.value;
        return a && b && a !== b ? { mismatch: true } : null;
      }
    }
  );

  ngOnInit(): void {
    this.compteService.getMine().subscribe({
      next: (c) => {
        this.compte.set(c);
        this.profilForm.patchValue({ prenom: c.prenom, nom: c.nom, email: c.email });
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Impossible de charger votre profil.');
        this.loading.set(false);
      }
    });
  }

  initials(c: CompteDto): string {
    return ((c.prenom?.[0] ?? '') + (c.nom?.[0] ?? '')).toUpperCase() || '?';
  }

  badgeClass(role: string): string {
    switch (role) {
      case 'Administrateur': return 'bg-purple-100 text-purple-700';
      case 'Manager':        return 'bg-blue-100 text-blue-700';
      case 'Employe':        return 'bg-emerald-100 text-emerald-700';
      default:               return 'bg-gray-100 text-gray-700';
    }
  }

  showError(control: { invalid: boolean; touched: boolean; dirty: boolean }): boolean {
    return control.invalid && (control.touched || control.dirty);
  }

  async saveProfil() {
    if (this.profilForm.invalid) {
      this.profilForm.markAllAsTouched();
      return;
    }
    const ok = await this.confirm.ask({
      title: 'Mettre à jour le profil ?',
      message: 'Vos informations personnelles seront mises à jour.',
      confirmLabel: 'Enregistrer',
      variant: 'primary'
    });
    if (!ok) return;

    this.profilSaving.set(true);
    this.compteService.updateProfil(this.profilForm.getRawValue()).subscribe({
      next: () => {
        this.toast.success('Profil mis à jour.');
        const c = this.compte();
        if (c) this.compte.set({ ...c, ...this.profilForm.getRawValue() });
        this.profilSaving.set(false);
      },
      error: (err) => {
        this.toast.error(err?.error?.message ?? 'Erreur lors de la mise à jour.');
        this.profilSaving.set(false);
      }
    });
  }

  changePassword() {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    this.passwordSaving.set(true);
    this.compteService.changePassword(this.passwordForm.getRawValue()).subscribe({
      next: () => {
        this.toast.success('Mot de passe modifié avec succès.');
        this.passwordForm.reset();
        this.passwordSaving.set(false);
      },
      error: (err) => {
        this.toast.error(err?.error?.message ?? 'Erreur lors du changement de mot de passe.');
        this.passwordSaving.set(false);
      }
    });
  }
}
