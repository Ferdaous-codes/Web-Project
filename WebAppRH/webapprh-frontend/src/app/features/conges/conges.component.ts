import { Component, OnInit, computed, inject, signal } from '@angular/core';

import { AuthService } from '../../core/auth/auth.service';
import {
  CongeService,
  DemandeCongeDto,
  StatutConge,
  TypeConge
} from './conge.service';
import { CongeFormComponent } from './conge-form.component';
import { RefuseModalComponent } from './refuse-modal.component';
import { DrawerComponent } from '../../shared/ui/drawer.component';
import { ToastService } from '../../shared/ui/toast.service';
import { ConfirmService } from '../../shared/ui/confirm.service';

type Tab = 'EnAttente' | 'Approuve' | 'Refuse' | 'Toutes';

@Component({
  selector: 'app-conges',
  standalone: true,
  imports: [CongeFormComponent, RefuseModalComponent, DrawerComponent],
  template: `
    <!-- Header -->
    <div class="flex items-start justify-between gap-4 mb-6 flex-wrap">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">
          @if (isEmploye()) { Mes congés } @else { Demandes de l'équipe }
        </h1>
        <p class="text-gray-500 mt-1">
          @if (isEmploye()) { Soumettez et suivez vos demandes de congés. }
          @else { Validez ou refusez les demandes de votre équipe. }
        </p>
      </div>
      @if (isEmploye()) {
        <button
          type="button"
          (click)="openCreate()"
          class="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg shadow-sm transition"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Nouvelle demande
        </button>
      }
    </div>

    <!-- Status tabs -->
    <div class="border-b border-gray-200 mb-6">
      <nav class="flex gap-6 overflow-x-auto">
        @for (t of tabs; track t.key) {
          <button
            type="button"
            (click)="activeTab.set(t.key)"
            class="pb-3 px-0.5 text-sm font-medium border-b-2 transition whitespace-nowrap flex items-center gap-2"
            [class]="activeTab() === t.key
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
          >
            {{ t.label }}
            <span
              class="inline-flex items-center justify-center px-1.5 min-w-[20px] h-5 rounded-full text-xs font-medium tabular-nums"
              [class]="activeTab() === t.key ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'"
            >
              {{ countFor(t.key) }}
            </span>
          </button>
        }
      </nav>
    </div>

    <!-- Loading -->
    @if (loading()) {
      <div class="bg-white border border-gray-200 rounded-xl p-12 text-center">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-emerald-600"></div>
        <p class="mt-3 text-sm text-gray-500">Chargement...</p>
      </div>
    }

    <!-- Empty -->
    @else if (visible().length === 0) {
      <div class="bg-white border border-dashed border-gray-300 rounded-xl p-12 text-center">
        <div class="inline-flex w-12 h-12 rounded-xl bg-gray-100 items-center justify-center mb-3">
          <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
        </div>
        <h3 class="text-base font-semibold text-gray-900 mb-1">
          @switch (activeTab()) {
            @case ('EnAttente') { Aucune demande en attente }
            @case ('Approuve')  { Aucune demande approuvée }
            @case ('Refuse')    { Aucune demande refusée }
            @default            { Aucune demande }
          }
        </h3>
        <p class="text-sm text-gray-500">
          @if (isEmploye() && activeTab() === 'Toutes' && all().length === 0) {
            Cliquez sur « Nouvelle demande » pour commencer.
          } @else {
            Rien à afficher pour le moment.
          }
        </p>
      </div>
    }

    <!-- List of cards -->
    @else {
      <div class="space-y-3">
        @for (d of visible(); track d.id) {
          <article
            class="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-gray-300 transition cursor-pointer"
            (click)="openDetails(d)"
          >
            <div class="flex items-start justify-between gap-4 flex-wrap">
              <!-- Left: type, dates, person -->
              <div class="flex items-start gap-3 flex-1 min-w-[200px]">
                <div class="text-2xl flex-shrink-0">{{ typeIcon(d.type) }}</div>
                <div class="min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="text-sm font-semibold text-gray-900">{{ typeLabel(d.type) }}</span>
                    <span class="text-xs text-gray-400">·</span>
                    <span class="text-sm font-medium text-gray-700 tabular-nums">
                      {{ formatRange(d.dateDebut, d.dateFin) }}
                    </span>
                    <span class="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 tabular-nums">
                      {{ durationDays(d) }}j
                    </span>
                  </div>
                  @if (isManager()) {
                    <div class="text-sm text-gray-500 mt-0.5">
                      Demandée par <strong class="text-gray-700">{{ d.employeNomComplet }}</strong>
                      · {{ formatRelative(d.dateSoumission) }}
                    </div>
                  } @else {
                    <div class="text-sm text-gray-500 mt-0.5">
                      Soumise {{ formatRelative(d.dateSoumission) }}
                    </div>
                  }
                </div>
              </div>

              <!-- Right: status + manager actions -->
              <div class="flex items-center gap-2">
                <span [class]="statusBadgeClass(d.statut)" class="px-2.5 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full" [class]="statusDotClass(d.statut)"></span>
                  {{ statusLabel(d.statut) }}
                </span>

                @if (isManager() && d.statut === 'EnAttente') {
                  <button
                    type="button"
                    (click)="approve($event, d)"
                    class="px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition"
                  >
                    Approuver
                  </button>
                  <button
                    type="button"
                    (click)="askRefuse($event, d)"
                    class="px-3 py-1.5 text-xs font-medium rounded-lg bg-white text-red-600 border border-red-200 hover:bg-red-50 transition"
                  >
                    Refuser
                  </button>
                }
              </div>
            </div>

            @if (d.statut === 'Refuse' && d.motifRefus) {
              <div class="mt-3 pl-9 text-xs text-red-700 bg-red-50 border border-red-100 rounded-md px-3 py-2">
                <strong>Motif de refus :</strong> {{ d.motifRefus }}
              </div>
            }
          </article>
        }
      </div>
    }

    <!-- DETAILS DRAWER -->
    <app-drawer
      [(open)]="detailsOpen"
      [title]="detailsRow() ? typeLabel(detailsRow()!.type) : 'Détails'"
      [subtitle]="detailsRow() ? formatRange(detailsRow()!.dateDebut, detailsRow()!.dateFin) : ''"
    >
      @if (detailsRow(); as d) {
        <!-- Status banner -->
        <div [class]="statusBannerClass(d.statut)" class="rounded-lg px-4 py-3 mb-5 flex items-center gap-3">
          <span class="w-2 h-2 rounded-full" [class]="statusDotClass(d.statut)"></span>
          <div class="flex-1">
            <div class="text-sm font-semibold">{{ statusLabel(d.statut) }}</div>
            @if (d.valideParNomComplet) {
              <div class="text-xs opacity-80 mt-0.5">par {{ d.valideParNomComplet }}</div>
            }
          </div>
        </div>

        <dl class="space-y-3 mb-6">
          <div class="flex items-start gap-3">
            <dt class="text-xs font-semibold text-gray-500 uppercase tracking-wide w-28 flex-shrink-0 pt-0.5">Type</dt>
            <dd class="text-sm text-gray-900 flex items-center gap-1.5">{{ typeIcon(d.type) }} {{ typeLabel(d.type) }}</dd>
          </div>
          <div class="flex items-start gap-3">
            <dt class="text-xs font-semibold text-gray-500 uppercase tracking-wide w-28 flex-shrink-0 pt-0.5">Période</dt>
            <dd class="text-sm text-gray-900 tabular-nums">
              {{ formatRange(d.dateDebut, d.dateFin) }}
              <span class="text-gray-500"> · {{ durationDays(d) }} jour{{ durationDays(d) > 1 ? 's' : '' }}</span>
            </dd>
          </div>
          <div class="flex items-start gap-3">
            <dt class="text-xs font-semibold text-gray-500 uppercase tracking-wide w-28 flex-shrink-0 pt-0.5">Employé</dt>
            <dd class="text-sm text-gray-900">{{ d.employeNomComplet }}</dd>
          </div>
          <div class="flex items-start gap-3">
            <dt class="text-xs font-semibold text-gray-500 uppercase tracking-wide w-28 flex-shrink-0 pt-0.5">Soumise</dt>
            <dd class="text-sm text-gray-900">{{ formatDateTime(d.dateSoumission) }}</dd>
          </div>
          @if (d.motifRefus) {
            <div class="flex items-start gap-3">
              <dt class="text-xs font-semibold text-gray-500 uppercase tracking-wide w-28 flex-shrink-0 pt-0.5">Motif</dt>
              <dd class="text-sm text-red-700">{{ d.motifRefus }}</dd>
            </div>
          }
        </dl>
      }

      <ng-container footer>
        @if (detailsRow(); as d) {
          @if (isEmploye() && d.statut === 'EnAttente') {
            <button
              type="button"
              (click)="askDelete(d)"
              class="px-4 py-2 rounded-lg text-sm font-medium text-red-600 bg-white border border-red-200 hover:bg-red-50 transition mr-auto"
            >
              Annuler
            </button>
            <button
              type="button"
              (click)="openEdit(d)"
              class="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition"
            >
              Modifier
            </button>
          }
          @if (isManager() && d.statut === 'EnAttente') {
            <button
              type="button"
              (click)="askRefuseFromDetails(d)"
              class="px-4 py-2 rounded-lg text-sm font-medium text-red-600 bg-white border border-red-200 hover:bg-red-50 transition"
            >
              Refuser
            </button>
            <button
              type="button"
              (click)="approveFromDetails(d)"
              class="px-4 py-2 rounded-lg text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition"
            >
              Approuver
            </button>
          }
        }
      </ng-container>
    </app-drawer>

    <!-- CREATE/EDIT FORM -->
    <app-conge-form
      [(open)]="formOpen"
      [editing]="formEditing()"
      (saved)="onSaved()"
    />

    <!-- REFUSE MODAL -->
    <app-refuse-modal
      [(open)]="refuseOpen"
      (refused)="onRefused($event)"
    />
  `
})
export class CongesComponent implements OnInit {
  private congeService = inject(CongeService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);

  loading = signal(true);
  all = signal<DemandeCongeDto[]>([]);
  activeTab = signal<Tab>('EnAttente');

  detailsOpen = signal(false);
  detailsRow = signal<DemandeCongeDto | null>(null);

  formOpen = signal(false);
  formEditing = signal<DemandeCongeDto | null>(null);

  refuseOpen = signal(false);
  refuseTarget = signal<DemandeCongeDto | null>(null);

  isEmploye = computed(() => this.auth.role() === 'Employe');
  isManager = computed(() => this.auth.role() === 'Manager');

  tabs: { key: Tab; label: string }[] = [
    { key: 'EnAttente', label: 'En attente' },
    { key: 'Approuve',  label: 'Approuvées' },
    { key: 'Refuse',    label: 'Refusées' },
    { key: 'Toutes',    label: 'Toutes' }
  ];

  visible = computed(() => {
    const t = this.activeTab();
    if (t === 'Toutes') return this.all();
    return this.all().filter(d => d.statut === t);
  });

  ngOnInit(): void { this.load(); }

  load() {
    this.loading.set(true);
    this.congeService.getAll().subscribe({
      next: (list) => {
        this.all.set(list);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Impossible de charger les demandes.');
        this.loading.set(false);
      }
    });
  }

  countFor(tab: Tab): number {
    if (tab === 'Toutes') return this.all().length;
    return this.all().filter(d => d.statut === tab).length;
  }

  // --- Actions ---
  openDetails(d: DemandeCongeDto) {
    this.detailsRow.set(d);
    this.detailsOpen.set(true);
  }

  openCreate() {
    this.formEditing.set(null);
    this.formOpen.set(true);
  }

  openEdit(d: DemandeCongeDto) {
    this.formEditing.set(d);
    this.detailsOpen.set(false);
    this.formOpen.set(true);
  }

  approve(event: Event, d: DemandeCongeDto) {
    event.stopPropagation();
    this.doApprove(d);
  }

  approveFromDetails(d: DemandeCongeDto) {
    this.doApprove(d);
  }

  private doApprove(d: DemandeCongeDto) {
    this.congeService.approuver(d.id).subscribe({
      next: () => {
        this.toast.success('Demande approuvée.');
        this.detailsOpen.set(false);
        this.load();
      },
      error: (err: any) => {
        this.toast.error(err?.error?.message ?? 'Erreur lors de l\'approbation.');
      }
    });
  }

  askRefuse(event: Event, d: DemandeCongeDto) {
    event.stopPropagation();
    this.refuseTarget.set(d);
    this.refuseOpen.set(true);
  }

  askRefuseFromDetails(d: DemandeCongeDto) {
    this.refuseTarget.set(d);
    this.refuseOpen.set(true);
  }

  onRefused(motif: string | null) {
    const d = this.refuseTarget();
    if (!d) return;
    this.congeService.refuser(d.id, motif).subscribe({
      next: () => {
        this.toast.success('Demande refusée.');
        this.detailsOpen.set(false);
        this.refuseTarget.set(null);
        this.load();
      },
      error: (err: any) => {
        this.toast.error(err?.error?.message ?? 'Erreur lors du refus.');
      }
    });
  }

  async askDelete(d: DemandeCongeDto) {
    const ok = await this.confirm.ask({
      title: 'Annuler cette demande ?',
      message: 'Votre demande sera supprimée. Cette action est irréversible.',
      confirmLabel: 'Annuler la demande',
      cancelLabel: 'Garder',
      variant: 'danger'
    });
    if (!ok) return;
    this.congeService.delete(d.id).subscribe({
      next: () => {
        this.toast.success('Demande annulée.');
        this.detailsOpen.set(false);
        this.load();
      },
      error: (err: any) => {
        this.toast.error(err?.error?.message ?? 'Erreur lors de la suppression.');
      }
    });
  }

  onSaved() { this.load(); }

  // --- Formatting helpers ---
  typeLabel(t: TypeConge): string {
    return t === 'Annuel' ? 'Congé annuel' : t === 'Maladie' ? 'Congé maladie' : 'Sans solde';
  }
  typeIcon(t: TypeConge): string {
    return t === 'Annuel' ? '🌴' : t === 'Maladie' ? '🏥' : '📋';
  }
  statusLabel(s: StatutConge): string {
    return s === 'EnAttente' ? 'En attente' : s === 'Approuve' ? 'Approuvée' : 'Refusée';
  }
  statusBadgeClass(s: StatutConge): string {
    return s === 'EnAttente' ? 'bg-amber-100 text-amber-800'
         : s === 'Approuve'  ? 'bg-emerald-100 text-emerald-800'
                             : 'bg-red-100 text-red-800';
  }
  statusDotClass(s: StatutConge): string {
    return s === 'EnAttente' ? 'bg-amber-500'
         : s === 'Approuve'  ? 'bg-emerald-500'
                             : 'bg-red-500';
  }
  statusBannerClass(s: StatutConge): string {
    return s === 'EnAttente' ? 'bg-amber-50 border border-amber-200 text-amber-900'
         : s === 'Approuve'  ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                             : 'bg-red-50 border border-red-200 text-red-900';
  }
  durationDays(d: DemandeCongeDto): number {
    const start = new Date(d.dateDebut);
    const end = new Date(d.dateFin);
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }
  formatRange(start: string, end: string): string {
    const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
    const a = new Date(start).toLocaleDateString('fr-FR', opts);
    const b = new Date(end).toLocaleDateString('fr-FR', opts);
    return a === b ? a : `${a} → ${b}`;
  }
  formatDateTime(iso: string): string {
    return new Date(iso).toLocaleString('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }
  formatRelative(iso: string): string {
    const now = Date.now();
    const then = new Date(iso).getTime();
    const diffMs = now - then;
    const minutes = Math.round(diffMs / 60000);
    if (minutes < 1) return 'à l\'instant';
    if (minutes < 60) return `il y a ${minutes} min`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `il y a ${hours}h`;
    const days = Math.round(hours / 24);
    if (days < 30) return `il y a ${days} jour${days > 1 ? 's' : ''}`;
    return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}
