import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import {
  AdminStats,
  DashboardService,
  DashboardStats,
  EmployeStats,
  ManagerStats
} from './dashboard.service';
import { BarChartComponent, BarChartItem } from './bar-chart.component';
import { ToastService } from '../../shared/ui/toast.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, BarChartComponent],
  template: `
    <!-- Greeting -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900">{{ greeting() }}, {{ user()?.prenom }} 👋</h1>
      <p class="text-gray-500 mt-1">{{ subtitle() }}</p>
    </div>

    <!-- Loading -->
    @if (loading()) {
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        @for (i of [1,2,3,4]; track i) {
          <div class="bg-white border border-gray-200 rounded-xl p-5 animate-pulse">
            <div class="h-3 bg-gray-100 rounded w-1/2 mb-3"></div>
            <div class="h-8 bg-gray-200 rounded w-2/3"></div>
          </div>
        }
      </div>
    }

    <!-- ============ ADMIN ============ -->
    @else if (admin(); as s) {
      <!-- Stat cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <a routerLink="/employes" class="block bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-emerald-300 transition group">
          <div class="flex items-start justify-between mb-3">
            <span class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Employés</span>
            <div class="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition">
              <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
            </div>
          </div>
          <div class="text-2xl font-bold text-gray-900 tabular-nums">{{ s.totalEmployes }}</div>
        </a>

        <a routerLink="/employes" class="block bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-blue-300 transition group">
          <div class="flex items-start justify-between mb-3">
            <span class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Managers</span>
            <div class="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition">
              <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
              </svg>
            </div>
          </div>
          <div class="text-2xl font-bold text-gray-900 tabular-nums">{{ s.totalManagers }}</div>
        </a>

        <a routerLink="/departements" class="block bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-purple-300 transition group">
          <div class="flex items-start justify-between mb-3">
            <span class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Départements</span>
            <div class="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center group-hover:bg-purple-100 transition">
              <svg class="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5"/>
              </svg>
            </div>
          </div>
          <div class="text-2xl font-bold text-gray-900 tabular-nums">{{ s.totalDepartements }}</div>
        </a>

        <div class="block bg-white border border-gray-200 rounded-xl p-5">
          <div class="flex items-start justify-between mb-3">
            <span class="text-xs font-semibold text-gray-500 uppercase tracking-wide">En attente</span>
            <div class="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <svg class="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
          </div>
          <div class="text-2xl font-bold text-gray-900 tabular-nums">{{ s.demandesEnAttente }}</div>
          <p class="text-xs text-gray-500 mt-1">Demandes de congé</p>
        </div>
      </div>

      <!-- Chart -->
      <div class="bg-white border border-gray-200 rounded-xl p-6">
        <div class="flex items-center justify-between mb-5">
          <div>
            <h3 class="text-base font-semibold text-gray-900">Répartition par département</h3>
            <p class="text-sm text-gray-500 mt-0.5">Nombre d'employés par département</p>
          </div>
        </div>
        <app-bar-chart [items]="adminChart()" />
      </div>
    }

    <!-- ============ MANAGER ============ -->
    @else if (manager(); as s) {
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <a routerLink="/employes" class="block bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-blue-300 transition group">
          <div class="flex items-start justify-between mb-3">
            <span class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Mon équipe</span>
            <div class="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
            </div>
          </div>
          <div class="text-2xl font-bold text-gray-900 tabular-nums">{{ s.tailleEquipe }}</div>
          <p class="text-xs text-gray-500 mt-1">Membre{{ s.tailleEquipe > 1 ? 's' : '' }}</p>
        </a>

        <a routerLink="/conges" class="block bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-amber-300 transition relative">
          <div class="flex items-start justify-between mb-3">
            <span class="text-xs font-semibold text-gray-500 uppercase tracking-wide">À traiter</span>
            <div class="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <svg class="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
          </div>
          <div class="text-2xl font-bold text-gray-900 tabular-nums">{{ s.demandesEnAttente }}</div>
          <p class="text-xs text-amber-700 font-medium mt-1">{{ s.demandesEnAttente > 0 ? 'Action requise' : 'Tout traité' }}</p>
        </a>

        <div class="block bg-white border border-gray-200 rounded-xl p-5">
          <div class="flex items-start justify-between mb-3">
            <span class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Approuvées</span>
            <div class="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
          </div>
          <div class="text-2xl font-bold text-gray-900 tabular-nums">{{ s.demandesApprouvees }}</div>
        </div>

        <div class="block bg-white border border-gray-200 rounded-xl p-5">
          <div class="flex items-start justify-between mb-3">
            <span class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Refusées</span>
            <div class="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
              <svg class="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </div>
          </div>
          <div class="text-2xl font-bold text-gray-900 tabular-nums">{{ s.demandesRefusees }}</div>
        </div>
      </div>

      <!-- Chart: distribution -->
      <div class="bg-white border border-gray-200 rounded-xl p-6">
        <div class="flex items-center justify-between mb-5">
          <div>
            <h3 class="text-base font-semibold text-gray-900">Répartition des demandes</h3>
            <p class="text-sm text-gray-500 mt-0.5">Statut des demandes de votre équipe</p>
          </div>
        </div>
        <app-bar-chart [items]="managerChart()" />
      </div>
    }

    <!-- ============ EMPLOYE ============ -->
    @else if (employe(); as s) {
      <!-- Big leave-balance hero card -->
      <div class="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl p-6 mb-6 text-white shadow-lg">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-medium text-emerald-50 uppercase tracking-wide">Solde de congés</span>
          <svg class="w-5 h-5 text-emerald-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
        </div>
        <div class="text-5xl font-bold tabular-nums">{{ s.soldeConge }}</div>
        <p class="text-emerald-50 mt-1">jour{{ s.soldeConge > 1 ? 's' : '' }} disponible{{ s.soldeConge > 1 ? 's' : '' }}</p>
      </div>

      <!-- Smaller request stat cards -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <a routerLink="/conges" class="block bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-amber-300 transition">
          <div class="flex items-start justify-between mb-3">
            <span class="text-xs font-semibold text-gray-500 uppercase tracking-wide">En attente</span>
            <span class="w-2 h-2 rounded-full bg-amber-500"></span>
          </div>
          <div class="text-2xl font-bold text-gray-900 tabular-nums">{{ s.mesDemandesEnAttente }}</div>
        </a>

        <a routerLink="/conges" class="block bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-emerald-300 transition">
          <div class="flex items-start justify-between mb-3">
            <span class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Approuvées</span>
            <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
          </div>
          <div class="text-2xl font-bold text-gray-900 tabular-nums">{{ s.mesDemandesApprouvees }}</div>
        </a>

        <a routerLink="/conges" class="block bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-red-300 transition">
          <div class="flex items-start justify-between mb-3">
            <span class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Refusées</span>
            <span class="w-2 h-2 rounded-full bg-red-500"></span>
          </div>
          <div class="text-2xl font-bold text-gray-900 tabular-nums">{{ s.mesDemandesRefusees }}</div>
        </a>
      </div>

      <!-- Quick action -->
      <div class="bg-white border border-gray-200 rounded-xl p-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h3 class="text-base font-semibold text-gray-900">Besoin d'un congé ?</h3>
          <p class="text-sm text-gray-500 mt-0.5">Soumettez une nouvelle demande à votre manager.</p>
        </div>
        <a routerLink="/conges"
           class="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg shadow-sm transition">
          Faire une demande
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
          </svg>
        </a>
      </div>
    }
  `
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  user = this.auth.user;
  loading = signal(true);
  stats = signal<DashboardStats | null>(null);

  // Type-narrowing helpers (Angular templates can't do `as` casts easily)
  admin    = computed(() => this.stats()?.role === 'Administrateur' ? this.stats() as AdminStats : null);
  manager  = computed(() => this.stats()?.role === 'Manager'        ? this.stats() as ManagerStats : null);
  employe  = computed(() => this.stats()?.role === 'Employe'        ? this.stats() as EmployeStats : null);

  adminChart = computed<BarChartItem[]>(() => {
    const s = this.admin();
    if (!s) return [];
    return s.employesParDepartement
      .map(d => ({ label: d.departement, value: d.count }))
      .sort((a, b) => b.value - a.value);
  });

  managerChart = computed<BarChartItem[]>(() => {
    const s = this.manager();
    if (!s) return [];
    return [
      { label: 'En attente', value: s.demandesEnAttente },
      { label: 'Approuvées', value: s.demandesApprouvees },
      { label: 'Refusées', value: s.demandesRefusees }
    ];
  });

  greeting = computed(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Bonjour';
    if (h < 18) return 'Bon après-midi';
    return 'Bonsoir';
  });

  subtitle = computed(() => {
    switch (this.auth.role()) {
      case 'Administrateur': return 'Aperçu global de l\'activité RH.';
      case 'Manager':        return 'Voici l\'état de votre équipe aujourd\'hui.';
      case 'Employe':        return 'Voici un résumé de vos congés.';
      default:               return '';
    }
  });

  ngOnInit(): void {
    this.dashboardService.getStats().subscribe({
      next: (s) => {
        this.stats.set(s);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Impossible de charger les statistiques.');
        this.loading.set(false);
      }
    });
  }
}
