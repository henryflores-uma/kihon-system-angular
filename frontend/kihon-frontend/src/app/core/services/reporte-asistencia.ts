
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

import { ReporteAsistenciaResponse } from '../../models/reporte-asistencia-response';

@Injectable({
  providedIn: 'root'
})
export class ReporteAsistenciaService {

  private readonly http = inject(HttpClient);

  private readonly apiUrl =
    `${environment.apiUrl}/reportes/asistencias`;

  // Reporte diario
  obtenerReporteDiario(
    fecha: string
  ): Observable<ReporteAsistenciaResponse> {

    const params = new HttpParams()
      .set('fecha', fecha);

    return this.http.get<ReporteAsistenciaResponse>(
      `${this.apiUrl}/diario`,
      { params }
    );
  }

  // Reporte semanal
  obtenerReporteSemanal(
    inicio: string,
    fin: string
  ): Observable<ReporteAsistenciaResponse> {

    const params = new HttpParams()
      .set('inicio', inicio)
      .set('fin', fin);

    return this.http.get<ReporteAsistenciaResponse>(
      `${this.apiUrl}/semanal`,
      { params }
    );
  }

  // Reporte mensual
  obtenerReporteMensual(
    anio: number,
    mes: number
  ): Observable<ReporteAsistenciaResponse> {

    const params = new HttpParams()
      .set('anio', anio)
      .set('mes', mes);

    return this.http.get<ReporteAsistenciaResponse>(
      `${this.apiUrl}/mensual`,
      { params }
    );
  }

  // Reporte por estudiante
  obtenerReportePorEstudiante(
    estudianteId: number
  ): Observable<ReporteAsistenciaResponse> {

    return this.http.get<ReporteAsistenciaResponse>(
      `${this.apiUrl}/estudiante/${estudianteId}`
    );
  }

  // Reporte por grupo
  obtenerReportePorGrupo(
    grupoId: number
  ): Observable<ReporteAsistenciaResponse> {

    return this.http.get<ReporteAsistenciaResponse>(
      `${this.apiUrl}/grupo/${grupoId}`
    );
  }

}
