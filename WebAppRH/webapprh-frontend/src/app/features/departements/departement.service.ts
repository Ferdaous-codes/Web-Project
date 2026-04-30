import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface DepartementDto {
  id: number;
  nom: string;
  budget: number;
  responsableId: number | null;
  responsableNomComplet: string | null;
  nbEmployes: number;
}

export interface EmployeMiniDto {
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

export interface DepartementDetailsDto {
  id: number;
  nom: string;
  budget: number;
  responsableId: number | null;
  responsableNomComplet: string | null;
  employes: EmployeMiniDto[];
}

export interface CreateDepartementRequest {
  nom: string;
  budget: number;
  responsableId: number | null;
}

export interface UpdateDepartementRequest {
  nom: string;
  budget: number;
  responsableId: number | null;
}

@Injectable({ providedIn: 'root' })
export class DepartementService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/departements`;

  getAll(): Observable<DepartementDto[]> {
    return this.http.get<DepartementDto[]>(this.base);
  }

  getById(id: number): Observable<DepartementDetailsDto> {
    return this.http.get<DepartementDetailsDto>(`${this.base}/${id}`);
  }

  create(req: CreateDepartementRequest): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(this.base, req);
  }

  update(id: number, req: UpdateDepartementRequest): Observable<void> {
    return this.http.put<void>(`${this.base}/${id}`, req);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
