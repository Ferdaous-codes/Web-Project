import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { EmployeDto, EmployeService } from './employe.service';
import { ManagerService, ManagerDto } from '../departements/manager.service';
import { DepartementService, DepartementDto } from '../departements/departement.service';
import { EmployeFormComponent } from './employe-form.component';
import { DrawerComponent } from '../../shared/ui/drawer.component';
import { ToastService } from '../../shared/ui/toast.service';
import { ConfirmService } from '../../shared/ui/confirm.service';

interface UnifiedRow {
  id: number;
  type: 'Employe' | 'Manager';
  nom: string;
  prenom: string;
  email: string;
  poste: string;
  soldeConge: number | null;
  departementId: number | null;
  departementNom: string | null;
  managerNomComplet: string | null;
  tailleEquipe: number | null;
}

@Component({
  selector: 'app-employes',
  standalone: true,
  imports: [FormsModule, EmployeFormComponent, DrawerComponent],
  template: `
    <!-- Header -->
    <div class="flex items-start justify-between gap-4 mb-6 flex-wrap">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Utilisateurs</h1>
        <p class="text-gray-500 mt-1">
          {{ filtered().length }} utilisateur{{ filtered().length > 1 ? 's' : '' }}
          @if (search() || typeFilter() !== 'Tous' || deptFilter() !== null) { · filtre actif }
        </p>
      </div>
      <button
        type="button"
        (click)="openCreate()"
        class="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg shadow-sm transition"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
        </svg>
        Nouvel utilisateur
      </button>
    </div>

    <!-- Filters bar -->
    <div class="bg-white border border-gray-200 rounded-xl p-3 mb-4 flex flex-wrap gap-3 items-center">
      <div class="relative flex-1 min-w-[200px]">
        <svg class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        <input
          type="text"
          [(ngModel)]="search"
          placeholder="Rechercher par nom, email, poste..."
          class="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition text-sm"
        />
      </div>

      <select
        [(ngModel)]="typeFilter"
        class="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-white text-sm"
      >
        <option value="Tous">Tous les types</option>
        <option value="Employe">Employés uniquement</option>
        <option value="Manager">Managers uniquement</option>
      </select>

      <select
        [(ngModel)]="deptFilter"
        class="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-white text-sm"
      >
        <option [ngValue]="null">Tous les départements</option>
        @for (d of departements(); track d.id) {
          <option [ngValue]="d.id">{{ d.nom }}</option>
        }
      </select>

      @if (search() || typeFilter() !== 'Tous' || deptFilter() !== null) {
        <button
          type="button"
          (click)="clearFilters()"
          class="text-xs text-gray-500 hover:text-gray-700 transition px-2"
        >
          Réinitialiser
        </button>
      }
    </div>

    <!-- Loading -->
    @if (loading()) {
      <div class="bg-white border border-gray-200 rounded-xl p-12 text-center">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-emerald-600"></div>
        <p class="mt-3 text-sm text-gray-500">Chargement...</p>
      </div>
    }

    <!-- Empty -->
    @else if (filtered().length === 0) {
      <div class="bg-white border border-dashed border-gray-300 rounded-xl p-12 text-center">
        <h3 class="text-base font-semibold text-gray-900 mb-1">
          @if (rows().length === 0) { Aucun utilisateur } @else { Aucun résultat }
        </h3>
        <p class="text-sm text-gray-500">
          @if (rows().length === 0) { Créez votre premier utilisateur pour commencer. }
          @else { Essayez d'ajuster les filtres. }
        </p>
      </div>
    }

    <!-- Data table -->
    @else {
      <div class="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr class="text-left">
                <th class="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Utilisateur</th>
                <th class="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Type</th>
                <th class="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Département</th>
                <th class="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Détails</th>
                <th class="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-20"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              @for (r of filtered(); track r.id) {
                <tr class="hover:bg-gray-50 transition cursor-pointer" (click)="openDetails(r)">
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-3">
                      <div
                        class="w-9 h-9 rounded-full text-white flex items-center justify-center text-xs font-semibold flex-shrink-0"
                        [class]="r.type === 'Manager'
                          ? 'bg-gradient-to-br from-blue-500 to-blue-700'
                          : 'bg-gradient-to-br from-emerald-500 to-emerald-700'"
                      >
                        {{ initials(r) }}
                      </div>
                      <div class="min-w-0">
                        <div class="text-sm font-medium text-gray-900 truncate">{{ r.prenom }} {{ r.nom }}</div>
                        <div class="text-xs text-gray-500 truncate">{{ r.email }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="px-4 py-3 hidden md:table-cell">
                    <span
                      class="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
                      [class]="r.type === 'Manager' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'"
                    >
                      {{ r.type }}
                    </span>
                  </td>
                  <td class="px-4 py-3 hidden lg:table-cell text-sm text-gray-700">
                    {{ r.departementNom ?? '—' }}
                  </td>
                  <td class="px-4 py-3 hidden lg:table-cell text-sm text-gray-500">
                    @if (r.type === 'Employe') {
                      {{ r.poste || 'Employé' }} · {{ r.soldeConge }} j
                    } @else {
                      {{ r.tailleEquipe }} membre{{ (r.tailleEquipe ?? 0) > 1 ? 's' : '' }}
                    }
                  </td>
                  <td class="px-4 py-3 text-right">
                    <svg class="w-4 h-4 text-gray-400 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                    </svg>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    }

    <!-- DETAILS DRAWER -->
    <app-drawer
      [(open)]="detailsOpen"
      [title]="(detailsRow()?.prenom ?? '') + ' ' + (detailsRow()?.nom ?? '')"
      [subtitle]="detailsRow()?.type ?? ''"
    >
      @if (detailsRow(); as r) {
        <!-- Identity -->
        <div class="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100">
          <div
            class="w-14 h-14 rounded-full text-white flex items-center justify-center text-base font-semibold"
            [class]="r.type === 'Manager'
              ? 'bg-gradient-to-br from-blue-500 to-blue-700'
              : 'bg-gradient-to-br from-emerald-500 to-emerald-700'"
          >
            {{ initials(r) }}
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-base font-semibold text-gray-900">{{ r.prenom }} {{ r.nom }}</div>
            <div class="text-sm text-gray-500 truncate">{{ r.email }}</div>
            <span
              class="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium"
              [class]="r.type === 'Manager' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'"
            >
              {{ r.type }}
            </span>
          </div>
        </div>

        <!-- Info rows -->
        <dl class="space-y-3 mb-6">
          <div class="flex items-start gap-3">
            <dt class="text-xs font-semibold text-gray-500 uppercase tracking-wide w-28 flex-shrink-0 pt-0.5">Département</dt>
            <dd class="text-sm text-gray-900">{{ r.departementNom ?? '—' }}</dd>
          </div>
          @if (r.type === 'Employe') {
            <div class="flex items-start gap-3">
              <dt class="text-xs font-semibold text-gray-500 uppercase tracking-wide w-28 flex-shrink-0 pt-0.5">Poste</dt>
              <dd class="text-sm text-gray-900">{{ r.poste || 'Non défini' }}</dd>
            </div>
            <div class="flex items-start gap-3">
              <dt class="text-xs font-semibold text-gray-500 uppercase tracking-wide w-28 flex-shrink-0 pt-0.5">Manager</dt>
              <dd class="text-sm text-gray-900">{{ r.managerNomComplet ?? '—' }}</dd>
            </div>
            <div class="flex items-start gap-3">
              <dt class="text-xs font-semibold text-gray-500 uppercase tracking-wide w-28 flex-shrink-0 pt-0.5">Solde congés</dt>
              <dd class="text-sm font-medium text-gray-900 tabular-nums">{{ r.soldeConge }} jours</dd>
            </div>
          }
          @if (r.type === 'Manager') {
            <div class="flex items-start gap-3">
              <dt class="text-xs font-semibold text-gray-500 uppercase tracking-wide w-28 flex-shrink-0 pt-0.5">Équipe</dt>
              <dd class="text-sm font-medium text-gray-900 tabular-nums">{{ r.tailleEquipe }} membre{{ (r.tailleEquipe ?? 0) > 1 ? 's' : '' }}</dd>
            </div>
          }
        </dl>
      }

      <ng-container footer>
        @if (detailsRow(); as r) {
          <button
            type="button"
            (click)="askDelete(r)"
            class="px-4 py-2 rounded-lg text-sm font-medium text-red-600 bg-white border border-red-200 hover:bg-red-50 transition mr-auto"
          >
            Supprimer
          </button>
          @if (r.type === 'Employe') {
            <button
              type="button"
              (click)="openEdit(r)"
              class="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition"
            >
              Modifier
            </button>
          }
        }
      </ng-container>
    </app-drawer>

    <!-- CREATE/EDIT FORM -->
    <app-employe-form
      [(open)]="formOpen"
      [editing]="formEditing()"
      (saved)="onSaved()"
    />
  `
})
export class EmployesComponent implements OnInit {
  private employeService = inject(EmployeService);
  private managerService = inject(ManagerService);
  private deptService = inject(DepartementService);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);

  loading = signal(true);
  rows = signal<UnifiedRow[]>([]);
  departements = signal<DepartementDto[]>([]);

  search = signal('');
  typeFilter = signal<'Tous' | 'Employe' | 'Manager'>('Tous');
  deptFilter = signal<number | null>(null);

  detailsOpen = signal(false);
  detailsRow = signal<UnifiedRow | null>(null);

  formOpen = signal(false);
  formEditing = signal<EmployeDto | null>(null);

  filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    const t = this.typeFilter();
    const d = this.deptFilter();
    return this.rows().filter(r => {
      if (t !== 'Tous' && r.type !== t) return false;
      if (d !== null && r.departementId !== d) return false;
      if (q && !this.matchesSearch(r, q)) return false;
      return true;
    });
  });

  ngOnInit(): void { this.load(); }

  load() {
    this.loading.set(true);
    Promise.all([
      new Promise<EmployeDto[]>(res => this.employeService.getAll().subscribe({
        next: x => res(x), error: () => res([])
      })),
      new Promise<ManagerDto[]>(res => this.managerService.getAll().subscribe({
        next: x => res(x), error: () => res([])
      })),
      new Promise<DepartementDto[]>(res => this.deptService.getAll().subscribe({
        next: x => res(x), error: () => res([])
      }))
    ]).then(([emps, mgrs, depts]) => {
      this.departements.set(depts);
      const unified: UnifiedRow[] = [
        ...emps.map<UnifiedRow>(e => ({
          id: e.id, type: 'Employe',
          nom: e.nom, prenom: e.prenom, email: e.email,
          poste: e.poste, soldeConge: e.soldeConge,
          departementId: e.departementId, departementNom: e.departementNom,
          managerNomComplet: e.managerNomComplet,
          tailleEquipe: null
        })),
        ...mgrs.map<UnifiedRow>(m => ({
          id: m.id, type: 'Manager',
          nom: m.nom, prenom: m.prenom, email: m.email,
          poste: '', soldeConge: null,
          departementId: m.departementId, departementNom: m.departementNom,
          managerNomComplet: null,
          tailleEquipe: m.tailleEquipe
        }))
      ];
      // Sort by name
      unified.sort((a, b) => (a.nom + a.prenom).localeCompare(b.nom + b.prenom));
      this.rows.set(unified);
      this.loading.set(false);
    });
  }

  matchesSearch(r: UnifiedRow, q: string): boolean {
    return (
      r.nom.toLowerCase().includes(q) ||
      r.prenom.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q) ||
      (r.poste?.toLowerCase().includes(q) ?? false) ||
      (r.departementNom?.toLowerCase().includes(q) ?? false)
    );
  }

  initials(r: UnifiedRow): string {
    return ((r.prenom?.[0] ?? '') + (r.nom?.[0] ?? '')).toUpperCase() || '?';
  }

  clearFilters() {
    this.search.set('');
    this.typeFilter.set('Tous');
    this.deptFilter.set(null);
  }

  openDetails(r: UnifiedRow) {
    this.detailsRow.set(r);
    this.detailsOpen.set(true);
  }

  openCreate() {
    this.formEditing.set(null);
    this.formOpen.set(true);
  }

  openEdit(r: UnifiedRow) {
    if (r.type !== 'Employe') return;
    this.formEditing.set({
      id: r.id,
      nom: r.nom,
      prenom: r.prenom,
      email: r.email,
      poste: r.poste,
      soldeConge: r.soldeConge ?? 0,
      departementId: r.departementId,
      departementNom: r.departementNom,
      managerId: null,
      managerNomComplet: r.managerNomComplet
    });
    this.detailsOpen.set(false);
    this.formOpen.set(true);
  }

  async askDelete(r: UnifiedRow) {
    const what = r.type === 'Manager' ? 'le manager' : 'l\'employé';
    const ok = await this.confirm.ask({
      title: `Supprimer ${what} ?`,
      message: `${r.prenom} ${r.nom} sera définitivement supprimé. Cette action est irréversible.`,
      confirmLabel: 'Supprimer',
      variant: 'danger'
    });
    if (!ok) return;

    // Different endpoint for Manager vs Employe
    const obs = r.type === 'Manager'
      ? this.managerService.delete(r.id)
      : this.employeService.delete(r.id);

    obs.subscribe({
      next: () => {
        this.toast.success('Utilisateur supprimé.');
        this.detailsOpen.set(false);
        this.load();
      },
      error: (err: any) => {
        this.toast.error(err?.error?.message ?? 'Erreur lors de la suppression.');
      }
    });
  }

  onSaved() { this.load(); }
}
