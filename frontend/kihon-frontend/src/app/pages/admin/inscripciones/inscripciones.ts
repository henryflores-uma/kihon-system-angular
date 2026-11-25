
import {
  Component,
  OnInit,
  inject,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { EstudianteGrupoService } from '../../../core/services/estudiante-grupo';
import { EstudianteService } from '../../../core/services/estudiante';
import { GrupoService } from '../../../core/services/grupo';

import { EstudianteGrupoResponse } from '../../../models/estudiante-grupo-response';
import { EstudianteGrupoRequest } from '../../../models/estudiante-grupo-request';
import { EstudianteResponse } from '../../../models/estudiante-response';
import { GrupoResponse } from '../../../models/grupo-response';

type VistaInscripcion = 'todas' | 'grupos' | 'nueva';

@Component({
  selector: 'app-inscripciones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inscripciones.html',
  styleUrl: './inscripciones.scss'
})
export class Inscripciones implements OnInit {

  private readonly inscripcionService = inject(EstudianteGrupoService);
  private readonly estudianteService = inject(EstudianteService);
  private readonly grupoService = inject(GrupoService);
  private readonly cdr = inject(ChangeDetectorRef);

  inscripciones: EstudianteGrupoResponse[] = [];
  estudiantes: EstudianteResponse[] = [];
  grupos: GrupoResponse[] = [];

  vista: VistaInscripcion = 'todas';

  cargando = true;
  guardando = false;

  mensajeExito = '';
  mensajeError = '';

  busqueda = '';
  filtroGrupo = '';
  filtroEstado = '';

  estudianteSeleccionado: number | null = null;
  gruposSeleccionados: number[] = [];

  grupoConsultar: number | null = null;

  asignacionEditando: EstudianteGrupoResponse | null = null;
  nuevoGrupoId: number | null = null;

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.cargando = true;
    this.mensajeError = '';

    forkJoin({
      inscripciones: this.inscripcionService.listar(),
      estudiantes: this.estudianteService.listar(),
      grupos: this.grupoService.listar()
    }).subscribe({
      next: (data) => {
        this.inscripciones = data.inscripciones ?? [];
        this.estudiantes = data.estudiantes ?? [];
        this.grupos = data.grupos ?? [];

        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar inscripciones:', err);

        this.mensajeError =
          err.error?.message ||
          'No se pudieron cargar los datos del módulo.';

        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  get inscripcionesFiltradas(): EstudianteGrupoResponse[] {
    const texto = this.busqueda.trim().toLowerCase();

    return this.inscripciones.filter(inscripcion => {
      const estudiante = this.buscarEstudiante(inscripcion.estudianteId);

      const nombre = (
        inscripcion.estudianteNombre +
        ' ' +
        (estudiante?.apellido ?? '')
      ).toLowerCase();

      const documento = estudiante?.documento?.toLowerCase() ?? '';

      const coincideBusqueda =
        !texto ||
        nombre.includes(texto) ||
        documento.includes(texto) ||
        inscripcion.grupoNombre.toLowerCase().includes(texto);

      const coincideGrupo =
        !this.filtroGrupo ||
        String(inscripcion.grupoId) === this.filtroGrupo;

      const coincideEstado =
        !this.filtroEstado ||
        inscripcion.estado.toUpperCase() === this.filtroEstado;

      return coincideBusqueda && coincideGrupo && coincideEstado;
    });
  }

  get gruposActivos(): GrupoResponse[] {
    return this.grupos.filter(
      grupo => grupo.estado?.toUpperCase() === 'ACTIVO'
    );
  }

  get estudiantesActivos(): EstudianteResponse[] {
    return this.estudiantes.filter(
      estudiante => estudiante.estado?.toUpperCase() === 'ACTIVO'
    );
  }

  get totalInscripciones(): number {
    return this.inscripciones.length;
  }

  // Contar estudiantes únicos inscritos
get totalEstudiantesUnicos(): number {
  return new Set(
    this.inscripciones.map(item => item.estudianteId)
  ).size;
}

// Contar grupos diferentes con inscripciones
get totalGruposConInscripciones(): number {
  return new Set(
    this.inscripciones.map(item => item.grupoId)
  ).size;
}

  get totalActivas(): number {
    return this.inscripciones.filter(
      item => item.estado.toUpperCase() === 'ACTIVO'
    ).length;
  }

  // Suma de cupos disponibles
get totalCuposDisponibles(): number {
  return this.grupos.reduce(
    (total, grupo) => total + grupo.cuposDisponibles,
    0
  );
}

  get totalInactivas(): number {
    return this.inscripciones.filter(
      item => item.estado.toUpperCase() === 'INACTIVO'
    ).length;
  }

  get totalGruposOcupados(): number {
    return this.grupos.filter(
      grupo => grupo.estudiantesActivos > 0
    ).length;
  }

  get inscripcionesDelGrupo(): EstudianteGrupoResponse[] {
    if (this.grupoConsultar === null) return [];

    return this.inscripciones.filter(
      item => item.grupoId === this.grupoConsultar &&
        item.estado.toUpperCase() === 'ACTIVO'
    );
  }

  get grupoSeleccionado(): GrupoResponse | undefined {
    return this.grupos.find(
      grupo => grupo.id === this.grupoConsultar
    );
  }

  buscarEstudiante(id: number): EstudianteResponse | undefined {
    return this.estudiantes.find(estudiante => estudiante.id === id);
  }

  seleccionarVista(vista: VistaInscripcion): void {
    this.vista = vista;
    this.limpiarMensajes();
  }

  toggleGrupo(grupoId: number, seleccionado: boolean): void {
    if (seleccionado) {
      if (!this.gruposSeleccionados.includes(grupoId)) {
        this.gruposSeleccionados = [
          ...this.gruposSeleccionados,
          grupoId
        ];
      }
    } else {
      this.gruposSeleccionados =
        this.gruposSeleccionados.filter(id => id !== grupoId);
    }
  }

  estaGrupoSeleccionado(grupoId: number): boolean {
    return this.gruposSeleccionados.includes(grupoId);
  }

  puedeInscribirse(grupo: GrupoResponse): boolean {
    return grupo.estado.toUpperCase() === 'ACTIVO' &&
      grupo.cuposDisponibles > 0;
  }

  yaEstaInscrito(estudianteId: number, grupoId: number): boolean {
    return this.inscripciones.some(item =>
      item.estudianteId === estudianteId &&
      item.grupoId === grupoId &&
      item.estado.toUpperCase() === 'ACTIVO'
    );
  }

  registrarInscripcion(): void {
    this.limpiarMensajes();

    if (this.estudianteSeleccionado === null) {
      this.mensajeError = 'Selecciona un estudiante.';
      return;
    }

    if (this.gruposSeleccionados.length === 0) {
      this.mensajeError = 'Selecciona al menos un grupo.';
      return;
    }

    const estudianteId = this.estudianteSeleccionado;

    const gruposValidos = this.gruposSeleccionados.filter(grupoId => {
      const grupo = this.grupos.find(item => item.id === grupoId);

      return grupo &&
        this.puedeInscribirse(grupo) &&
        !this.yaEstaInscrito(estudianteId, grupoId);
    });

    if (gruposValidos.length !== this.gruposSeleccionados.length) {
      this.mensajeError =
        'Hay grupos sin cupos, inactivos o donde el estudiante ya está inscrito. Actualiza la información y vuelve a intentarlo.';
      return;
    }

    this.guardando = true;

    const solicitudes = gruposValidos.map(grupoId => {
      const request: EstudianteGrupoRequest = {
        estudianteId,
        grupoId
      };

      return this.inscripcionService.inscribir(request).pipe(
        catchError(error => {
          console.error(
            `Error al inscribir en el grupo ${grupoId}:`,
            error
          );
          return of(null);
        })
      );
    });

    forkJoin(solicitudes).subscribe({
      next: (resultados) => {
        const exitosas = resultados.filter(item => item !== null).length;
        const fallidas = resultados.length - exitosas;

        this.guardando = false;

        if (exitosas > 0) {
          this.mensajeExito =
            `${exitosas} inscripción(es) registrada(s) correctamente.`;
        }

        if (fallidas > 0) {
          this.mensajeError =
            `${fallidas} inscripción(es) no pudieron registrarse. Revisa los cupos y las reglas del backend.`;
        }

        this.estudianteSeleccionado = null;
        this.gruposSeleccionados = [];

        this.cargarDatos();
        this.vista = 'todas';

        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al registrar inscripción:', err);
        this.guardando = false;
        this.mensajeError = 'No se pudieron registrar las inscripciones.';
        this.cdr.detectChanges();
      }
    });
  }

  cambiarEstado(inscripcion: EstudianteGrupoResponse): void {
    this.limpiarMensajes();

    const nuevoEstado =
      inscripcion.estado.toUpperCase() === 'ACTIVO'
        ? 'INACTIVO'
        : 'ACTIVO';

    const confirmar = window.confirm(
      `¿Deseas ${nuevoEstado === 'ACTIVO' ? 'reactivar' : 'inactivar'} la inscripción de ${inscripcion.estudianteNombre}?`
    );

    if (!confirmar) return;

    this.inscripcionService.cambiarEstado(
      inscripcion.id,
      nuevoEstado
    ).subscribe({
      next: (respuesta) => {
        this.inscripciones = this.inscripciones.map(item =>
          item.id === respuesta.id ? respuesta : item
        );

        this.mensajeExito =
          `Inscripción ${nuevoEstado.toLowerCase()} correctamente.`;

        this.cargarDatos();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cambiar estado:', err);
        this.mensajeError =
          err.error?.message ||
          'No se pudo cambiar el estado de la inscripción.';
        this.cdr.detectChanges();
      }
    });
  }

  abrirEdicion(inscripcion: EstudianteGrupoResponse): void {
    this.asignacionEditando = inscripcion;
    this.nuevoGrupoId = inscripcion.grupoId;
    this.limpiarMensajes();
  }

  cancelarEdicion(): void {
    this.asignacionEditando = null;
    this.nuevoGrupoId = null;
  }

  guardarCambioGrupo(): void {
    if (!this.asignacionEditando || this.nuevoGrupoId === null) {
      return;
    }

    if (this.nuevoGrupoId === this.asignacionEditando.grupoId) {
      this.mensajeError = 'Selecciona un grupo diferente.';
      return;
    }

    this.guardando = true;
    this.limpiarMensajes();

    this.inscripcionService.cambiarGrupo(
      this.asignacionEditando.id,
      this.nuevoGrupoId
    ).subscribe({
      next: () => {
        this.asignacionEditando = null;
        this.nuevoGrupoId = null;
        this.guardando = false;
        this.mensajeExito = 'Grupo actualizado correctamente.';
        this.cargarDatos();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cambiar grupo:', err);
        this.guardando = false;
        this.mensajeError =
          err.error?.message ||
          'No se pudo cambiar el grupo.';
        this.cdr.detectChanges();
      }
    });
  }

  limpiarFiltros(): void {
    this.busqueda = '';
    this.filtroGrupo = '';
    this.filtroEstado = '';
  }

  limpiarMensajes(): void {
    this.mensajeExito = '';
    this.mensajeError = '';
  }

  formatFecha(fecha: string | null): string {
    if (!fecha) return '—';

    const valor = fecha.substring(0, 10);
    const partes = valor.split('-');

    if (partes.length !== 3) return valor;

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  nombreCompleto(estudianteId: number, nombre: string): string {
    const estudiante = this.buscarEstudiante(estudianteId);

    return `${nombre} ${estudiante?.apellido ?? ''}`.trim();
  }
}
