import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="min-h-screen flex">
      <!-- Left: branding panel (hidden on mobile) -->
      <div class="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 relative overflow-hidden">
        <div class="absolute inset-0 opacity-20 pointer-events-none">
          <div class="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
          <div class="absolute bottom-0 right-0 w-96 h-96 bg-emerald-300 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
        </div>

        <div class="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
            </div>
            <span class="text-xl font-semibold">WebAppRH</span>
          </div>

          <div class="space-y-4">
            <h1 class="text-4xl font-bold leading-tight">Bienvenue dans votre espace RH</h1>
            <p class="text-lg text-emerald-50 max-w-md">
              Gérez vos collaborateurs, départements et demandes de congés en toute simplicité.
            </p>
          </div>

          <p class="text-sm text-emerald-100/70">© 2026 WebAppRH. Tous droits réservés.</p>
        </div>
      </div>

      <!-- Right: form -->
      <div class="flex-1 flex items-center justify-center p-6 lg:p-12 bg-white">
        <div class="w-full max-w-md">
          <!-- Mobile brand -->
          <div class="lg:hidden mb-8 flex items-center gap-2">
            <div class="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
            </div>
            <span class="text-lg font-semibold text-gray-900">WebAppRH</span>
          </div>

          <h2 class="text-3xl font-bold text-gray-900 mb-2">Connexion</h2>
          <p class="text-gray-500 mb-8">Entrez vos identifiants pour accéder à votre espace.</p>

          <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-5">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                formControlName="email"
                placeholder="vous@exemple.com"
                autocomplete="email"
                class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition placeholder:text-gray-400"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Mot de passe</label>
              <input
                type="password"
                formControlName="motDePasse"
                placeholder="••••••••"
                autocomplete="current-password"
                class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition placeholder:text-gray-400"
              />
            </div>

            @if (error()) {
              <div class="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
                <svg class="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span>{{ error() }}</span>
              </div>
            }

            <button
              type="submit"
              [disabled]="loading() || form.invalid"
              class="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg transition shadow-sm hover:shadow-md"
            >
              @if (loading()) {
                <span>Connexion en cours...</span>
              } @else {
                <span>Se connecter</span>
              }
            </button>
          </form>

          <div class="mt-8 pt-6 border-t border-gray-100">
            <p class="text-xs text-gray-500 text-center">
              Compte de démonstration : admin{{ '@' }}webapprh.tn / Admin123!
            </p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  loading = signal(false);
  error = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    motDePasse: ['', [Validators.required, Validators.minLength(6)]]
  });

  submit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set(null);

    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => this.router.navigateByUrl('/'),
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Erreur de connexion. Vérifiez vos identifiants.');
        this.loading.set(false);
      }
    });
  }
}
