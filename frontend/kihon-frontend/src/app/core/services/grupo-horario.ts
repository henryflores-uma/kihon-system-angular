
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { GrupoHorarioResponse } from '../../models/grupo-horario-response';
import { GrupoHorarioRequest } from '../../models/grupo-horario-request';

@Injectable({
  providedIn: 'root'
})
export class GrupoHorarioService {

  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/grupo-horarios`;

  // Listar todos los horarios
  listar(): Observable<GrupoHorarioResponse[]> {
    return this.http.get<GrupoHorarioResponse[]>(
      this.apiUrl
    );
  }

  // Listar horarios por grupo
  listarPorGrupo(grupoId: number): Observable<GrupoHorarioResponse[]> {
    return this.http.get<GrupoHorarioResponse[]>(
      `${this.apiUrl}/grupo/${grupoId}`
    );
  }

  // Consultar horario por ID
  buscarPorId(id: number): Observable<GrupoHorarioResponse> {
    return this.http.get<GrupoHorarioResponse>(
      `${this.apiUrl}/${id}`
    );
  }

  // Registrar horario
  crear(datos: GrupoHorarioRequest): Observable<GrupoHorarioResponse> {
    return this.http.post<GrupoHorarioResponse>(
      this.apiUrl,
      datos
    );
  }

  // Actualizar horario
  actualizar(
    id: number,
    datos: GrupoHorarioRequest
  ): Observable<GrupoHorarioResponse> {
    return this.http.put<GrupoHorarioResponse>(
      `${this.apiUrl}/${id}`,
      datos
    );
  }

  // Eliminar horario
  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/${id}`
    );
  }
}
