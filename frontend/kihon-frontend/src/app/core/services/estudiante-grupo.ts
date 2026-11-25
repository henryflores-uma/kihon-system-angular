import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

import { EstudianteGrupoRequest } from '../../models/estudiante-grupo-request';
import { EstudianteGrupoResponse } from '../../models/estudiante-grupo-response';

@Injectable({
  providedIn: 'root'
})
export class EstudianteGrupoService {

  private readonly http = inject(HttpClient);

  private readonly apiUrl =
    `${environment.apiUrl}/estudiantes-grupos`;

  // Listar todas las inscripciones
  listar(): Observable<EstudianteGrupoResponse[]> {
    return this.http.get<EstudianteGrupoResponse[]>(
      this.apiUrl
    );
  }

  // Inscribir estudiante en un grupo
  inscribir(
    datos: EstudianteGrupoRequest
  ): Observable<EstudianteGrupoResponse> {
    return this.http.post<EstudianteGrupoResponse>(
      this.apiUrl,
      datos
    );
  }

  // Listar inscripciones por estudiante
  listarPorEstudiante(
    estudianteId: number
  ): Observable<EstudianteGrupoResponse[]> {
    return this.http.get<EstudianteGrupoResponse[]>(
      `${this.apiUrl}/estudiante/${estudianteId}`
    );
  }

  // Listar inscripciones por grupo
  listarPorGrupo(
    grupoId: number
  ): Observable<EstudianteGrupoResponse[]> {
    return this.http.get<EstudianteGrupoResponse[]>(
      `${this.apiUrl}/grupo/${grupoId}`
    );
  }

  // Cambiar grupo
  cambiarGrupo(
    asignacionId: number,
    nuevoGrupoId: number
  ): Observable<EstudianteGrupoResponse> {
    return this.http.patch<EstudianteGrupoResponse>(
      `${this.apiUrl}/asignacion/${asignacionId}/grupo/${nuevoGrupoId}`,
      null
    );
  }

  // Activar o inactivar inscripción
  cambiarEstado(
    id: number,
    estado: string
  ): Observable<EstudianteGrupoResponse> {

    const params = new HttpParams()
      .set('estado', estado);

    return this.http.patch<EstudianteGrupoResponse>(
      `${this.apiUrl}/${id}/estado`,
      null,
      { params }
    );
  }
}