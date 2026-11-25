
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { NgClass } from '@angular/common';

import { EstudiantePortalService } from '../../../core/services/estudiante-portal';
import { AsistenciaResponse } from '../../../models/asistencia-response';

@Component({
  selector: 'app-estudiante-asistencias',
  imports: [NgClass],
  templateUrl: './asistencias.html',
  styleUrl: './asistencias.scss',
})
export class EstudianteAsistencias implements OnInit {

  private readonly estudianteService = inject(EstudiantePortalService);
  private readonly cdr = inject(ChangeDetectorRef);

  asistencias: AsistenciaResponse[] = [];
  cargando = true;
  error = '';

  ngOnInit(): void {
    this.cargarAsistencias();
  }

  cargarAsistencias(): void {
    this.cargando = true;
    this.error = '';

    this.estudianteService.obtenerAsistencias().subscribe({
      next: (data) => {
        console.log('Asistencias recibidas:', data);

        this.asistencias = data ?? [];
        this.cargando = false;

        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error al cargar asistencias:', err);

        this.error = 'No se pudieron cargar tus asistencias.';
        this.cargando = false;

        this.cdr.markForCheck();
      }
    });
  }

  get totalAsistencias(): number {
    return this.asistencias.length;
  }

  get totalPresentes(): number {
    return this.contarPorEstado('PRESENTE');
  }

  get totalTardanzas(): number {
    return this.contarPorEstado('TARDANZA');
  }

  get totalAusencias(): number {
    return this.contarPorEstado('AUSENTE');
  }

  get totalJustificadas(): number {
    return this.contarPorEstado('JUSTIFICADO');
  }

  private contarPorEstado(estado: string): number {
    return this.asistencias.filter(
      asistencia => asistencia.estado?.toUpperCase() === estado
    ).length;
  }

  traducirEstado(estado: string): string {
    const estados: Record<string, string> = {
      PRESENTE: 'Presente',
      TARDANZA: 'Tardanza',
      AUSENTE: 'Ausente',
      JUSTIFICADO: 'Justificado',
    };

    return estados[estado?.toUpperCase()] ?? estado;
  }

  getEstadoClass(estado: string): string {
    const clases: Record<string, string> = {
      PRESENTE: 'status--presente',
      TARDANZA: 'status--tardanza',
      AUSENTE: 'status--ausente',
      JUSTIFICADO: 'status--justificado',
    };

    return clases[estado?.toUpperCase()] ?? '';
  }

  formatFecha(fecha: string): string {
    if (!fecha) return '—';

    const [year, month, day] = fecha.split('T')[0].split('-');

    if (!year || !month || !day) return fecha;

    return `${day}/${month}/${year}`;
  }

  formatHora(hora: string | null): string {
    if (!hora) return '—';

    return hora.substring(0, 5);
  }
}
