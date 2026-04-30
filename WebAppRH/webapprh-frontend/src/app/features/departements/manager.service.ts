import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface ManagerDto {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  departementId: number | null;
  departementNom: string | null;
  tailleEquipe: number;
}

@Injectable({ providedIn: 'root' })
export class ManagerService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/managers`;

  getAll(): Observable<ManagerDto[]> {
    return this.http.get<ManagerDto[]>(this.base);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
