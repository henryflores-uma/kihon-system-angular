
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { GrupoResponse } from '../../models/grupo-response';
import { GrupoRequest } from '../../models/grupo-request';

@Injectable({
  providedIn: 'root'
})
export class GrupoService {

  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/grupos`;

  listar(estado?: string): Observable<GrupoResponse[]> {
    let params = new HttpParams();

    if (estado) {
      params = params.set('estado', estado);
    }

    return this.http.get<GrupoResponse[]>(this.apiUrl, { params });
  }

  buscarPorId(id: number): Observable<GrupoResponse> {
    return this.http.get<GrupoResponse>(`${this.apiUrl}/${id}`);
  }

  crear(datos: GrupoRequest): Observable<GrupoResponse> {
    return this.http.post<GrupoResponse>(this.apiUrl, datos);
  }

  actualizar(id: number, datos: GrupoRequest): Observable<GrupoResponse> {
    return this.http.put<GrupoResponse>(`${this.apiUrl}/${id}`, datos);
  }

  cambiarEstado(id: number, estado: string): Observable<GrupoResponse> {
    const params = new HttpParams().set('estado', estado);

    return this.http.patch<GrupoResponse>(
      `${this.apiUrl}/${id}/estado`,
      null,
      { params }
    );
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
