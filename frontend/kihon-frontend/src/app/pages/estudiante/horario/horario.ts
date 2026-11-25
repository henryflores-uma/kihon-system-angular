
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';

import { EstudiantePortalService } from '../../../core/services/estudiante-portal';
import { GrupoEstudianteResponse } from '../../../models/grupo-estudiante-response';

@Component({
  selector: 'app-estudiante-horario',
  imports: [],
  templateUrl: './horario.html',
  styleUrl: './horario.scss',
})
export class EstudianteHorario implements OnInit {

  private readonly estudianteService = inject(EstudiantePortalService);
  private readonly cdr = inject(ChangeDetectorRef);

  grupos: GrupoEstudianteResponse[] = [];
  cargando = true;
  error = '';

  private readonly ordenDias = [
    'LUNES',
    'MARTES',
    'MIERCOLES',
    'JUEVES',
    'VIERNES',
    'SABADO',
    'DOMINGO',
  ];

  ngOnInit(): void {
    this.cargarHorario();
  }

  cargarHorario(): void {
    this.cargando = true;
    this.error = '';

    this.estudianteService.obtenerGrupos().subscribe({
      next: (data) => {
        console.log('Grupos recibidos para horario:', data);

        this.grupos = (data ?? []).filter(
          grupo => grupo.estado?.toUpperCase() === 'ACTIVO'
        );

        this.cargando = false;

        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error al cargar horario:', err);

        this.error = 'No se pudo cargar tu horario.';
        this.cargando = false;

        this.cdr.markForCheck();
      }
    });
  }

  get totalGrupos(): number {
    return this.grupos.length;
  }

  get totalHorarios(): number {
    return this.grupos.reduce(
      (total, grupo) => total + (grupo.horarios?.length ?? 0),
      0
    );
  }

  get diasEntrenamiento(): number {
    const dias = new Set(
      this.grupos.flatMap(grupo =>
        (grupo.horarios ?? []).map(horario =>
          this.normalizarDia(horario.diaSemana)
        )
      )
    );

    return dias.size;
  }

  ordenarHorarios(grupo: GrupoEstudianteResponse) {
    return [...(grupo.horarios ?? [])].sort((a, b) => {
      return this.indiceDia(a.diaSemana) - this.indiceDia(b.diaSemana);
    });
  }

  private indiceDia(dia: string): number {
    const diaNormalizado = this.normalizarDia(dia);
    const indice = this.ordenDias.indexOf(diaNormalizado);

    return indice === -1 ? 99 : indice;
  }

  private normalizarDia(dia: string): string {
    return dia
      ?.normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase() ?? '';
  }

  formatDia(dia: string): string {
    const dias: Record<string, string> = {
      LUNES: 'Lunes',
      MARTES: 'Martes',
      MIERCOLES: 'Miércoles',
      JUEVES: 'Jueves',
      VIERNES: 'Viernes',
      SABADO: 'Sábado',
      DOMINGO: 'Domingo',
    };

    return dias[this.normalizarDia(dia)] ?? dia;
  }

  formatHora(hora: string): string {
    if (!hora) return '—';

    return hora.substring(0, 5);
  }
}
