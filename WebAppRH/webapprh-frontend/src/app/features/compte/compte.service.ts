import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Role } from '../../core/auth/auth.service';

export interface CompteDto {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: Role;
  actif: boolean;
  typeUtilisateur: string;
}

export interface UpdateProfilRequest {
  nom: string;
  prenom: string;
  email: string;
}

export interface ChangePasswordRequest {
  motDePasseActuel: string;
  nouveauMotDePasse: string;
  confirmation: string;
}

@Injectable({ providedIn: 'root' })
export class CompteService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/compte`;

  getMine(): Observable<CompteDto> {
    return this.http.get<CompteDto>(this.base);
  }

  updateProfil(req: UpdateProfilRequest): Observable<void> {
    return this.http.put<void>(`${this.base}/profil`, req);
  }

  changePassword(req: ChangePasswordRequest): Observable<void> {
    return this.http.put<void>(`${this.base}/password`, req);
  }
}
