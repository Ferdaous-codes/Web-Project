import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface AdminStats {
  role: 'Administrateur';
  totalEmployes: number;
  totalManagers: number;
  totalDepartements: number;
  demandesEnAttente: number;
  employesParDepartement: { departement: string; count: number }[];
}

export interface ManagerStats {
  role: 'Manager';
  tailleEquipe: number;
  demandesEnAttente: number;
  demandesApprouvees: number;
  demandesRefusees: number;
}

export interface EmployeStats {
  role: 'Employe';
  soldeConge: number;
  mesDemandesEnAttente: number;
  mesDemandesApprouvees: number;
  mesDemandesRefusees: number;
}

export type DashboardStats = AdminStats | ManagerStats | EmployeStats;

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/dashboard`;

  getStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.base}/stats`);
  }
}
