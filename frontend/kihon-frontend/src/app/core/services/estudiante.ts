
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { EstudianteResponse } from '../../models/estudiante-response';

@Injectable({
  providedIn: 'root'
})
export class EstudianteService {

  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/estudiantes`;

  // Listar estudiantes
  listar(estado?: string): Observable<EstudianteResponse[]> {
    let params = new HttpParams();

    if (estado) {
      params = params.set('estado', estado);
    }

    return this.http.get<EstudianteResponse[]>(
      this.apiUrl,
      { params }
    );
  }

  // Consultar estudiante por ID
  buscarPorId(id: number): Observable<EstudianteResponse> {
    return this.http.get<EstudianteResponse>(
      `${this.apiUrl}/${id}`
    );
  }

  // Registrar estudiante
  crear(datos: FormData): Observable<EstudianteResponse> {
    return this.http.post<EstudianteResponse>(
      this.apiUrl,
      datos
    );
  }

  // Actualizar estudiante
  actualizar(
    id: number,
    datos: FormData
  ): Observable<EstudianteResponse> {
    return this.http.put<EstudianteResponse>(
      `${this.apiUrl}/${id}`,
      datos
    );
  }

  // Cambiar estado
  cambiarEstado(
    id: number,
    estado: string
  ): Observable<EstudianteResponse> {
    const params = new HttpParams().set('estado', estado);

    return this.http.patch<EstudianteResponse>(
      `${this.apiUrl}/${id}/estado`,
      null,
      { params }
    );
  }
}
