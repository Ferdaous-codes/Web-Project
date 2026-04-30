import { Component, ElementRef, HostListener, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="min-h-screen bg-gray-50 flex flex-col">
      <!-- Top nav -->
      <header class="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="h-16 flex items-center justify-between gap-4">
            <!-- Brand + nav -->
            <div class="flex items-center gap-8">
              <a routerLink="/" class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                </div>
                <span class="text-base font-semibold text-gray-900 hidden sm:inline">WebAppRH</span>
              </a>

              <nav class="hidden md:flex items-center gap-1">
                <a routerLink="/dashboard"
                   routerLinkActive="bg-emerald-50 text-emerald-700"
                   class="px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition">
                  Tableau de bord
                </a>

                @if (role() === 'Administrateur') {
                  <a routerLink="/employes"
                     routerLinkActive="bg-emerald-50 text-emerald-700"
                     class="px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition">
                    Utilisateurs
                  </a>
                }

                <a routerLink="/departements"
                   routerLinkActive="bg-emerald-50 text-emerald-700"
                   class="px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition">
                  Départements
                </a>

                @if (role() === 'Manager' || role() === 'Employe') {
                  <a routerLink="/conges"
                     routerLinkActive="bg-emerald-50 text-emerald-700"
                     class="px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition">
                    Congés
                  </a>
                }
              </nav>
            </div>

            <!-- User menu -->
            <div class="relative" #menuRoot>
              <button (click)="toggleMenu()"
                      class="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-50 transition">
                <div class="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 text-white flex items-center justify-center text-xs font-semibold">
                  {{ initials() }}
                </div>
                <div class="hidden md:block text-left">
                  <div class="text-sm font-medium text-gray-900">{{ user()?.prenom }} {{ user()?.nom }}</div>
                  <div class="text-xs text-gray-500">{{ user()?.role }}</div>
                </div>
                <svg class="w-4 h-4 text-gray-400 hidden md:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                </svg>
              </button>

              @if (menuOpen()) {
                <div class="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <div class="px-3 py-2 border-b border-gray-100 md:hidden">
                    <div class="text-sm font-medium text-gray-900">{{ user()?.prenom }} {{ user()?.nom }}</div>
                    <div class="text-xs text-gray-500">{{ user()?.email }}</div>
                  </div>
                  <a routerLink="/compte" (click)="closeMenu()"
                     class="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                    </svg>
                    Mon compte
                  </a>
                  <button (click)="logout()"
                          class="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 text-left">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                    </svg>
                    Déconnexion
                  </button>
                </div>
              }
            </div>
          </div>

          <!-- Mobile nav -->
          <nav class="flex md:hidden items-center gap-1 pb-3 overflow-x-auto">
            <a routerLink="/dashboard"
               routerLinkActive="bg-emerald-50 text-emerald-700"
               class="px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-50 transition whitespace-nowrap">
              Tableau de bord
            </a>
            @if (role() === 'Administrateur') {
              <a routerLink="/employes" routerLinkActive="bg-emerald-50 text-emerald-700"
                 class="px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-50 transition whitespace-nowrap">Utilisateurs</a>
            }
            <a routerLink="/departements" routerLinkActive="bg-emerald-50 text-emerald-700"
               class="px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-50 transition whitespace-nowrap">Départements</a>
            @if (role() === 'Manager' || role() === 'Employe') {
              <a routerLink="/conges" routerLinkActive="bg-emerald-50 text-emerald-700"
                 class="px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-50 transition whitespace-nowrap">Congés</a>
            }
          </nav>
        </div>
      </header>

      <!-- Page content -->
      <main class="flex-1">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <router-outlet />
        </div>
      </main>
    </div>
  `
})
export class ShellComponent {
  private auth = inject(AuthService);
  private elementRef = inject(ElementRef);

  user = this.auth.user;
  role = this.auth.role;
  menuOpen = signal(false);

  initials(): string {
    const u = this.user();
    if (!u) return '?';
    const i = (u.prenom?.[0] ?? '') + (u.nom?.[0] ?? '');
    return i.toUpperCase() || '?';
  }

  toggleMenu() { this.menuOpen.update(v => !v); }
  closeMenu() { this.menuOpen.set(false); }

  logout() {
    this.closeMenu();
    this.auth.logout();
  }

  // Close dropdown on outside click
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.menuOpen()) return;
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.closeMenu();
    }
  }
}
