import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { UsuarioResponse } from '../../models/usuario-response';

export interface UsuarioRequest {
  username: string;
  password: string;
  nombre: string;
  apellido: string;
  tipoDocumento: string;
  numeroDocumento: string;
  telefono: string;
  fechaNacimiento: string;
  genero: string;
  correo: string;
}

export interface UsuarioEstudianteRequest {
  estudianteId: number;
  username: string;
  password: string;
  genero: string;
}

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {

  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/usuarios`;

  // Listar usuarios
  listar(estado?: string): Observable<UsuarioResponse[]> {
    let params = new HttpParams();

    if (estado) {
      params = params.set('estado', estado);
    }

    return this.http.get<UsuarioResponse[]>(
      this.apiUrl,
      { params }
    );
  }


  

  // Listar senseis activos
  listarSenseis(): Observable<UsuarioResponse[]> {
    return this.http.get<UsuarioResponse[]>(
      `${this.apiUrl}/senseis`
    );
  }

  // Registrar usuario
  crear(datos: UsuarioRequest): Observable<UsuarioResponse> {
    return this.http.post<UsuarioResponse>(
      this.apiUrl,
      datos
    );
  }


  // Crear cuenta para estudiante
crearCuentaParaEstudiante(
  datos: UsuarioEstudianteRequest
): Observable<UsuarioResponse> {
  return this.http.post<UsuarioResponse>(
    `${this.apiUrl}/estudiante`,
    datos
  );
}

  // Actualizar usuario
  actualizar(
    id: number,
    datos: FormData
  ): Observable<UsuarioResponse> {
    return this.http.put<UsuarioResponse>(
      `${this.apiUrl}/${id}`,
      datos
    );
  }

  // Cambiar estado
  cambiarEstado(
    id: number,
    estado: string
  ): Observable<UsuarioResponse> {
    const params = new HttpParams().set('estado', estado);

    return this.http.patch<UsuarioResponse>(
      `${this.apiUrl}/${id}/estado`,
      null,
      { params }
    );
  }

  // Cambiar rol
  cambiarRol(
    id: number,
    rol: string
  ): Observable<UsuarioResponse> {
    const params = new HttpParams().set('rol', rol);

    return this.http.patch<UsuarioResponse>(
      `${this.apiUrl}/${id}/rol`,
      null,
      { params }
    );
  }

  // Eliminar usuario
  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/${id}`
    );
  }
}
