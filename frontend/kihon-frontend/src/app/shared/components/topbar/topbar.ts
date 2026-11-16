
import { Component, EventEmitter, OnInit, Output, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { take } from 'rxjs';

import { AuthService, AuthUser } from '../../../core/services/auth';
import { UserProfileService } from '../../../core/services/user-profile';
import { UsuarioResponse } from '../../../models/usuario-response';

@Component({
  selector: 'app-topbar',
  imports: [RouterLink],
  templateUrl: './topbar.html',
  styleUrl: './topbar.scss',
})
export class Topbar implements OnInit {

  private readonly authService = inject(AuthService);
  private readonly userProfileService = inject(UserProfileService);
  private readonly router = inject(Router);

  @Output() toggleSidebar = new EventEmitter<void>();

  currentUser: AuthUser | null = this.authService.currentUser;
  profile: UsuarioResponse | null = null;

  isProfileMenuOpen = false;

  ngOnInit(): void {
    this.loadProfile();
  }

  private loadProfile(): void {
    this.userProfileService.getCurrentUser()
      .pipe(take(1))
      .subscribe({
        next: (user) => {
          this.profile = user;
        },
        error: () => {
          // Se conservan los datos básicos de AuthService
          // si no se puede cargar el perfil completo.
        }
      });
  }

  get displayName(): string {
    if (this.profile) {
      const fullName = `${this.profile.nombre ?? ''} ${this.profile.apellido ?? ''}`.trim();
      return fullName || this.profile.username;
    }

    return this.currentUser?.username ?? 'Usuario';
  }

  get displayRole(): string {
    const role = this.profile?.rol ?? this.currentUser?.rol;

    const roles: Record<string, string> = {
      ADMIN: 'Administrador',
      SECRETARIA: 'Secretaria',
      SENSEI: 'Sensei',
      ESTUDIANTE: 'Estudiante'
    };

    return role ? roles[role] ?? role : 'Usuario';
  }

  get avatarInitial(): string {
    return this.displayName.charAt(0).toUpperCase();
  }

  toggleProfileMenu(): void {
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
  }

  closeProfileMenu(): void {
    this.isProfileMenuOpen = false;
  }

  logout(): void {
    this.authService.logout();
    this.closeProfileMenu();
    this.router.navigateByUrl('/login');
  }
}
