
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { UsuarioResponse } from '../../models/usuario-response';

export interface CambiarPasswordRequest {
  passwordActual: string;
  passwordNueva: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserProfileService {

  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  // ==========================================
  // OBTENER INFORMACIÓN BÁSICA DEL USUARIO
  // Se conserva para el Topbar existente.
  // ==========================================

  getCurrentUser(): Observable<UsuarioResponse> {
    return this.http.get<UsuarioResponse>(
      `${this.apiUrl}/usuarios/me`
    );
  }

  // ==========================================
  // OBTENER PERFIL COMPLETO
  // ==========================================

  getProfile(): Observable<UsuarioResponse> {
    return this.http.get<UsuarioResponse>(
      `${this.apiUrl}/auth/perfil`
    );
  }

  // ==========================================
  // ACTUALIZAR PERFIL
  // ==========================================

  updateProfile(formData: FormData): Observable<UsuarioResponse> {
    return this.http.put<UsuarioResponse>(
      `${this.apiUrl}/auth/perfil`,
      formData
    );
  }

  // ==========================================
  // CAMBIAR CONTRASEÑA
  // ==========================================

  changePassword(
    request: CambiarPasswordRequest
  ): Observable<void> {
    return this.http.patch<void>(
      `${this.apiUrl}/auth/perfil/password`,
      request
    );
  }
}
