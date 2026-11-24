
import {
  Component,
  OnInit,
  inject,
  ChangeDetectorRef
} from '@angular/core';

import { HttpErrorResponse } from '@angular/common/http';

import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { EstudiantePortalService } from '../../../core/services/estudiante-portal';
import { AuthService } from '../../../core/services/auth';

import { EstudianteDashboardResponse } from '../../../models/estudiante-dashboard-response';
import { GrupoEstudianteResponse } from '../../../models/grupo-estudiante-response';
import { AsistenciaResponse } from '../../../models/asistencia-response';

interface LoadResult<T> {
  data: T;
  failed: boolean;
}

@Component({
  selector: 'app-estudiante-dashboard',
  imports: [],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class EstudianteDashboard implements OnInit {

  private readonly estudianteService = inject(EstudiantePortalService);
  private readonly authService = inject(AuthService);
  private readonly cdr = inject(ChangeDetectorRef);

  resumen: EstudianteDashboardResponse | null = null;
  grupos: GrupoEstudianteResponse[] = [];
  asistencias: AsistenciaResponse[] = [];
  asistenciasRecientes: AsistenciaResponse[] = [];

  totalAsistencias = 0;
  presentes = 0;
  tardanzas = 0;
  ausencias = 0;
  justificados = 0;

  progreso: number | null = null;

  isLoading = true;
  errorMessage = '';

  username = 'Estudiante';

  ngOnInit(): void {
    this.username = this.authService.currentUser?.username ?? 'Estudiante';
    this.loadDashboard();
  }

  private loadDashboard(): void {

    forkJoin({
      resumen: this.safeRequest<EstudianteDashboardResponse | null>(
        this.estudianteService.obtenerResumen(),
        null
      ),

      grupos: this.safeRequest(
        this.estudianteService.obtenerGrupos(),
        [] as GrupoEstudianteResponse[]
      ),

      asistencias: this.safeRequest(
        this.estudianteService.obtenerAsistencias(),
        [] as AsistenciaResponse[]
      ),

      recientes: this.safeRequest(
        this.estudianteService.obtenerAsistenciasRecientes(),
        [] as AsistenciaResponse[]
      )
    }).subscribe({

      next: result => {

        this.resumen = result.resumen.data;
        this.grupos = result.grupos.data;
        this.asistencias = result.asistencias.data;
        this.asistenciasRecientes = result.recientes.data;

        this.calcularAsistencias();

        if (
          result.resumen.failed ||
          result.grupos.failed ||
          result.asistencias.failed ||
          result.recientes.failed
        ) {
          this.errorMessage =
            'No se pudieron cargar algunos datos del dashboard. Verifica la conexión con el servidor.';
        }

        this.isLoading = false;

        // Notificar a Angular que debe actualizar la vista.
        this.cdr.markForCheck();
      },

      error: (error: HttpErrorResponse) => {

        this.errorMessage = error.status === 0
          ? 'No se pudo conectar con el servidor Spring Boot.'
          : 'Ocurrió un error al cargar el dashboard.';

        this.isLoading = false;

        // Actualizar la vista también cuando ocurre un error.
        this.cdr.markForCheck();
      }
    });
  }

  private safeRequest<T>(
    request: Observable<T>,
    fallback: T
  ): Observable<LoadResult<T>> {

    return request.pipe(
      map(data => ({
        data,
        failed: false
      })),

      catchError(() => of({
        data: fallback,
        failed: true
      }))
    );
  }

  private calcularAsistencias(): void {

    this.totalAsistencias = this.asistencias.length;

    this.presentes = this.contarEstado('PRESENTE');
    this.tardanzas = this.contarEstado('TARDANZA');
    this.ausencias = this.contarEstado('AUSENTE');
    this.justificados = this.contarEstado('JUSTIFICADO');

    const totalEvaluable =
      this.totalAsistencias - this.justificados;

    this.progreso = totalEvaluable > 0
      ? Math.round(
          ((this.presentes + this.tardanzas) / totalEvaluable) * 100
        )
      : 0;
  }

  private contarEstado(estado: string): number {
    return this.asistencias.filter(
      asistencia =>
        asistencia.estado?.toUpperCase() === estado
    ).length;
  }

  get nombreCompleto(): string {
    if (!this.resumen) {
      return this.username;
    }

    return `${this.resumen.nombre} ${this.resumen.apellido}`.trim();
  }

  get inicial(): string {
    return this.resumen?.nombre?.charAt(0).toUpperCase()
      || this.username.charAt(0).toUpperCase()
      || 'E';
  }

  get grupoPrincipal(): string {
    if (this.grupos.length === 0) {
      return 'Sin grupo';
    }

    if (this.grupos.length === 1) {
      return this.grupos[0].nombre;
    }

    return `${this.grupos[0].nombre} (+${this.grupos.length - 1})`;
  }

  get mensajeProgreso(): string {
    return this.progreso === 0
      ? 'Todavía no hay asistencias evaluables.'
      : 'Porcentaje de asistencia efectiva.';
  }

  formatFecha(fecha: string): string {
    if (!fecha) {
      return '-';
    }

    const [year, month, day] = fecha.substring(0, 10)
      .split('-')
      .map(Number);

    if (!year || !month || !day) {
      return fecha;
    }

    return new Date(year, month - 1, day).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  formatHora(hora: string | null): string {
    return hora ? hora.substring(0, 5) : '--:--';
  }

  traducirEstado(estado: string): string {
    const estados: Record<string, string> = {
      PRESENTE: 'Presente',
      AUSENTE: 'Ausente',
      TARDANZA: 'Tardanza',
      JUSTIFICADO: 'Justificado'
    };

    return estados[estado?.toUpperCase()] ?? estado;
  }

  getEstadoClass(estado: string): string {
    const clases: Record<string, string> = {
      PRESENTE: 'attendance-status--present',
      AUSENTE: 'attendance-status--absent',
      TARDANZA: 'attendance-status--late',
      JUSTIFICADO: 'attendance-status--justified'
    };

    return clases[estado?.toUpperCase()] ?? '';
  }

  formatToday(): string {
    return new Date().toLocaleDateString('es-PE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }
}
