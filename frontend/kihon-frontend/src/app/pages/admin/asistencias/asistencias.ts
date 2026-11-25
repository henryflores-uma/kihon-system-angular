import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';

import { GrupoService } from '../../../core/services/grupo';
import { GrupoHorarioService } from '../../../core/services/grupo-horario';
import { AsistenciaService } from '../../../core/services/asistencia';

import { GrupoResponse } from '../../../models/grupo-response';
import { GrupoHorarioResponse } from '../../../models/grupo-horario-response';
import { AsistenciaResponse } from '../../../models/asistencia-response';
import { AsistenciaRequest } from '../../../models/asistencia-request';

import { environment } from '../../../../environments/environment';

interface InscripcionGrupo {
  id: number;
  estudianteId: number;
  estudianteNombre: string;
  grupoId: number;
  grupoNombre: string;
  estado: string;
  fechaInscripcion: string;
}

interface EstudianteAsistencia {
  estudianteId: number;
  nombre: string;
  asistenciaId: number | null;
  estado: string;
  horaLlegada: string;
  observacion: string;
  guardando: boolean;
}

type ApartadoAsistencia = 'registro' | 'consulta';

@Component({
  selector: 'app-asistencias',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './asistencias.html',
  styleUrl: './asistencias.scss'
})
export class Asistencias implements OnInit {

  private readonly grupoService = inject(GrupoService);
  private readonly horarioService = inject(GrupoHorarioService);
  private readonly asistenciaService = inject(AsistenciaService);
  private readonly http = inject(HttpClient);

  private readonly apiUrl = environment.apiUrl;

  apartado: ApartadoAsistencia = 'registro';

  grupos: GrupoResponse[] = [];
  horarios: GrupoHorarioResponse[] = [];

  gruposDisponibles: GrupoResponse[] = [];

  estudiantes: EstudianteAsistencia[] = [];

  asistenciasConsultadas: AsistenciaResponse[] = [];

  grupoSeleccionado: number | null = null;

  fechaSeleccionada = this.obtenerFechaActual();

  fechaConsulta = this.obtenerFechaActual();
  grupoConsulta: number | null = null;

  cargandoGrupos = false;
  cargandoEstudiantes = false;
  cargandoConsulta = false;
  guardandoTodas = false;

  error = '';
  mensajeExito = '';

  errorConsulta = '';
  mensajeConsulta = '';

  ngOnInit(): void {
    this.cargarGrupos();
  }

  private obtenerFechaActual(): string {
    const fecha = new Date();

    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');

    return `${anio}-${mes}-${dia}`;
  }

  private obtenerDiaSemana(fecha: string): string {
    const [anio, mes, dia] = fecha.split('-').map(Number);

    const fechaLocal = new Date(anio, mes - 1, dia);

    const dias = [
      'DOMINGO',
      'LUNES',
      'MARTES',
      'MIERCOLES',
      'JUEVES',
      'VIERNES',
      'SABADO'
    ];

    return dias[fechaLocal.getDay()];
  }

  cargarGrupos(): void {
    this.cargandoGrupos = true;
    this.error = '';

    forkJoin({
      grupos: this.grupoService.listar('ACTIVO'),
      horarios: this.horarioService.listar()
    }).subscribe({
      next: ({ grupos, horarios }) => {
        this.grupos = grupos;
        this.horarios = horarios;

        this.filtrarGruposPorFecha();

        this.cargandoGrupos = false;
      },
      error: (err) => {
        console.error('Error al cargar grupos y horarios:', err);

        this.error = 'No se pudieron cargar los grupos y sus horarios.';
        this.cargandoGrupos = false;
      }
    });
  }

  cambiarFecha(): void {
    this.grupoSeleccionado = null;
    this.estudiantes = [];
    this.mensajeExito = '';
    this.error = '';

    this.filtrarGruposPorFecha();
  }

  private filtrarGruposPorFecha(): void {

    if (!this.fechaSeleccionada) {
      this.gruposDisponibles = [];
      return;
    }

    const dia = this.obtenerDiaSemana(this.fechaSeleccionada);

    this.gruposDisponibles = this.grupos.filter(grupo =>
      this.horarios.some(horario =>
        horario.grupoId === grupo.id &&
        this.normalizarDia(horario.diaSemana) === dia
      )
    );
  }

  private normalizarDia(dia: string): string {
    return dia
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .trim();
  }

  consultarAsistencias(): void {

    if (!this.grupoSeleccionado || !this.fechaSeleccionada) {
      this.error = 'Selecciona un grupo y una fecha.';
      return;
    }

    this.cargandoEstudiantes = true;
    this.error = '';
    this.mensajeExito = '';
    this.estudiantes = [];

    const url =
      `${this.apiUrl}/estudiantes-grupos/grupo/${this.grupoSeleccionado}`;

    this.http.get<InscripcionGrupo[]>(url).subscribe({
      next: (inscripciones) => {

        const activos = inscripciones.filter(
          inscripcion => inscripcion.estado === 'ACTIVO'
        );

        this.estudiantes = activos.map(inscripcion => ({
          estudianteId: inscripcion.estudianteId,
          nombre: inscripcion.estudianteNombre,
          asistenciaId: null,
          estado: '',
          horaLlegada: '',
          observacion: '',
          guardando: false
        }));

        this.cargarRegistrosExistentes();
      },
      error: (err) => {
        console.error('Error al consultar inscritos:', err);

        this.error = 'No se pudieron cargar los estudiantes del grupo.';
        this.cargandoEstudiantes = false;
      }
    });
  }

  private cargarRegistrosExistentes(): void {

    if (!this.grupoSeleccionado) return;

    this.asistenciaService.listarPorGrupoYFecha(
      this.grupoSeleccionado,
      this.fechaSeleccionada
    ).subscribe({
      next: (asistencias) => {

        this.estudiantes = this.estudiantes.map(estudiante => {

          const registro = asistencias.find(
            asistencia =>
              asistencia.estudianteId === estudiante.estudianteId
          );

          if (!registro) return estudiante;

          return {
            ...estudiante,
            asistenciaId: registro.id,
            estado: registro.estado,
            horaLlegada: registro.horaLlegada?.substring(0, 5) || '',
            observacion: registro.observacion || ''
          };
        });

        this.cargandoEstudiantes = false;
      },
      error: (err) => {
        console.error('Error al cargar asistencias:', err);

        this.error = 'No se pudieron consultar las asistencias registradas.';
        this.cargandoEstudiantes = false;
      }
    });
  }

  cambiarEstado(estudiante: EstudianteAsistencia): void {

    if (estudiante.estado === 'AUSENTE') {
      estudiante.horaLlegada = '';
    }
  }

  private validarEstudiante(
    estudiante: EstudianteAsistencia
  ): string | null {

    if (!estudiante.estado) {
      return `Selecciona el estado de ${estudiante.nombre}.`;
    }

    if (
      (estudiante.estado === 'PRESENTE' ||
        estudiante.estado === 'TARDANZA') &&
      !estudiante.horaLlegada
    ) {
      return `Indica la hora de llegada de ${estudiante.nombre}.`;
    }

    return null;
  }

  private crearRequest(
    estudiante: EstudianteAsistencia
  ): AsistenciaRequest {

    return {
      estudianteId: estudiante.estudianteId,
      grupoId: this.grupoSeleccionado!,
      fecha: this.fechaSeleccionada,
      horaLlegada:
        estudiante.estado === 'AUSENTE'
          ? null
          : estudiante.horaLlegada || null,
      estado: estudiante.estado,
      observacion: estudiante.observacion.trim() || null
    };
  }

  guardarAsistencia(estudiante: EstudianteAsistencia): void {

    if (!this.grupoSeleccionado) return;

    const validacion = this.validarEstudiante(estudiante);

    if (validacion) {
      this.error = validacion;
      return;
    }

    estudiante.guardando = true;

    this.error = '';
    this.mensajeExito = '';

    const datos = this.crearRequest(estudiante);

    const peticion = estudiante.asistenciaId
      ? this.asistenciaService.actualizar(
          estudiante.asistenciaId,
          datos
        )
      : this.asistenciaService.registrar(datos);

    peticion.subscribe({
      next: (respuesta) => {

        estudiante.asistenciaId = respuesta.id;
        estudiante.guardando = false;

        this.mensajeExito =
          `Asistencia de ${estudiante.nombre} guardada correctamente.`;
      },
      error: (err) => {

        console.error('Error al guardar asistencia:', err);

        estudiante.guardando = false;

        this.error =
          err.error?.message ||
          `No se pudo guardar la asistencia de ${estudiante.nombre}.`;
      }
    });
  }

  guardarTodas(): void {

    if (!this.grupoSeleccionado || !this.estudiantes.length) return;

    this.error = '';
    this.mensajeExito = '';

    for (const estudiante of this.estudiantes) {

      const validacion = this.validarEstudiante(estudiante);

      if (validacion) {
        this.error = validacion;
        return;
      }
    }

    this.guardandoTodas = true;

    const peticiones = this.estudiantes.map(estudiante => {

      const datos = this.crearRequest(estudiante);

      return estudiante.asistenciaId
        ? this.asistenciaService.actualizar(estudiante.asistenciaId, datos)
        : this.asistenciaService.registrar(datos);
    });

    forkJoin(peticiones).subscribe({
      next: (respuestas) => {

        respuestas.forEach((respuesta, indice) => {
          this.estudiantes[indice].asistenciaId = respuesta.id;
        });

        this.guardandoTodas = false;

        this.mensajeExito =
          'Todas las asistencias se guardaron correctamente.';
      },
      error: (err) => {

        console.error('Error al guardar todas las asistencias:', err);

        this.guardandoTodas = false;

        this.error =
          err.error?.message ||
          'Ocurrió un error al guardar las asistencias. Verifica los registros.';
      }
    });
  }

  cambiarApartado(apartado: ApartadoAsistencia): void {

    this.apartado = apartado;

    this.error = '';
    this.mensajeExito = '';

    this.errorConsulta = '';
    this.mensajeConsulta = '';
  }

  consultarHistorial(): void {

    if (!this.fechaConsulta && !this.grupoConsulta) {
      this.errorConsulta =
        'Selecciona una fecha, un grupo o ambos filtros.';
      return;
    }

    this.cargandoConsulta = true;

    this.errorConsulta = '';
    this.mensajeConsulta = '';
    this.asistenciasConsultadas = [];

    let peticion;

    if (this.grupoConsulta && this.fechaConsulta) {

      peticion = this.asistenciaService.listarPorGrupoYFecha(
        this.grupoConsulta,
        this.fechaConsulta
      );

    } else if (this.grupoConsulta) {

      peticion = this.asistenciaService.listarPorGrupo(
        this.grupoConsulta
      );

    } else {

      peticion = this.asistenciaService.listarPorFecha(
        this.fechaConsulta
      );
    }

    peticion.subscribe({
      next: (respuesta) => {

        this.asistenciasConsultadas = respuesta;

        this.cargandoConsulta = false;

        if (!respuesta.length) {
          this.mensajeConsulta =
            'No se encontraron asistencias con los filtros seleccionados.';
        }
      },
      error: (err) => {

        console.error('Error al consultar historial:', err);

        this.errorConsulta =
          'No se pudo consultar el historial de asistencias.';

        this.cargandoConsulta = false;
      }
    });
  }

  get totalEstudiantes(): number {
    return this.estudiantes.length;
  }

  get totalPresentes(): number {
    return this.estudiantes.filter(
      e => e.estado === 'PRESENTE'
    ).length;
  }

  get totalTardanzas(): number {
    return this.estudiantes.filter(
      e => e.estado === 'TARDANZA'
    ).length;
  }

  get totalFaltas(): number {
    return this.estudiantes.filter(
      e => e.estado === 'AUSENTE'
    ).length;
  }

  get totalRegistrados(): number {
    return this.estudiantes.filter(
      e => e.asistenciaId !== null
    ).length;
  }

  get porcentajeAsistencia(): number {

    if (!this.totalEstudiantes) return 0;

    return Math.round(
      ((this.totalPresentes + this.totalTardanzas) /
        this.totalEstudiantes) * 100
    );
  }

  get totalConsultados(): number {
    return this.asistenciasConsultadas.length;
  }

  get presentesConsultados(): number {
    return this.asistenciasConsultadas.filter(
      a => a.estado === 'PRESENTE'
    ).length;
  }

  get tardanzasConsultadas(): number {
    return this.asistenciasConsultadas.filter(
      a => a.estado === 'TARDANZA'
    ).length;
  }

  get ausentesConsultados(): number {
    return this.asistenciasConsultadas.filter(
      a => a.estado === 'AUSENTE'
    ).length;
  }

  obtenerNombreDia(fecha: string): string {
    const dia = this.obtenerDiaSemana(fecha);

    const nombres: Record<string, string> = {
      LUNES: 'Lunes',
      MARTES: 'Martes',
      MIERCOLES: 'Miércoles',
      JUEVES: 'Jueves',
      VIERNES: 'Viernes',
      SABADO: 'Sábado',
      DOMINGO: 'Domingo'
    };

    return nombres[dia] || dia;
  }

  obtenerNombreEstado(estado: string): string {

    const nombres: Record<string, string> = {
      PRESENTE: 'Presente',
      TARDANZA: 'Tardanza',
      AUSENTE: 'Ausente'
    };

    return nombres[estado] || estado;
  }
}