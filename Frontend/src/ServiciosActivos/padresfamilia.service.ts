import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Ajusta esta URL según tu configuración de environment
const API_URL = 'http://localhost:3000/api'; 

/**
 * DTO que coincide con la estructura que devuelve el Backend (ServiciosActivos/Padres.ts)
 */
export interface ResumenHijoDTO {
  uid: string;
  nombre: string;
  apellidos: string;
  fotoUrl?: string;
  detalleAcademico: {
    matricula: string;
    grado: number;
    grupo: string;
    estatus: string;
  };
  resumenCiclo: {
    ciclo: string;
    promedioGeneral: string | number;
    materiasReprobadas: number;
    totalMaterias: number;
  } | null;
}

@Injectable({
  providedIn: 'root'
})
export class PadresService {
  
  private http = inject(HttpClient);

  /**
   * Consulta el Dashboard del Padre.
   * El token de autenticación se inyecta automáticamente gracias a tu 'auth.interceptor.ts'.
   * @returns Lista de hijos con su resumen académico.
   */
  consultarHijos(): Observable<ResumenHijoDTO[]> {
    return this.http.get<ResumenHijoDTO[]>(`${API_URL}/tutores/mis-hijos`);
  }

  /**
   * Verifica si el tutor tiene permiso sobre un estudiante antes de realizar acciones sensibles.
   * (Útil para pre-validar en la UI antes de intentar descargar).
   */
  validarAcceso(estudianteUid: string): Observable<{ autorizado: boolean }> {
    return this.http.get<{ autorizado: boolean }>(`${API_URL}/tutores/validar-acceso/${estudianteUid}`);
  }

  /**
   * Solicita la descarga del PDF de la boleta.
   * Se conecta al servicio de reportes, pero validado por el rol de tutor.
   */
  descargarBoleta(estudianteUid: string): Observable<Blob> {
    // Nota: Asegúrate de tener este endpoint en tu backend de reportes o usar el genérico validado
    return this.http.get(`${API_URL}/reportes/boleta-pdf/${estudianteUid}`, {
      responseType: 'blob'
    });
  }
}