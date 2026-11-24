
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, switchMap, tap } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface AuthUser {
    username: string;
    rol: 'ADMIN' | 'SECRETARIA' | 'SENSEI' | 'ESTUDIANTE';
}

interface CsrfResponse {
    token: string;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {

    private readonly apiUrl = environment.apiUrl;

    private csrfToken: string | null = null;

    private currentUserSubject =
        new BehaviorSubject<AuthUser | null>(null);

    currentUser$ = this.currentUserSubject.asObservable();

    constructor(private http: HttpClient) { }

    // ==========================================
    // AUTENTICACIÓN CON SESIÓN HTTP
    // ==========================================

    login(username: string, password: string): Observable<AuthUser> {

        // 1. Obtener token CSRF antes del login
        return this.obtenerCsrf().pipe(

            // 2. Enviar credenciales mediante POST
            switchMap(token => {

                const body = new HttpParams()
                    .set('username', username)
                    .set('password', password);

                const headers = new HttpHeaders({
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-CSRF-TOKEN': token
                });

                return this.http.post<AuthUser>(
                    `${this.apiUrl}/auth/login`,
                    body.toString(),
                    {
                        headers,
                        withCredentials: true
                    }
                );
            }),

            // 3. Spring renueva el token CSRF después del login.
            // Lo solicitamos nuevamente.
            switchMap(() => this.obtenerCsrf()),

            // 4. Obtener el usuario autenticado mediante la sesión
            switchMap(() => {

                return this.http.get<AuthUser>(
                    `${this.apiUrl}/auth/me`,
                    {
                        withCredentials: true
                    }
                );
            }),

            // 5. Guardar el usuario autenticado
            tap(user => {
                this.currentUserSubject.next(user);
            })
        );
    }

    // ==========================================
    // OBTENER TOKEN CSRF
    // ==========================================

    obtenerCsrf(): Observable<string> {

        return this.http.get<CsrfResponse>(
            `${this.apiUrl}/auth/csrf`,
            {
                withCredentials: true
            }
        ).pipe(
            tap(response => {
                this.csrfToken = response.token;
            }),
            switchMap(response => {
                return new Observable<string>(subscriber => {
                    subscriber.next(response.token);
                    subscriber.complete();
                });
            })
        );
    }

    // ==========================================
    // OBTENER TOKEN PARA LAS PETICIONES
    // ==========================================

    getCsrfToken(): string | null {
        return this.csrfToken;
    }

    // ==========================================
    // COMPATIBILIDAD CON SERVICIOS EXISTENTES
    // ==========================================

    getAuthorizationHeader(): string | null {
        return null;
    }

    // ==========================================
    // USUARIO ACTUAL
    // ==========================================

    get currentUser(): AuthUser | null {
        return this.currentUserSubject.value;
    }

    // ==========================================
    // COMPROBAR AUTENTICACIÓN
    // ==========================================

    isAuthenticated(): boolean {
        return this.currentUser !== null;
    }

    // ==========================================
    // COMPROBAR ROL
    // ==========================================

    hasRole(roles: string | string[]): boolean {

        const user = this.currentUser;

        if (!user) {
            return false;
        }

        const allowedRoles = Array.isArray(roles)
            ? roles
            : [roles];

        return allowedRoles.includes(user.rol);
    }

    // ==========================================
    // CERRAR SESIÓN LOCAL
    // ==========================================

    logout(): void {

        this.csrfToken = null;

        this.currentUserSubject.next(null);
    }
}
