import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Materia, Periodo } from './../ModelosActivos/ModelosAplicacion.model';

@Injectable({
  providedIn: 'root'
})
export class CatalogosService {
  private http = inject(HttpClient);
  private apiMaterias = 'http://localhost:3000/api/materias';
  private apiPeriodos = 'http://localhost:3000/api/periodos';

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  // ================= MATERIAS =================

  getAllMaterias(): Observable<Materia[]> {
    return this.http.get<Materia[]>(this.apiMaterias, { headers: this.getHeaders() });
  }

  crearMateria(materia: Partial<Materia>): Observable<Materia> {
    return this.http.post<Materia>(this.apiMaterias, materia, { headers: this.getHeaders() });
  }

  updateMateria(id: string, materia: Partial<Materia>): Observable<Materia> {
    return this.http.put<Materia>(`${this.apiMaterias}/${id}`, materia, { headers: this.getHeaders() });
  }

  deleteMateria(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiMaterias}/${id}`, { headers: this.getHeaders() });
  }

  // ================= PERIODOS =================

  getAllPeriodos(): Observable<Periodo[]> {
    return this.http.get<Periodo[]>(this.apiPeriodos, { headers: this.getHeaders() });
  }

  crearPeriodo(periodo: Partial<Periodo>): Observable<Periodo> {
    return this.http.post<Periodo>(this.apiPeriodos, periodo, { headers: this.getHeaders() });
  }

  updatePeriodo(id: string, periodo: Partial<Periodo>): Observable<Periodo> {
    return this.http.put<Periodo>(`${this.apiPeriodos}/${id}`, periodo, { headers: this.getHeaders() });
  }

  deletePeriodo(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiPeriodos}/${id}`, { headers: this.getHeaders() });
  }
}