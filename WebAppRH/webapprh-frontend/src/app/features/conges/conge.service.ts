import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

export type TypeConge = 'Annuel' | 'Maladie' | 'SansSolde';
export type StatutConge = 'EnAttente' | 'Approuve' | 'Refuse';

export interface DemandeCongeDto {
  id: number;
  dateDebut: string;          // ISO string
  dateFin: string;
  type: TypeConge;
  statut: StatutConge;
  motifRefus: string | null;
  dateSoumission: string;
  employeId: number;
  employeNomComplet: string;
  valideParId: number | null;
  valideParNomComplet: string | null;
}

export interface CreateDemandeCongeRequest {
  dateDebut: string;
  dateFin: string;
  type: TypeConge;
}

export interface UpdateDemandeCongeRequest {
  dateDebut: string;
  dateFin: string;
  type: TypeConge;
}

export interface RefuserRequest {
  motif: string | null;
}

@Injectable({ providedIn: 'root' })
export class CongeService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/demandes-conge`;

  getAll(): Observable<DemandeCongeDto[]> {
    return this.http.get<DemandeCongeDto[]>(this.base);
  }

  create(req: CreateDemandeCongeRequest): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(this.base, req);
  }

  update(id: number, req: UpdateDemandeCongeRequest): Observable<void> {
    return this.http.put<void>(`${this.base}/${id}`, req);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  approuver(id: number): Observable<void> {
    return this.http.post<void>(`${this.base}/${id}/approuver`, {});
  }

  refuser(id: number, motif: string | null): Observable<void> {
    return this.http.post<void>(`${this.base}/${id}/refuser`, { motif });
  }
}
