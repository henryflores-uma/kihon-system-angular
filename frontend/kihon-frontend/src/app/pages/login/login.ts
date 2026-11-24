
import { Component, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService, AuthUser } from '../../core/services/auth';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {

  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  loginForm = this.fb.nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required]
  });

  showPassword = false;
  isSubmitting = false;
  errorMessage = '';

  onSubmit(): void {

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const username = this.loginForm.controls.username.value.trim();
    const password = this.loginForm.controls.password.value;

    if (!username) {
      this.loginForm.controls.username.setErrors({ required: true });
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    this.authService.login(username, password)
      .pipe(
        finalize(() => {
          this.isSubmitting = false;
        })
      )
      .subscribe({
        next: (user: AuthUser) => {
          this.redirectByRole(user.rol);
        },
        error: (error: HttpErrorResponse) => {
          this.handleLoginError(error);
        }
      });
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

 private redirectByRole(rol: AuthUser['rol']): void {

  const routes: Record<AuthUser['rol'], string> = {
    ADMIN: '/admin/admin',
    SECRETARIA: '/secretaria/secretaria',
    SENSEI: '/sensei/sensei',
    ESTUDIANTE: '/estudiante/dashboard'
  };

  this.router.navigateByUrl(routes[rol]);
}

  private handleLoginError(error: HttpErrorResponse): void {

    if (error.status === 401) {
      this.errorMessage = 'Usuario o contraseña incorrectos.';
      return;
    }

    if (error.status === 403) {
      this.errorMessage = 'Tu cuenta no está activa o no tienes permisos.';
      return;
    }

    if (error.status === 0) {
      this.errorMessage =
        'No se pudo conectar con el servidor. Verifica que Spring Boot esté ejecutándose.';
      return;
    }

    this.errorMessage =
      'Ocurrió un error al iniciar sesión. Inténtalo nuevamente.';
  }
}
