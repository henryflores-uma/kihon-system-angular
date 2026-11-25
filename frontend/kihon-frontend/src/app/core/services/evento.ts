import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

import { EventoResponse } from '../../models/evento-response';
import { EventoRequest } from '../../models/evento-request';

@Injectable({
  providedIn: 'root'
})
export class EventoService {

  private readonly http = inject(HttpClient);

  private readonly apiUrl = `${environment.apiUrl}/eventos`;

  // Listar todos los eventos
  listar(): Observable<EventoResponse[]> {
    return this.http.get<EventoResponse[]>(this.apiUrl);
  }

  // Listar eventos por rango de fechas
  listarPorRango(
    fechaInicio: string,
    fechaFin: string
  ): Observable<EventoResponse[]> {

    const params = new HttpParams()
      .set('fechaInicio', fechaInicio)
      .set('fechaFin', fechaFin);

    return this.http.get<EventoResponse[]>(
      this.apiUrl,
      { params }
    );
  }

  // Buscar evento por ID
  buscarPorId(id: number): Observable<EventoResponse> {
    return this.http.get<EventoResponse>(
      `${this.apiUrl}/${id}`
    );
  }

  // Crear evento
  crear(datos: EventoRequest): Observable<EventoResponse> {
    return this.http.post<EventoResponse>(
      this.apiUrl,
      datos
    );
  }

  // Actualizar evento
  actualizar(
    id: number,
    datos: EventoRequest
  ): Observable<EventoResponse> {
    return this.http.put<EventoResponse>(
      `${this.apiUrl}/${id}`,
      datos
    );
  }

  // Cambiar estado
  cambiarEstado(
    id: number,
    estado: string
  ): Observable<EventoResponse> {

    const params = new HttpParams()
      .set('estado', estado);

    return this.http.patch<EventoResponse>(
      `${this.apiUrl}/${id}/estado`,
      null,
      { params }
    );
  }

  // Eliminar evento
  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/${id}`
    );
  }
}