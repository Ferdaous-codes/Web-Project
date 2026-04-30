import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface EmployeDto {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  poste: string;
  soldeConge: number;
  departementId: number | null;
  departementNom: string | null;
  managerId: number | null;
  managerNomComplet: string | null;
}

export interface EmployeDetailsDto extends EmployeDto {
  nbDemandesConge: number;
}

export type TypeUtilisateur = 'Employe' | 'Manager';

export interface CreateEmployeRequest {
  typeUtilisateur: TypeUtilisateur;
  nom: string;
  prenom: string;
  email: string;
  motDePasse: string;
  poste: string | null;
  soldeConge: number | null;
  departementId: number | null;
  managerId: number | null;
}

export interface UpdateEmployeRequest {
  nom: string;
  prenom: string;
  email: string;
  poste: string;
  soldeConge: number;
  departementId: number | null;
  managerId: number | null;
}

@Injectable({ providedIn: 'root' })
export class EmployeService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/employes`;

  getAll(): Observable<EmployeDto[]> {
    return this.http.get<EmployeDto[]>(this.base);
  }

  getById(id: number): Observable<EmployeDetailsDto> {
    return this.http.get<EmployeDetailsDto>(`${this.base}/${id}`);
  }

  create(req: CreateEmployeRequest): Observable<{ id: number; type: string }> {
    return this.http.post<{ id: number; type: string }>(this.base, req);
  }

  update(id: number, req: UpdateEmployeRequest): Observable<void> {
    return this.http.put<void>(`${this.base}/${id}`, req);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
