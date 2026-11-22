
import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin, Observable } from 'rxjs';

import { GrupoService } from '../../../core/services/grupo';
import { GrupoHorarioService } from '../../../core/services/grupo-horario';
import { FrecuenciaGrupoService } from '../../../core/services/frecuencia-grupo';
import { UsuarioService } from '../../../core/services/usuario';

import { GrupoResponse } from '../../../models/grupo-response';
import { GrupoRequest } from '../../../models/grupo-request';
import { GrupoHorarioResponse } from '../../../models/grupo-horario-response';
import { GrupoHorarioRequest } from '../../../models/grupo-horario-request';
import { FrecuenciaGrupoResponse } from '../../../models/frecuencia-grupo-response';
import { UsuarioResponse } from '../../../models/usuario-response';

interface HorarioFormulario {
  id?: number;
  diaSemana: string;
  horaInicio: string;
  horaFin: string;
}

interface GrupoAgrupado {
  frecuenciaSemanal: number;
  frecuenciaNombre: string;
  grupos: GrupoResponse[];
}

@Component({
  selector: 'app-grupos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './grupos.html',
  styleUrl: './grupos.scss'
})
export class Grupos implements OnInit {

  private readonly grupoService = inject(GrupoService);
  private readonly horarioService = inject(GrupoHorarioService);
  private readonly frecuenciaService = inject(FrecuenciaGrupoService);
  private readonly usuarioService = inject(UsuarioService);

  readonly diasSemana = [
    'LUNES',
    'MARTES',
    'MIERCOLES',
    'JUEVES',
    'VIERNES',
    'SABADO',
    'DOMINGO'
  ];

  grupos: GrupoResponse[] = [];
  frecuencias: FrecuenciaGrupoResponse[] = [];
  senseis: UsuarioResponse[] = [];

  horariosPorGrupo: Record<number, GrupoHorarioResponse[]> = {};

  cargando = false;
  guardando = false;

  error = '';
  errorFormulario = '';
  mensajeExito = '';

  busqueda = '';
  filtroEstado = 'TODOS';

  mostrarModal = false;
  grupoEditando: GrupoResponse | null = null;

  nuevoGrupo = {
    nombre: '',
    descripcion: '',
    capacidad: 20,
    senseiId: null as number | null
  };

  horariosFormulario: HorarioFormulario[] = [];

  // ==========================================
  // INICIALIZACIÓN
  // ==========================================

  ngOnInit(): void {
    this.cargarDatos();
  }

  // ==========================================
  // CARGA DE INFORMACIÓN
  // ==========================================

  cargarDatos(): void {
    this.cargando = true;
    this.error = '';

    forkJoin({
      grupos: this.grupoService.listar(),
      frecuencias: this.frecuenciaService.listar(),
      senseis: this.usuarioService.listarSenseis()
    }).subscribe({
      next: (respuesta) => {
        this.grupos = respuesta.grupos;
        this.frecuencias = respuesta.frecuencias;
        this.senseis = respuesta.senseis;

        if (this.grupos.length === 0) {
          this.horariosPorGrupo = {};
          this.cargando = false;
          return;
        }

        const solicitudes = this.grupos.map(grupo =>
          this.horarioService.listarPorGrupo(grupo.id)
        );

        forkJoin(solicitudes).subscribe({
          next: (horarios) => {
            this.horariosPorGrupo = {};

            this.grupos.forEach((grupo, indice) => {
              this.horariosPorGrupo[grupo.id] = horarios[indice];
            });

            this.cargando = false;
          },
          error: (err) => {
            this.error = this.obtenerMensajeError(
              err,
              'No se pudieron cargar los horarios.'
            );

            this.cargando = false;
          }
        });
      },

      error: (err) => {
        this.error = this.obtenerMensajeError(
          err,
          'No se pudo cargar la información de los grupos.'
        );

        this.cargando = false;
      }
    });
  }

  // ==========================================
  // FILTROS Y AGRUPACIÓN
  // ==========================================

  get gruposFiltrados(): GrupoResponse[] {
    const texto = this.busqueda.trim().toLowerCase();

    return this.grupos.filter(grupo => {

      const coincideTexto =
        !texto ||
        grupo.nombre.toLowerCase().includes(texto) ||
        (grupo.senseiNombre || '').toLowerCase().includes(texto) ||
        (grupo.frecuenciaNombre || '').toLowerCase().includes(texto);

      const coincideEstado =
        this.filtroEstado === 'TODOS' ||
        grupo.estado === this.filtroEstado;

      return coincideTexto && coincideEstado;
    });
  }

  get gruposAgrupados(): GrupoAgrupado[] {
    const agrupados = new Map<number, GrupoResponse[]>();

    this.gruposFiltrados.forEach(grupo => {
      const frecuencia = grupo.frecuenciaSemanal ?? 0;

      if (!agrupados.has(frecuencia)) {
        agrupados.set(frecuencia, []);
      }

      agrupados.get(frecuencia)!.push(grupo);
    });

    return Array.from(agrupados.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([frecuenciaSemanal, grupos]) => ({
        frecuenciaSemanal,
        frecuenciaNombre:
          grupos[0].frecuenciaNombre ||
          `${frecuenciaSemanal} días por semana`,
        grupos
      }));
  }

  obtenerHorarios(grupoId: number): GrupoHorarioResponse[] {
    const horarios = this.horariosPorGrupo[grupoId] || [];

    return [...horarios].sort(
      (a, b) =>
        this.diasSemana.indexOf(a.diaSemana) -
        this.diasSemana.indexOf(b.diaSemana)
    );
  }

  // ==========================================
  // REGISTRO Y EDICIÓN
  // ==========================================

  abrirRegistro(): void {
    this.grupoEditando = null;

    this.nuevoGrupo = {
      nombre: '',
      descripcion: '',
      capacidad: 20,
      senseiId: null
    };

    this.horariosFormulario = [
      this.crearHorarioVacio('LUNES')
    ];

    this.errorFormulario = '';
    this.mensajeExito = '';
    this.mostrarModal = true;
  }

  editarGrupo(grupo: GrupoResponse): void {
    this.grupoEditando = grupo;

    this.nuevoGrupo = {
      nombre: grupo.nombre,
      descripcion: grupo.descripcion || '',
      capacidad: grupo.capacidad,
      senseiId: grupo.senseiId
    };

    this.errorFormulario = '';
    this.mensajeExito = '';
    this.mostrarModal = true;

    this.horariosFormulario = this.obtenerHorarios(grupo.id)
      .map(horario => ({
        id: horario.id,
        diaSemana: horario.diaSemana,
        horaInicio: horario.horaInicio.substring(0, 5),
        horaFin: horario.horaFin.substring(0, 5)
      }));

    if (this.horariosFormulario.length === 0) {
      this.horariosFormulario = [
        this.crearHorarioVacio('LUNES')
      ];
    }
  }

  cerrarModal(): void {
    if (this.guardando) return;

    this.mostrarModal = false;
    this.grupoEditando = null;
    this.errorFormulario = '';
  }

  private crearHorarioVacio(diaSemana: string): HorarioFormulario {
    return {
      diaSemana,
      horaInicio: '16:00',
      horaFin: '17:00'
    };
  }

  // ==========================================
  // ADMINISTRACIÓN DE HORARIOS
  // ==========================================

  agregarHorario(): void {
    const diasUsados = this.horariosFormulario.map(
      horario => horario.diaSemana
    );

    const diaDisponible = this.diasSemana.find(
      dia => !diasUsados.includes(dia)
    );

    if (!diaDisponible) {
      this.errorFormulario =
        'Ya se seleccionaron todos los días disponibles.';
      return;
    }

    this.horariosFormulario.push(
      this.crearHorarioVacio(diaDisponible)
    );

    this.errorFormulario = '';
  }

  eliminarHorario(indice: number): void {
    if (this.horariosFormulario.length <= 1) {
      this.errorFormulario =
        'El grupo debe tener al menos un horario.';
      return;
    }

    this.horariosFormulario.splice(indice, 1);
    this.errorFormulario = '';
  }

  diaOcupado(dia: string, indice: number): boolean {
    return this.horariosFormulario.some(
      (horario, i) =>
        i !== indice && horario.diaSemana === dia
    );
  }

  obtenerFrecuenciaSeleccionada():
    FrecuenciaGrupoResponse | undefined {

    return this.frecuencias.find(
      frecuencia =>
        frecuencia.frecuenciaSemanal ===
        this.horariosFormulario.length
    );
  }

  // ==========================================
  // VALIDACIONES
  // ==========================================

  private validarFormulario(): boolean {
    this.errorFormulario = '';

    if (!this.nuevoGrupo.nombre.trim()) {
      this.errorFormulario =
        'El nombre del grupo es obligatorio.';
      return false;
    }

    if (!this.nuevoGrupo.descripcion.trim()) {
      this.errorFormulario =
        'La descripción del grupo es obligatoria.';
      return false;
    }

    if (
      !Number.isInteger(this.nuevoGrupo.capacidad) ||
      this.nuevoGrupo.capacidad <= 0
    ) {
      this.errorFormulario =
        'La capacidad debe ser un número entero mayor que cero.';
      return false;
    }

    if (
      this.grupoEditando &&
      this.nuevoGrupo.capacidad <
        this.grupoEditando.estudiantesActivos
    ) {
      this.errorFormulario =
        `La capacidad no puede ser menor que los ` +
        `${this.grupoEditando.estudiantesActivos} estudiantes activos.`;

      return false;
    }

    if (this.horariosFormulario.length === 0) {
      this.errorFormulario =
        'Debes registrar al menos un día de entrenamiento.';
      return false;
    }

    const dias = this.horariosFormulario.map(
      horario => horario.diaSemana
    );

    if (new Set(dias).size !== dias.length) {
      this.errorFormulario =
        'No puedes repetir un día de entrenamiento.';
      return false;
    }

    for (const horario of this.horariosFormulario) {

      if (
        !horario.diaSemana ||
        !horario.horaInicio ||
        !horario.horaFin
      ) {
        this.errorFormulario =
          'Completa todos los datos de los horarios.';
        return false;
      }

      if (horario.horaInicio >= horario.horaFin) {
        this.errorFormulario =
          `La hora de inicio debe ser anterior a la hora de fin ` +
          `(${horario.diaSemana}).`;

        return false;
      }
    }

    const frecuencia = this.obtenerFrecuenciaSeleccionada();

    if (!frecuencia) {
      this.errorFormulario =
        `No existe una frecuencia configurada para ` +
        `${this.horariosFormulario.length} días por semana.`;

      return false;
    }

    return true;
  }

  // ==========================================
  // VALIDAR CRUCES DE HORARIOS
  // ==========================================

  private validarCrucesHorarios(): boolean {
    this.errorFormulario = '';

    const grupoIdExcluir = this.grupoEditando?.id;

    for (const horarioNuevo of this.horariosFormulario) {

      for (const grupo of this.grupos) {

        if (
          grupo.estado !== 'ACTIVO' ||
          grupo.id === grupoIdExcluir
        ) {
          continue;
        }

        const horariosExistentes =
          this.horariosPorGrupo[grupo.id] || [];

        for (const existente of horariosExistentes) {

          if (
            existente.diaSemana !== horarioNuevo.diaSemana
          ) {
            continue;
          }

          // Normalizar las horas a HH:mm
          const horaInicioExistente =
            existente.horaInicio.substring(0, 5);

          const horaFinExistente =
            existente.horaFin.substring(0, 5);

          const existeCruce =
            horarioNuevo.horaInicio < horaFinExistente &&
            horarioNuevo.horaFin > horaInicioExistente;

          if (existeCruce) {
            this.errorFormulario =
              `El horario se cruza con el grupo "${grupo.nombre}" ` +
              `el día ${horarioNuevo.diaSemana} ` +
              `(${horaInicioExistente} - ${horaFinExistente}).`;

            return false;
          }
        }
      }
    }

    return true;
  }

  // ==========================================
  // GUARDAR GRUPO
  // ==========================================

  guardarGrupo(): void {
    if (this.guardando) return;

    if (!this.validarFormulario()) return;

    if (!this.validarCrucesHorarios()) return;

    const frecuencia = this.obtenerFrecuenciaSeleccionada();

    if (!frecuencia) return;

    const datos: GrupoRequest = {
      nombre: this.nuevoGrupo.nombre.trim(),
      descripcion: this.nuevoGrupo.descripcion.trim(),
      capacidad: Number(this.nuevoGrupo.capacidad),
      senseiId: this.nuevoGrupo.senseiId
        ? Number(this.nuevoGrupo.senseiId)
        : null,
      frecuenciaId: frecuencia.id
    };

    this.guardando = true;
    this.errorFormulario = '';

    if (this.grupoEditando) {
      this.actualizarGrupoExistente(
        this.grupoEditando.id,
        datos
      );
    } else {
      this.registrarGrupoNuevo(datos);
    }
  }

  // ==========================================
  // REGISTRAR GRUPO NUEVO
  // ==========================================

  private registrarGrupoNuevo(datos: GrupoRequest): void {

    this.grupoService.crear(datos).subscribe({
      next: grupo => {

        const solicitudes = this.horariosFormulario.map(horario => {

          const datosHorario: GrupoHorarioRequest = {
            grupoId: grupo.id,
            diaSemana: horario.diaSemana,
            horaInicio: horario.horaInicio,
            horaFin: horario.horaFin
          };

          return this.horarioService.crear(datosHorario);
        });

        forkJoin(solicitudes).subscribe({
          next: () => {
            this.finalizarGuardado(
              'Grupo registrado correctamente.'
            );
          },

          error: err => {
            this.guardando = false;

            this.errorFormulario = this.obtenerMensajeError(
              err,
              'El grupo se registró, pero ocurrió un error al guardar sus horarios. Revisa el grupo antes de volver a registrarlo.'
            );

            this.cargarDatos();
          }
        });
      },

      error: err => {
        this.guardando = false;

        this.errorFormulario = this.obtenerMensajeError(
          err,
          'No se pudo registrar el grupo.'
        );
      }
    });
  }

  // ==========================================
  // ACTUALIZAR GRUPO EXISTENTE
  // ==========================================

  private actualizarGrupoExistente(
    id: number,
    datos: GrupoRequest
  ): void {

    this.grupoService.actualizar(id, datos).subscribe({
      next: () => {

        const horariosActuales =
          this.horariosPorGrupo[id] || [];

        const idsConservados = this.horariosFormulario
          .filter(horario => horario.id !== undefined)
          .map(horario => horario.id!);

        const operaciones: Observable<unknown>[] =
          this.horariosFormulario.map(horario => {

            const datosHorario: GrupoHorarioRequest = {
              grupoId: id,
              diaSemana: horario.diaSemana,
              horaInicio: horario.horaInicio,
              horaFin: horario.horaFin
            };

            return horario.id
              ? this.horarioService.actualizar(
                  horario.id,
                  datosHorario
                )
              : this.horarioService.crear(datosHorario);
          });

        // Eliminar horarios que fueron quitados del formulario
        horariosActuales
          .filter(horario =>
            !idsConservados.includes(horario.id)
          )
          .forEach(horario => {
            operaciones.push(
              this.horarioService.eliminar(horario.id)
            );
          });

        forkJoin(operaciones).subscribe({
          next: () => {
            this.finalizarGuardado(
              'Grupo actualizado correctamente.'
            );
          },

          error: err => {
            this.guardando = false;

            this.errorFormulario = this.obtenerMensajeError(
              err,
              'El grupo se actualizó, pero ocurrió un error al actualizar sus horarios.'
            );

            this.cargarDatos();
          }
        });
      },

      error: err => {
        this.guardando = false;

        this.errorFormulario = this.obtenerMensajeError(
          err,
          'No se pudo actualizar el grupo.'
        );
      }
    });
  }

  // ==========================================
  // FINALIZAR GUARDADO
  // ==========================================

  private finalizarGuardado(mensaje: string): void {
    this.guardando = false;
    this.mostrarModal = false;
    this.grupoEditando = null;
    this.mensajeExito = mensaje;

    this.cargarDatos();
  }

  // ==========================================
  // CAMBIAR ESTADO
  // ==========================================

  cambiarEstado(grupo: GrupoResponse): void {

    const nuevoEstado =
      grupo.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';

    const accion =
      nuevoEstado === 'ACTIVO' ? 'activar' : 'desactivar';

    if (
      !confirm(
        `¿Estás seguro de ${accion} el grupo "${grupo.nombre}"?`
      )
    ) {
      return;
    }

    this.grupoService.cambiarEstado(
      grupo.id,
      nuevoEstado
    ).subscribe({
      next: () => {
        this.mensajeExito =
          `Grupo ${
            nuevoEstado === 'ACTIVO'
              ? 'activado'
              : 'desactivado'
          } correctamente.`;

        this.cargarDatos();
      },

      error: err => {
        this.error = this.obtenerMensajeError(
          err,
          'No se pudo cambiar el estado del grupo.'
        );
      }
    });
  }

  // ==========================================
  // ELIMINAR GRUPO
  // ==========================================

  eliminarGrupo(grupo: GrupoResponse): void {

    if (grupo.estudiantesActivos > 0) {
      this.error =
        'No se puede eliminar un grupo que tiene estudiantes activos.';
      return;
    }

    if (
      !confirm(
        `¿Deseas eliminar definitivamente el grupo "${grupo.nombre}"?`
      )
    ) {
      return;
    }

    this.grupoService.eliminar(grupo.id).subscribe({
      next: () => {
        this.mensajeExito =
          'Grupo eliminado correctamente.';

        this.cargarDatos();
      },

      error: err => {
        this.error = this.obtenerMensajeError(
          err,
          'No se pudo eliminar el grupo.'
        );
      }
    });
  }

  // ==========================================
  // UTILIDADES
  // ==========================================

  obtenerNombreDia(dia: string): string {

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

  private obtenerMensajeError(
    error: HttpErrorResponse,
    mensajePredeterminado: string
  ): string {

    const cuerpo = error.error;

    if (
      typeof cuerpo === 'string' &&
      cuerpo.trim()
    ) {
      return cuerpo;
    }

    return (
      cuerpo?.mensaje ||
      cuerpo?.message ||
      mensajePredeterminado
    );
  }
}
