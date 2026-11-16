
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

import { ApoderadoResponse } from '../../models/apoderado-response';
import { EstudianteApoderadoResponse } from '../../models/estudiante-apoderado-response';

@Injectable({
  providedIn: 'root'
})
export class ApoderadoService {

  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/apoderados`;

  listarPorEstudiante(
    estudianteId: number
  ): Observable<EstudianteApoderadoResponse[]> {
    return this.http.get<EstudianteApoderadoResponse[]>(
      `${this.apiUrl}/estudiante/${estudianteId}`
    );
  }

  crear(
    estudianteId: number,
    datos: FormData
  ): Observable<EstudianteApoderadoResponse> {
    return this.http.post<EstudianteApoderadoResponse>(
      `${this.apiUrl}/estudiante/${estudianteId}`,
      datos
    );
  }

  actualizar(
    apoderadoId: number,
    datos: FormData
  ): Observable<ApoderadoResponse> {
    return this.http.put<ApoderadoResponse>(
      `${this.apiUrl}/${apoderadoId}`,
      datos
    );
  }

  actualizarParentesco(
    estudianteId: number,
    apoderadoId: number,
    parentesco: string
  ): Observable<EstudianteApoderadoResponse> {

    const params = new HttpParams()
      .set('parentesco', parentesco);

    return this.http.put<EstudianteApoderadoResponse>(
      `${this.apiUrl}/estudiante/${estudianteId}/relacion/${apoderadoId}`,
      null,
      { params }
    );
  }
}
