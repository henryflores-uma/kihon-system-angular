
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { UsuarioResponse } from '../../models/usuario-response';

@Injectable({
    providedIn: 'root'
})
export class UserProfileService {

    private readonly http = inject(HttpClient);
    private readonly apiUrl = environment.apiUrl;

    getCurrentUser(): Observable<UsuarioResponse> {
        return this.http.get<UsuarioResponse>(
            `${this.apiUrl}/usuarios/me`
        );
    }
}
