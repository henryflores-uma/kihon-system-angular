import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

import { EstudiantePortalService } from '../../../core/services/estudiante-portal';
import { GrupoEstudianteResponse } from '../../../models/grupo-estudiante-response';

@Component({
  selector: 'app-estudiante-grupos',
  imports: [],
  templateUrl: './grupos.html',
  styleUrl: './grupos.scss'
})
export class EstudianteGrupos implements OnInit {

  private readonly estudianteService = inject(EstudiantePortalService);
  private readonly cdr = inject(ChangeDetectorRef);

  grupos: GrupoEstudianteResponse[] = [];

  isLoading = true;
  errorMessage = '';

  ngOnInit(): void {
    this.cargarGrupos();
  }

  private cargarGrupos(): void {
    this.estudianteService.obtenerGrupos().subscribe({

      next: (data) => {
        this.grupos = data ?? [];
        this.isLoading = false;
        this.cdr.markForCheck();
      },

      error: (error: HttpErrorResponse) => {
        this.errorMessage = error.status === 0
          ? 'No se pudo conectar con el servidor.'
          : 'Ocurrió un error al cargar tus grupos.';

        this.isLoading = false;
        this.cdr.markForCheck();
      }

    });
  }

  formatHora(hora: string | null): string {
    return hora ? hora.substring(0, 5) : '--:--';
  }

  get gruposActivos(): number {
    return this.grupos.filter(
      grupo => grupo.estado?.toUpperCase() === 'ACTIVO'
    ).length;
  }

  get totalHorarios(): number {
    return this.grupos.reduce(
      (total, grupo) => total + (grupo.horarios?.length ?? 0),
      0
    );
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