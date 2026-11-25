
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { EventoService } from '../../../core/services/evento';
import { TipoEventoService } from '../../../core/services/tipo-evento';
import { UsuarioService } from '../../../core/services/usuario';
import { GrupoService } from '../../../core/services/grupo';
import { GrupoHorarioService } from '../../../core/services/grupo-horario';

import { EventoRequest } from '../../../models/evento-request';
import { EventoResponse } from '../../../models/evento-response';
import { TipoEventoResponse } from '../../../models/tipo-evento-response';
import { UsuarioResponse } from '../../../models/usuario-response';
import { GrupoResponse } from '../../../models/grupo-response';
import { GrupoHorarioResponse } from '../../../models/grupo-horario-response';

interface DiaCalendario {
  fecha: string;
  fechaDate: Date;
  nombre: string;
  numero: number;
  esHoy: boolean;
}

interface EventoFormulario {
  titulo: string;
  tipo: string;
  descripcion: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  lugar: string;
  responsableId: number | null;
}

@Component({
  selector: 'app-horario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './horario.html',
  styleUrl: './horario.scss'
})
export class Horario implements OnInit {

  private readonly eventoService = inject(EventoService);
  private readonly tipoEventoService = inject(TipoEventoService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly grupoService = inject(GrupoService);
  private readonly grupoHorarioService = inject(GrupoHorarioService);

  eventos: EventoResponse[] = [];
  tiposEvento: TipoEventoResponse[] = [];
  responsables: UsuarioResponse[] = [];

  grupos: GrupoResponse[] = [];
  horarios: GrupoHorarioResponse[] = [];

  cargando = true;
  cargandoEventos = false;
  guardando = false;

  error = '';
  mensajeExito = '';

  mostrarModal = false;
  mostrarModalEliminar = false;

  eventoEditando: EventoResponse | null = null;
  eventoEliminar: EventoResponse | null = null;

  fechaActual = new Date();
  inicioSemana = this.obtenerInicioSemana(new Date());

  horaInicioCalendario = 8;
  horaFinCalendario = 22;

  horasCalendario = Array.from(
    { length: 15 },
    (_, i) => i + 8
  );

  formulario: EventoFormulario = this.formularioVacio();

  private readonly diasSemana = [
    'DOMINGO',
    'LUNES',
    'MARTES',
    'MIERCOLES',
    'JUEVES',
    'VIERNES',
    'SABADO'
  ];

  ngOnInit(): void {
    this.cargarDatos();
  }

  private formularioVacio(): EventoFormulario {
    return {
      titulo: '',
      tipo: '',
      descripcion: '',
      fecha: this.fechaLocal(new Date()),
      horaInicio: '09:00',
      horaFin: '10:00',
      lugar: '',
      responsableId: null
    };
  }

  private fechaLocal(fecha: Date): string {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');

    return `${anio}-${mes}-${dia}`;
  }

  private obtenerInicioSemana(fecha: Date): Date {
    const resultado = new Date(
      fecha.getFullYear(),
      fecha.getMonth(),
      fecha.getDate()
    );

    const diferencia = resultado.getDay() === 0
      ? -6
      : 1 - resultado.getDay();

    resultado.setDate(resultado.getDate() + diferencia);

    return resultado;
  }

  get dias(): DiaCalendario[] {
    return Array.from({ length: 7 }, (_, i) => {
      const fecha = new Date(this.inicioSemana);
      fecha.setDate(fecha.getDate() + i);

      return {
        fecha: this.fechaLocal(fecha),
        fechaDate: fecha,
        nombre: this.diasSemana[fecha.getDay()],
        numero: fecha.getDate(),
        esHoy: this.fechaLocal(fecha) === this.fechaLocal(new Date())
      };
    });
  }

  get tituloSemana(): string {
    const fin = new Date(this.inicioSemana);
    fin.setDate(fin.getDate() + 6);

    const inicioTexto = this.inicioSemana.toLocaleDateString(
      'es-ES',
      { day: 'numeric', month: 'long' }
    );

    const finTexto = fin.toLocaleDateString(
      'es-ES',
      { day: 'numeric', month: 'long', year: 'numeric' }
    );

    return `${inicioTexto} - ${finTexto}`;
  }

  cambiarSemana(direccion: number): void {
    const nuevaFecha = new Date(this.inicioSemana);

    nuevaFecha.setDate(
      nuevaFecha.getDate() + (direccion * 7)
    );

    this.inicioSemana = nuevaFecha;
    this.cargarEventos();
  }

  irHoy(): void {
    this.inicioSemana = this.obtenerInicioSemana(new Date());
    this.cargarEventos();
  }

  cargarDatos(): void {
    this.cargando = true;
    this.error = '';

    this.grupoService.listar('ACTIVO').subscribe({
      next: grupos => {
        this.grupos = grupos ?? [];
        this.cargarHorarios();
      },
      error: err => {
        console.error('Error al cargar grupos:', err);
        this.error = 'No se pudieron cargar los grupos.';
        this.cargando = false;
      }
    });

    this.tipoEventoService.listar().subscribe({
      next: data => this.tiposEvento = data ?? [],
      error: err => console.error('Error al cargar tipos:', err)
    });

    this.usuarioService.listarSenseis().subscribe({
      next: data => {
        this.responsables = (data ?? []).filter(
          usuario => usuario.estado?.toUpperCase() === 'ACTIVO'
        );
      },
      error: err => console.error('Error al cargar responsables:', err)
    });

    this.cargarEventos();
  }

  private cargarHorarios(): void {
    this.grupoHorarioService.listar().subscribe({
      next: data => {
        const gruposActivos = new Set(
          this.grupos.map(grupo => grupo.id)
        );

        this.horarios = (data ?? []).filter(
          horario => gruposActivos.has(horario.grupoId)
        );

        this.cargando = false;
      },
      error: err => {
        console.error('Error al cargar horarios:', err);
        this.error = 'No se pudieron cargar los horarios de los grupos.';
        this.cargando = false;
      }
    });
  }

  cargarEventos(): void {
    const inicio = this.fechaLocal(this.inicioSemana);

    const finDate = new Date(this.inicioSemana);
    finDate.setDate(finDate.getDate() + 6);

    const fin = this.fechaLocal(finDate);

    this.cargandoEventos = true;

    this.eventoService.listarPorRango(inicio, fin).subscribe({
      next: data => {
        this.eventos = data ?? [];
        this.cargandoEventos = false;
      },
      error: err => {
        console.error('Error al cargar eventos:', err);
        this.cargandoEventos = false;
      }
    });
  }

  horariosDelDia(dia: DiaCalendario): GrupoHorarioResponse[] {
    return this.horarios.filter(
      horario => this.normalizarDia(horario.diaSemana) === dia.nombre
    );
  }

  eventosDelDia(dia: DiaCalendario): EventoResponse[] {
    return this.eventos.filter(
      evento => evento.fecha === dia.fecha
    );
  }

  private normalizarDia(dia: string): string {
    return dia
      ?.normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase() ?? '';
  }

  formatDia(dia: string): string {
    const nombres: Record<string, string> = {
      LUNES: 'LUN',
      MARTES: 'MAR',
      MIERCOLES: 'MIÉ',
      JUEVES: 'JUE',
      VIERNES: 'VIE',
      SABADO: 'SÁB',
      DOMINGO: 'DOM'
    };

    return nombres[this.normalizarDia(dia)] ?? dia;
  }

  formatHora(hora: string): string {
    return hora?.substring(0, 5) ?? '--:--';
  }

  posicionTop(hora: string): number {
    const [h, m] = hora.split(':').map(Number);

    return Math.max(
      0,
      (h * 60 + m) - this.horaInicioCalendario * 60
    );
  }

  alturaTarjeta(inicio: string, fin: string): number {
    const minutos = this.posicionTop(fin) - this.posicionTop(inicio);

    return Math.max(35, minutos);
  }

  nombreMes(fecha: Date): string {
    return fecha.toLocaleDateString('es-ES', {
      month: 'long',
      year: 'numeric'
    });
  }

  get totalEventos(): number {
    return this.eventos.filter(
      evento => evento.estado === 'ACTIVO'
    ).length;
  }

  abrirNuevoEvento(fecha?: string): void {
    this.eventoEditando = null;
    this.formulario = this.formularioVacio();

    if (fecha) {
      this.formulario.fecha = fecha;
    }

    this.mensajeExito = '';
    this.mostrarModal = true;
  }

  abrirEditarEvento(evento: EventoResponse): void {
    this.eventoEditando = evento;

    this.formulario = {
      titulo: evento.titulo,
      tipo: evento.tipo ?? '',
      descripcion: evento.descripcion ?? '',
      fecha: evento.fecha,
      horaInicio: this.formatHora(evento.horaInicio),
      horaFin: this.formatHora(evento.horaFin),
      lugar: evento.lugar ?? '',
      responsableId: evento.responsableId
    };

    this.mensajeExito = '';
    this.mostrarModal = true;
  }

  cerrarModal(): void {
    if (this.guardando) return;

    this.mostrarModal = false;
    this.eventoEditando = null;
  }

  guardarEvento(): void {
    if (this.guardando) return;

    if (
      !this.formulario.titulo.trim() ||
      !this.formulario.tipo ||
      !this.formulario.fecha ||
      !this.formulario.horaInicio ||
      !this.formulario.horaFin
    ) {
      this.error = 'Completa los campos obligatorios del evento.';
      return;
    }

    if (this.formulario.horaInicio >= this.formulario.horaFin) {
      this.error = 'La hora de inicio debe ser anterior a la hora de fin.';
      return;
    }

    const datos: EventoRequest = {
      titulo: this.formulario.titulo.trim(),
      tipo: this.formulario.tipo,
      descripcion: this.formulario.descripcion.trim(),
      fecha: this.formulario.fecha,
      horaInicio: this.formulario.horaInicio,
      horaFin: this.formulario.horaFin,
      lugar: this.formulario.lugar.trim(),
      responsableId: this.formulario.responsableId
    };

    this.guardando = true;
    this.error = '';

    const peticion = this.eventoEditando
      ? this.eventoService.actualizar(this.eventoEditando.id, datos)
      : this.eventoService.crear(datos);

    peticion.subscribe({
      next: () => {
        this.guardando = false;
        this.mostrarModal = false;
        this.eventoEditando = null;
        this.mensajeExito = 'Evento guardado correctamente.';
        this.cargarEventos();
      },
      error: err => {
        console.error('Error al guardar evento:', err);

        this.guardando = false;
        this.error =
          err.error?.message ||
          err.error?.error ||
          'No se pudo guardar el evento.';
      }
    });
  }

  cambiarEstadoEvento(evento: EventoResponse): void {
    const nuevoEstado = evento.estado === 'ACTIVO'
      ? 'CANCELADO'
      : 'ACTIVO';

    this.eventoService.cambiarEstado(
      evento.id,
      nuevoEstado
    ).subscribe({
      next: () => {
        this.cargarEventos();
      },
      error: err => {
        console.error('Error al cambiar estado:', err);
        this.error = 'No se pudo cambiar el estado del evento.';
      }
    });
  }

  confirmarEliminar(evento: EventoResponse): void {
    this.eventoEliminar = evento;
    this.mostrarModalEliminar = true;
  }

  cerrarModalEliminar(): void {
    this.mostrarModalEliminar = false;
    this.eventoEliminar = null;
  }

  eliminarEvento(): void {
    if (!this.eventoEliminar) return;

    const id = this.eventoEliminar.id;

    this.eventoService.eliminar(id).subscribe({
      next: () => {
        this.cerrarModalEliminar();
        this.cargarEventos();
        this.mensajeExito = 'Evento eliminado correctamente.';
      },
      error: err => {
        console.error('Error al eliminar evento:', err);
        this.error = 'No se pudo eliminar el evento.';
        this.cerrarModalEliminar();
      }
    });
  }
}
