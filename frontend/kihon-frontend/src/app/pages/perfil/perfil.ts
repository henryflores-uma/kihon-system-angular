
import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  inject
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';

import { UserProfileService } from '../../core/services/user-profile';
import { AuthService } from '../../core/services/auth';
import { UsuarioResponse } from '../../models/usuario-response';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './perfil.html',
  styleUrl: './perfil.scss'
})
export class Perfil implements OnInit, OnDestroy {

  private readonly fb = inject(FormBuilder);
  private readonly profileService = inject(UserProfileService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  profile: UsuarioResponse | null = null;

  profileForm!: FormGroup;
  passwordForm!: FormGroup;

  loading = true;
  saving = false;
  changingPassword = false;

  selectedPhoto: File | null = null;
  photoPreview: string | null = null;

  successMessage = '';
  errorMessage = '';

  passwordSuccessMessage = '';
  passwordErrorMessage = '';

  private originalUsername = '';
  private objectUrl: string | null = null;

  // ==========================================
  // INICIALIZACIÓN
  // ==========================================

  ngOnInit(): void {
    this.initializeForms();
    this.loadProfile();
  }

  ngOnDestroy(): void {
    this.clearPhotoPreview();
  }

  // ==========================================
  // FORMULARIOS
  // ==========================================

  private initializeForms(): void {

    this.profileForm = this.fb.group({
      username: ['', [
        Validators.required,
        Validators.minLength(4),
        Validators.maxLength(30),
        Validators.pattern(/^[a-zA-Z0-9._-]+$/)
      ]],

      nombre: ['', [
        Validators.required,
        Validators.maxLength(50),
        Validators.pattern(/^[\p{L}\s]+$/u)
      ]],

      apellido: ['', [
        Validators.required,
        Validators.maxLength(50),
        Validators.pattern(/^[\p{L}\s]+$/u)
      ]],

      correo: ['', [
        Validators.required,
        Validators.email
      ]]
    });

    this.passwordForm = this.fb.group({
      passwordActual: ['', Validators.required],

      passwordNueva: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(72)
      ]],

      confirmarPassword: ['', Validators.required]
    });
  }

  // ==========================================
  // CARGAR PERFIL
  // ==========================================

  loadProfile(): void {

    this.loading = true;
    this.errorMessage = '';

    this.cdr.detectChanges();

    this.profileService.getProfile().subscribe({

      next: (response: UsuarioResponse) => {

        console.log('Perfil recibido:', response);

        this.reloadProfile(response);
      },

      error: (error: HttpErrorResponse) => {

        console.error('Error al cargar el perfil:', error);

        this.errorMessage = this.getErrorMessage(
          error,
          'No se pudo cargar la información del perfil.'
        );

        this.loading = false;

        this.cdr.detectChanges();
      }
    });
  }

  // ==========================================
  // ACTUALIZAR DATOS EN PANTALLA
  // ==========================================

  reloadProfile(response: UsuarioResponse): void {

    console.log('Actualizando información del perfil...');

    this.profile = response;
    this.originalUsername = response.username;

    this.profileForm.patchValue({
      username: response.username,
      nombre: response.nombre,
      apellido: response.apellido,
      correo: response.correo
    });

    this.clearPhotoPreview();

    this.selectedPhoto = null;
    this.photoPreview = response.foto;

    this.loading = false;
    this.errorMessage = '';

    // Forzar actualización de la vista
    this.cdr.detectChanges();

    console.log('Perfil actualizado:', {
      loading: this.loading,
      profile: this.profile,
      form: this.profileForm.value
    });
  }

  // ==========================================
  // RECARGAR PERFIL DESDE EL SERVIDOR
  // ==========================================

  refreshProfile(): void {

    this.loadProfile();
  }

  // ==========================================
  // FOTO DE PERFIL
  // ==========================================

  onPhotoSelected(event: Event): void {

    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp'
    ];

    if (!allowedTypes.includes(file.type)) {

      this.errorMessage = 'Selecciona una imagen JPG, PNG o WEBP.';

      input.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {

      this.errorMessage = 'La imagen no puede superar los 5 MB.';

      input.value = '';
      return;
    }

    this.clearPhotoPreview();

    this.selectedPhoto = file;
    this.objectUrl = URL.createObjectURL(file);
    this.photoPreview = this.objectUrl;
  }

  private clearPhotoPreview(): void {

    if (this.objectUrl) {

      URL.revokeObjectURL(this.objectUrl);

      this.objectUrl = null;
    }
  }

  get avatarInitial(): string {

    const name = this.profile?.nombre ||
      this.profile?.username ||
      'U';

    return name.charAt(0).toUpperCase();
  }

  // ==========================================
  // ACTUALIZAR PERFIL
  // ==========================================

  saveProfile(): void {

    this.successMessage = '';
    this.errorMessage = '';

    if (this.profileForm.invalid) {

      this.profileForm.markAllAsTouched();

      this.errorMessage = 'Revisa los campos del formulario.';

      return;
    }

    const formData = new FormData();

    formData.append(
      'username',
      this.profileForm.value.username.trim()
    );

    formData.append(
      'nombre',
      this.profileForm.value.nombre.trim()
    );

    formData.append(
      'apellido',
      this.profileForm.value.apellido.trim()
    );

    formData.append(
      'correo',
      this.profileForm.value.correo.trim()
    );

    if (this.selectedPhoto) {
      formData.append('foto', this.selectedPhoto);
    }

    this.saving = true;

    this.profileService.updateProfile(formData).subscribe({

      next: (response: UsuarioResponse) => {

        const usernameChanged =
          response.username !== this.originalUsername;

        this.reloadProfile(response);

        this.saving = false;

        this.cdr.detectChanges();

        if (usernameChanged) {

          this.successMessage =
            'Usuario actualizado. Debes iniciar sesión nuevamente.';

          this.closeSession();

          return;
        }

        this.successMessage =
          'Tu perfil se actualizó correctamente.';
      },

      error: (error: HttpErrorResponse) => {

        console.error('Error al actualizar el perfil:', error);

        this.errorMessage = this.getErrorMessage(
          error,
          'No se pudo actualizar el perfil.'
        );

        this.saving = false;

        this.cdr.detectChanges();
      }
    });
  }

  // ==========================================
  // CAMBIAR CONTRASEÑA
  // ==========================================

  changePassword(): void {

    this.passwordSuccessMessage = '';
    this.passwordErrorMessage = '';

    if (this.passwordForm.invalid) {

      this.passwordForm.markAllAsTouched();

      this.passwordErrorMessage =
        'Completa correctamente todos los campos.';

      return;
    }

    const {
      passwordActual,
      passwordNueva,
      confirmarPassword
    } = this.passwordForm.value;

    if (passwordNueva !== confirmarPassword) {

      this.passwordErrorMessage =
        'Las contraseñas nuevas no coinciden.';

      return;
    }

    if (passwordActual === passwordNueva) {

      this.passwordErrorMessage =
        'La nueva contraseña debe ser diferente a la actual.';

      return;
    }

    this.changingPassword = true;

    this.profileService.changePassword({
      passwordActual,
      passwordNueva
    }).subscribe({

      next: () => {

        this.passwordForm.reset();

        this.changingPassword = false;

        this.passwordSuccessMessage =
          'Contraseña actualizada. Inicia sesión nuevamente.';

        this.cdr.detectChanges();

        this.closeSession();
      },

      error: (error: HttpErrorResponse) => {

        console.error('Error al cambiar la contraseña:', error);

        this.passwordErrorMessage = this.getErrorMessage(
          error,
          'No se pudo cambiar la contraseña.'
        );

        this.changingPassword = false;

        this.cdr.detectChanges();
      }
    });
  }

  // ==========================================
  // CERRAR SESIÓN
  // ==========================================

  private closeSession(): void {

    this.authService.logout().subscribe({

      next: () => {
        this.router.navigateByUrl('/login');
      },

      error: () => {
        this.router.navigateByUrl('/login');
      }
    });
  }

  // ==========================================
  // MENSAJES DE ERROR
  // ==========================================

  private getErrorMessage(
    error: HttpErrorResponse,
    fallback: string
  ): string {

    return error.error?.mensaje ||
      error.error?.message ||
      fallback;
  }

  // ==========================================
  // VALIDACIONES DEL FORMULARIO
  // ==========================================

  hasProfileError(field: string): boolean {

    const control = this.profileForm.get(field);

    return !!control &&
      control.invalid &&
      (control.dirty || control.touched);
  }

  hasPasswordError(field: string): boolean {

    const control = this.passwordForm.get(field);

    return !!control &&
      control.invalid &&
      (control.dirty || control.touched);
  }
}
