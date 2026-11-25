import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

import { AsistenciaRequest } from '../../models/asistencia-request';
import { AsistenciaResponse } from '../../models/asistencia-response';

@Injectable({
  providedIn: 'root'
})
export class AsistenciaService {

  private readonly http = inject(HttpClient);

  private readonly apiUrl =
    `${environment.apiUrl}/asistencias`;

  // Registrar asistencia
  registrar(datos: AsistenciaRequest): Observable<AsistenciaResponse> {
    return this.http.post<AsistenciaResponse>(
      this.apiUrl,
      datos
    );
  }

  // Actualizar asistencia
  actualizar(
    id: number,
    datos: AsistenciaRequest
  ): Observable<AsistenciaResponse> {
    return this.http.put<AsistenciaResponse>(
      `${this.apiUrl}/${id}`,
      datos
    );
  }

  // Listar asistencias por grupo y fecha
  listarPorGrupoYFecha(
    grupoId: number,
    fecha: string
  ): Observable<AsistenciaResponse[]> {
    return this.http.get<AsistenciaResponse[]>(
      `${this.apiUrl}/grupo/${grupoId}/fecha/${fecha}`
    );
  }

  // Listar asistencias por estudiante
  listarPorEstudiante(
    estudianteId: number
  ): Observable<AsistenciaResponse[]> {
    return this.http.get<AsistenciaResponse[]>(
      `${this.apiUrl}/estudiante/${estudianteId}`
    );
  }

  // Listar asistencias por grupo
  listarPorGrupo(
    grupoId: number
  ): Observable<AsistenciaResponse[]> {
    return this.http.get<AsistenciaResponse[]>(
      `${this.apiUrl}/grupo/${grupoId}`
    );
  }

  // Listar asistencias por fecha
  listarPorFecha(
    fecha: string
  ): Observable<AsistenciaResponse[]> {
    return this.http.get<AsistenciaResponse[]>(
      `${this.apiUrl}/fecha/${fecha}`
    );
  }
}