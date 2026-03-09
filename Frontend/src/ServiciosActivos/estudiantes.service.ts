import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BoletaDataDTO, KardexDTO, PerfilUsuarioDTO } from './../ModelosActivos/ModelosAplicacion.model'; // Ajusta la ruta a tu modelo

@Injectable({
  providedIn: 'root',
})
export class EstudiantesService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/estudiantes';

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  /**
   * Envía el archivo CSV al backend para carga masiva.
   * Coincide con la ruta: POST /api/estudiantes/masivo
   * Campo del archivo: 'archivoCsv'
   */
  cargarMasiva(archivo: File) {
    const formData = new FormData();
    formData.append('archivoCsv', archivo); // El nombre debe coincidir con el backend

    return this.http.post<any>(`${this.apiUrl}/masivo`, formData);
  }

  /**
   * (RF 1.4) Carga Masiva de Estudiantes vía CSV.
   * Requiere FormData para enviar el archivo.
   */
  subirCargaMasiva(archivo: File): Observable<any> {
    const formData = new FormData();
    formData.append('archivoCsv', archivo); // Debe coincidir con el backend: upload.single('archivoCsv')

    return this.http.post(`${this.apiUrl}/masivo`, formData, {
      headers: this.getHeaders(), // No content-type, el navegador lo pone automático en FormData
    });
  }

  /**
   * Obtiene todos los estudiantes (con ordenamiento opcional).
   */
  getEstudiantes(sortBy?: string, order?: 'asc' | 'desc'): Observable<PerfilUsuarioDTO[]> {
    let params = new HttpParams();
    if (sortBy) params = params.set('sortBy', sortBy);
    if (order) params = params.set('order', order);

    return this.http.get<PerfilUsuarioDTO[]>(this.apiUrl, {
      headers: this.getHeaders(),
      params,
    });
  }

  // Obtener estudiantes inactivos (Bajas)
  getEstudiantesBaja(sortBy?: string, order?: string) {
    let params = new HttpParams();
    if (sortBy) params = params.set('sortBy', sortBy);
    if (order) params = params.set('order', order);
    return this.http.get<PerfilUsuarioDTO[]>(`${this.apiUrl}/baja`, { params });
  }
  /**
   * Busca un estudiante por matrícula.
   */
  getPorMatricula(matricula: string): Observable<PerfilUsuarioDTO> {
    return this.http.get<PerfilUsuarioDTO>(`${this.apiUrl}/matricula/${matricula}`, {
      headers: this.getHeaders(),
    });
  }

  getPorUID(matricula: string): Observable<PerfilUsuarioDTO> {
    return this.http.get<PerfilUsuarioDTO>(`${this.apiUrl}/uid/${matricula}`, {
      headers: this.getHeaders(),
    });
  }

  /**
   * Actualiza datos de persona o rol de un estudiante.
   */
  updateEstudiante(uid: string, datos: any): Observable<PerfilUsuarioDTO> {
    return this.http.put<PerfilUsuarioDTO>(`${this.apiUrl}/${uid}`, datos, {
      headers: this.getHeaders(),
    });
  }

  darDeBaja(uid: string): Observable<any> {
    // Nota: Usamos la URL base de usuarios porque ahí definiste la ruta de baja en tu backend
    return this.http.patch(
      `http://localhost:3000/api/usuarios/${uid}/baja`,
      {},
      {
        headers: this.getHeaders(),
      }
    );
  }

  crearEstudiante(datos: any): Observable<any> {
    // Nota: Apuntamos a /api/usuarios porque es el encargado de crear la cuenta y el rol
    return this.http.post('http://localhost:3000/api/usuarios', datos, {
      headers: this.getHeaders(),
    });
  }

  getBoletaData(uid: string): Observable<BoletaDataDTO> {
    // Llamamos al endpoint que creamos en el paso anterior
    // Endpoint sugerido: GET /api/estudiantes/:uid/boleta
    return this.http.get<BoletaDataDTO>(`${this.apiUrl}/${uid}/boleta`);
  }

  getKardex(uid: string): Observable<KardexDTO> {
    // Endpoint sugerido: GET /api/estudiantes/:uid/kardex
    return this.http.get<KardexDTO>(`${this.apiUrl}/${uid}/kardex`);
  }

  buscarEstudiantesGlobal(termino: string) {
  return this.http.get<PerfilUsuarioDTO[]>(`${this.apiUrl}/buscar/global?q=${termino}`);
}
}
