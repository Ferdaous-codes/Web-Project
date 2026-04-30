import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../core/auth/auth.service';
import { DepartementDto, DepartementDetailsDto, DepartementService } from './departement.service';
import { DepartementFormComponent } from './departement-form.component';
import { DrawerComponent } from '../../shared/ui/drawer.component';
import { ToastService } from '../../shared/ui/toast.service';
import { ConfirmService } from '../../shared/ui/confirm.service';

@Component({
  selector: 'app-departements',
  standalone: true,
  imports: [FormsModule, DepartementFormComponent, DrawerComponent],
  template: `
    <!-- Header -->
    <div class="flex items-start justify-between gap-4 mb-6 flex-wrap">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Départements</h1>
        <p class="text-gray-500 mt-1">{{ filtered().length }} département{{ filtered().length > 1 ? 's' : '' }}.</p>
      </div>
      @if (isAdmin()) {
        <button
          type="button"
          (click)="openCreate()"
          class="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg shadow-sm transition"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Nouveau département
        </button>
      }
    </div>

    <!-- Search bar -->
    <div class="mb-6 relative max-w-md">
      <svg class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
      </svg>
      <input
        type="text"
        [(ngModel)]="search"
        placeholder="Rechercher un département..."
        class="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-white"
      />
    </div>

    <!-- Loading -->
    @if (loading()) {
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        @for (i of [1,2,3,4,5,6]; track i) {
          <div class="bg-white border border-gray-200 rounded-xl p-5 animate-pulse">
            <div class="h-4 bg-gray-200 rounded w-2/3 mb-3"></div>
            <div class="h-3 bg-gray-100 rounded w-1/2 mb-4"></div>
            <div class="h-8 bg-gray-100 rounded"></div>
          </div>
        }
      </div>
    }

    <!-- Empty state -->
    @else if (filtered().length === 0) {
      <div class="bg-white border border-dashed border-gray-300 rounded-xl p-12 text-center">
        <div class="inline-flex w-12 h-12 rounded-xl bg-gray-100 items-center justify-center mb-3">
          <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
          </svg>
        </div>
        <h3 class="text-base font-semibold text-gray-900 mb-1">
          @if (search()) { Aucun résultat } @else { Aucun département }
        </h3>
        <p class="text-sm text-gray-500">
          @if (search()) { Essayez avec d'autres mots-clés. }
          @else if (isAdmin()) { Créez le premier département pour commencer. }
          @else { Aucun département n'a encore été créé. }
        </p>
      </div>
    }

    <!-- Cards grid -->
    @else {
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        @for (d of filtered(); track d.id) {
          <button
            type="button"
            (click)="openDetails(d)"
            class="text-left bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-emerald-300 transition group"
          >
            <div class="flex items-start justify-between gap-2 mb-3">
              <h3 class="font-semibold text-gray-900 text-base group-hover:text-emerald-700 transition">{{ d.nom }}</h3>
              <span class="flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                {{ d.nbEmployes }}
              </span>
            </div>

            <div class="space-y-1.5 text-sm">
              <div class="flex items-center gap-2 text-gray-600">
                <svg class="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
                <span class="truncate">{{ d.responsableNomComplet ?? 'Aucun responsable' }}</span>
              </div>
              <div class="flex items-center gap-2 text-gray-600">
                <svg class="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span class="font-medium text-gray-900 tabular-nums">{{ formatBudget(d.budget) }}</span>
              </div>
            </div>
          </button>
        }
      </div>
    }

    <!-- ===== DETAILS DRAWER ===== -->
    <app-drawer
      [(open)]="detailsOpen"
      [title]="detailsData()?.nom ?? 'Détails'"
      [subtitle]="'Département'"
      [showFooter]="isAdmin()"
    >
      @if (detailsLoading()) {
        <div class="space-y-3">
          <div class="h-4 bg-gray-100 rounded animate-pulse"></div>
          <div class="h-4 bg-gray-100 rounded w-2/3 animate-pulse"></div>
          <div class="h-20 bg-gray-100 rounded animate-pulse"></div>
        </div>
      } @else if (detailsData(); as d) {
        <!-- Stats -->
        <div class="grid grid-cols-2 gap-3 mb-6">
          <div class="bg-emerald-50 rounded-lg p-3">
            <div class="text-xs font-medium text-emerald-700 uppercase tracking-wide mb-1">Budget</div>
            <div class="text-lg font-bold text-emerald-900 tabular-nums">{{ formatBudget(d.budget) }}</div>
          </div>
          <div class="bg-blue-50 rounded-lg p-3">
            <div class="text-xs font-medium text-blue-700 uppercase tracking-wide mb-1">Employés</div>
            <div class="text-lg font-bold text-blue-900 tabular-nums">{{ d.employes.length }}</div>
          </div>
        </div>

        <!-- Responsable -->
        <div class="mb-6">
          <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Responsable</h4>
          @if (d.responsableNomComplet) {
            <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div class="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center text-xs font-semibold">
                {{ initialsFromName(d.responsableNomComplet) }}
              </div>
              <div>
                <div class="text-sm font-medium text-gray-900">{{ d.responsableNomComplet }}</div>
                <div class="text-xs text-gray-500">Manager</div>
              </div>
            </div>
          } @else {
            <p class="text-sm text-gray-400 italic">Aucun responsable assigné.</p>
          }
        </div>

        <!-- Employees list -->
        <div>
          <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Employés ({{ d.employes.length }})
          </h4>
          @if (d.employes.length === 0) {
            <p class="text-sm text-gray-400 italic">Aucun employé dans ce département.</p>
          } @else {
            <ul class="space-y-1.5">
              @for (e of d.employes; track e.id) {
                <li class="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                  <div class="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 text-white flex items-center justify-center text-xs font-semibold">
                    {{ (e.prenom[0] + e.nom[0]).toUpperCase() }}
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="text-sm font-medium text-gray-900 truncate">{{ e.prenom }} {{ e.nom }}</div>
                    <div class="text-xs text-gray-500 truncate">{{ e.poste || 'Employé' }}</div>
                  </div>
                </li>
              }
            </ul>
          }
        </div>
      }

      <ng-container footer>
        @if (detailsData(); as d) {
          <button
            type="button"
            (click)="askDelete(d)"
            class="px-4 py-2 rounded-lg text-sm font-medium text-red-600 bg-white border border-red-200 hover:bg-red-50 transition mr-auto"
          >
            Supprimer
          </button>
          <button
            type="button"
            (click)="openEdit(d)"
            class="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition"
          >
            Modifier
          </button>
        }
      </ng-container>
    </app-drawer>

    <!-- ===== CREATE/EDIT FORM DRAWER ===== -->
    <app-departement-form
      [(open)]="formOpen"
      [editing]="formEditing()"
      (saved)="onSaved()"
    />
  `
})
export class DepartementsComponent implements OnInit {
  private deptService = inject(DepartementService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);

  loading = signal(true);
  all = signal<DepartementDto[]>([]);
  search = signal('');

  detailsOpen = signal(false);
  detailsLoading = signal(false);
  detailsData = signal<DepartementDetailsDto | null>(null);

  formOpen = signal(false);
  formEditing = signal<DepartementDto | null>(null);

  isAdmin = computed(() => this.auth.role() === 'Administrateur');

  filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    if (!q) return this.all();
    return this.all().filter(d =>
      d.nom.toLowerCase().includes(q) ||
      (d.responsableNomComplet?.toLowerCase().includes(q) ?? false));
  });

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.deptService.getAll().subscribe({
      next: (list) => {
        this.all.set(list);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Impossible de charger les départements.');
        this.loading.set(false);
      }
    });
  }

  openDetails(d: DepartementDto) {
    this.detailsOpen.set(true);
    this.detailsLoading.set(true);
    this.detailsData.set(null);
    this.deptService.getById(d.id).subscribe({
      next: (full) => {
        this.detailsData.set(full);
        this.detailsLoading.set(false);
      },
      error: () => {
        this.toast.error('Impossible de charger les détails.');
        this.detailsLoading.set(false);
        this.detailsOpen.set(false);
      }
    });
  }

  openCreate() {
    this.formEditing.set(null);
    this.formOpen.set(true);
  }

  openEdit(d: { id: number; nom: string; budget: number; responsableId: number | null; responsableNomComplet: string | null; nbEmployes?: number }) {
    // Map details back to the DepartementDto shape the form expects
    this.formEditing.set({
      id: d.id, nom: d.nom, budget: d.budget,
      responsableId: d.responsableId,
      responsableNomComplet: d.responsableNomComplet,
      nbEmployes: d.nbEmployes ?? 0
    });
    this.detailsOpen.set(false);
    this.formOpen.set(true);
  }

  async askDelete(d: DepartementDetailsDto) {
    if (d.employes.length > 0) {
      this.toast.error('Impossible de supprimer : des employés sont rattachés à ce département.');
      return;
    }
    const ok = await this.confirm.ask({
      title: 'Supprimer ce département ?',
      message: `Le département « ${d.nom} » sera définitivement supprimé. Cette action est irréversible.`,
      confirmLabel: 'Supprimer',
      variant: 'danger'
    });
    if (!ok) return;

    this.deptService.delete(d.id).subscribe({
      next: () => {
        this.toast.success('Département supprimé.');
        this.detailsOpen.set(false);
        this.load();
      },
      error: (err) => {
        this.toast.error(err?.error?.message ?? 'Erreur lors de la suppression.');
      }
    });
  }

  onSaved() {
    this.load();
  }

  formatBudget(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency', currency: 'TND', maximumFractionDigits: 0
    }).format(amount);
  }

  initialsFromName(name: string): string {
    const parts = name.trim().split(/\s+/);
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
  }
}
