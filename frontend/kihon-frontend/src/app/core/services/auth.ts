
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AuthUser {
    username: string;
    rol: 'ADMIN' | 'SECRETARIA' | 'SENSEI' | 'ESTUDIANTE';
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {

    private readonly apiUrl = environment.apiUrl;

    private credentials: string | null = null;

    private currentUserSubject =
        new BehaviorSubject<AuthUser | null>(null);

    currentUser$ = this.currentUserSubject.asObservable();

    constructor(private http: HttpClient) { }

    // ==========================================
    // AUTENTICACIÓN
    // ==========================================

    login(username: string, password: string): Observable<AuthUser> {

        const credentials = this.encodeCredentials(username, password);

        const headers = new HttpHeaders({
            Authorization: `Basic ${credentials}`
        });

        return this.http.get<AuthUser>(
            `${this.apiUrl}/auth/me`,
            { headers }
        ).pipe(
            tap(user => {
                this.credentials = credentials;
                this.currentUserSubject.next(user);
            })
        );
    }

    // ==========================================
    // CODIFICAR CREDENCIALES UTF-8
    // ==========================================

    private encodeCredentials(username: string, password: string): string {

        const bytes = new TextEncoder().encode(`${username}:${password}`);

        let binary = '';

        bytes.forEach(byte => {
            binary += String.fromCharCode(byte);
        });

        return btoa(binary);
    }

    // ==========================================
    // OBTENER CREDENCIALES
    // ==========================================

    getAuthorizationHeader(): string | null {

        return this.credentials
            ? `Basic ${this.credentials}`
            : null;
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

        return this.credentials !== null &&
            this.currentUser !== null;
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
    // CERRAR SESIÓN
    // ==========================================

    logout(): void {

        this.credentials = null;

        this.currentUserSubject.next(null);
    }
}
