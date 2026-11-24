
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

import { EstudianteDashboardResponse } from '../../models/estudiante-dashboard-response';
import { AsistenciaResponse } from '../../models/asistencia-response';
import { GrupoEstudianteResponse } from '../../models/grupo-estudiante-response';

@Injectable({
  providedIn: 'root'
})
export class EstudiantePortalService {

  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/estudiante`;

  // Obtener resumen del estudiante
  obtenerResumen(): Observable<EstudianteDashboardResponse> {
    return this.http.get<EstudianteDashboardResponse>(
      `${this.apiUrl}/resumen`
    );
  }

  // Obtener grupos del estudiante
  obtenerGrupos(): Observable<GrupoEstudianteResponse[]> {
    return this.http.get<GrupoEstudianteResponse[]>(
      `${this.apiUrl}/grupos`
    );
  }

  // Obtener todas las asistencias
  obtenerAsistencias(): Observable<AsistenciaResponse[]> {
    return this.http.get<AsistenciaResponse[]>(
      `${this.apiUrl}/asistencias`
    );
  }

  // Obtener asistencias recientes
  obtenerAsistenciasRecientes(): Observable<AsistenciaResponse[]> {
    return this.http.get<AsistenciaResponse[]>(
      `${this.apiUrl}/asistencias/recientes`
    );
  }
}
