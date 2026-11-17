import {
  Component,
  OnInit,
  inject,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { EstudianteService } from '../../../core/services/estudiante';
import { ApoderadoService } from '../../../core/services/apoderado';

import { EstudianteResponse } from '../../../models/estudiante-response';
import { EstudianteApoderadoResponse } from '../../../models/estudiante-apoderado-response';

@Component({
  selector: 'app-estudiantes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './estudiantes.html',
  styleUrl: './estudiantes.scss'
})
export class Estudiantes implements OnInit {

  private readonly estudianteService = inject(EstudianteService);
  private readonly apoderadoService = inject(ApoderadoService);
  private readonly cdr = inject(ChangeDetectorRef);

  estudiantes: EstudianteResponse[] = [];
  estudiantesFiltrados: EstudianteResponse[] = [];

  // MODAL DE APODERADOS
mostrarModalApoderados = false;
cargandoApoderados = false;
errorApoderados = '';
relacionesApoderados: EstudianteApoderadoResponse[] = [];
estudianteSeleccionado: EstudianteResponse | null = null;

  cargando = false;
  error = '';

  busqueda = '';
  filtroEdad = 'TODOS';
  filtroCinturon = 'TODOS';
  filtroEstado = 'TODOS';

  paginaActual = 1;
  estudiantesPorPagina = 10;

    // MODAL DE REGISTRO
  mostrarModalRegistro = false;
  guardando = false;
  guardandoEdicion = false;
  errorFormulario = '';
  mensajeExito = '';

  // MODAL DE EDICIÓN
mostrarModalEdicion = false;
estudianteEditando: EstudianteResponse | null = null;

fotoActualUrl: string | null = null;
nuevaFotoEdicion: File | null = null;
quitarFoto = false;


  nuevaFoto: File | null = null;

  // DATOS DEL APODERADO
nuevoApoderado = {
  nombre: '',
  apellido: '',
  tipoDocumento: 'DNI',
  documento: '',
  telefono: '',
  correo: '',
  direccion: '',
  parentesco: 'PADRE'
};

  nuevoEstudiante = {
    
    nombre: '',
    apellido: '',
    tipoDocumento: 'DNI',
    documento: '',
    fechaNacimiento: '',
    telefono: '',
    correo: '',
    direccion: '',
    cinturon: 'BLANCO'
  };

  ngOnInit(): void {
    this.cargarEstudiantes();
  }

  cargarEstudiantes(): void {
    this.cargando = true;
    this.error = '';

    this.estudianteService.listar().subscribe({
      next: (data) => {
        this.estudiantes = data ?? [];
        this.aplicarFiltros();
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar estudiantes:', err);
        this.error = 'No se pudieron cargar los estudiantes.';
        this.cargando = false;
      }
    });
  }

  aplicarFiltros(): void {
    const termino = this.busqueda.trim().toLowerCase();

    this.estudiantesFiltrados = this.estudiantes.filter(estudiante => {
      const coincideBusqueda =
        !termino ||
        estudiante.nombre.toLowerCase().includes(termino) ||
        estudiante.apellido.toLowerCase().includes(termino) ||
        (estudiante.documento ?? '').toLowerCase().includes(termino);

      const edad = this.calcularEdad(estudiante.fechaNacimiento);

      const coincideEdad =
        this.filtroEdad === 'TODOS' ||
        (this.filtroEdad === 'MENORES' && edad < 18) ||
        (this.filtroEdad === 'MAYORES' && edad >= 18);

      const coincideCinturon =
        this.filtroCinturon === 'TODOS' ||
        estudiante.cinturon === this.filtroCinturon;

      const coincideEstado =
        this.filtroEstado === 'TODOS' ||
        estudiante.estado === this.filtroEstado;

      return coincideBusqueda &&
        coincideEdad &&
        coincideCinturon &&
        coincideEstado;
    });

    this.paginaActual = 1;
  }

  calcularEdad(fechaNacimiento: string | null): number {
    if (!fechaNacimiento) return 0;

    const nacimiento = new Date(`${fechaNacimiento}T00:00:00`);
    const hoy = new Date();

    let edad = hoy.getFullYear() - nacimiento.getFullYear();

    const diferenciaMes = hoy.getMonth() - nacimiento.getMonth();

    if (
      diferenciaMes < 0 ||
      (diferenciaMes === 0 && hoy.getDate() < nacimiento.getDate())
    ) {
      edad--;
    }

    return edad;
  }

  get totalPaginas(): number {
    return Math.ceil(
      this.estudiantesFiltrados.length / this.estudiantesPorPagina
    );
  }

  get estudiantesPaginados(): EstudianteResponse[] {
    const inicio = (this.paginaActual - 1) * this.estudiantesPorPagina;

    return this.estudiantesFiltrados.slice(
      inicio,
      inicio + this.estudiantesPorPagina
    );
  }

  cambiarPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas) return;

    this.paginaActual = pagina;
  }

  
verApoderados(estudiante: EstudianteResponse): void {
  this.estudianteSeleccionado = estudiante;
  this.mostrarModalApoderados = true;
  this.cargandoApoderados = true;
  this.errorApoderados = '';
  this.relacionesApoderados = [];

  this.apoderadoService.listarPorEstudiante(estudiante.id).subscribe({
    next: (relaciones: EstudianteApoderadoResponse[]) => {
      this.relacionesApoderados = relaciones;
      this.cargandoApoderados = false;
      this.cdr.detectChanges();
    },
    error: (err) => {
      console.error('Error al consultar apoderados:', err);

      this.errorApoderados = 'No se pudieron cargar los apoderados.';
      this.cargandoApoderados = false;

      this.cdr.detectChanges();
    }
  });
}


  abrirRegistro(): void {
  this.nuevoEstudiante = {
      nombre: '',
      apellido: '',
      tipoDocumento: 'DNI',
      documento: '',
      fechaNacimiento: '',
      telefono: '',
      correo: '',
      direccion: '',
      cinturon: 'BLANCO'
      
    };
    this.mensajeExito = '';
    this.nuevaFoto = null;
    this.errorFormulario = '';
    this.mostrarModalRegistro = true;
}

editarEstudiante(estudiante: EstudianteResponse): void {
   this.estudianteEditando = estudiante;

  this.fotoActualUrl = estudiante.fotoUrl;
  this.nuevaFotoEdicion = null;
  this.quitarFoto = false;
  this.errorFormulario = '';
  this.mensajeExito = '';

  this.nuevoEstudiante = {
    nombre: estudiante.nombre,
    apellido: estudiante.apellido,
    tipoDocumento: estudiante.tipoDocumento || 'DNI',
    documento: estudiante.documento || '',
    fechaNacimiento: estudiante.fechaNacimiento || '',
    telefono: estudiante.telefono || '',
    correo: estudiante.correo || '',
    direccion: estudiante.direccion || '',
    cinturon: estudiante.cinturon || 'BLANCO'
  };

  this.mostrarModalEdicion = true;
}

  cerrarModalRegistro(): void {
    if (this.guardando) return;

    this.mostrarModalRegistro = false;
    this.errorFormulario = '';
  }

  seleccionarFoto(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      this.nuevaFoto = input.files[0];
    }
  }

 
registrarEstudiante(): void {
  this.guardando = true;
  this.errorFormulario = '';

  const datos = new FormData();

  datos.append('nombre', this.nuevoEstudiante.nombre);
  datos.append('apellido', this.nuevoEstudiante.apellido);
  datos.append('tipoDocumento', this.nuevoEstudiante.tipoDocumento);
  datos.append('documento', this.nuevoEstudiante.documento);
  datos.append('fechaNacimiento', this.nuevoEstudiante.fechaNacimiento);
  datos.append('telefono', this.nuevoEstudiante.telefono);
  datos.append('correo', this.nuevoEstudiante.correo);
  datos.append('direccion', this.nuevoEstudiante.direccion);
  datos.append('cinturon', this.nuevoEstudiante.cinturon);

  if (this.nuevaFoto) {
    datos.append('foto', this.nuevaFoto);
  }

  this.estudianteService.crear(datos).subscribe({
    next: (estudiante) => {

      // Verificar si el estudiante es menor de edad
      const esMenor = this.calcularEdad(
        this.nuevoEstudiante.fechaNacimiento
      ) < 18;

      // Si es mayor de edad, finalizar el registro
      if (!esMenor) {
        this.finalizarRegistroEstudiante();
        return;
      }

      // Preparar datos del apoderado
      const datosApoderado = new FormData();

      datosApoderado.append('nombre', this.nuevoApoderado.nombre);
      datosApoderado.append('apellido', this.nuevoApoderado.apellido);
      datosApoderado.append('tipoDocumento', this.nuevoApoderado.tipoDocumento);
      datosApoderado.append('documento', this.nuevoApoderado.documento);
      datosApoderado.append('telefono', this.nuevoApoderado.telefono);
      datosApoderado.append('direccion', this.nuevoApoderado.direccion);
      datosApoderado.append('parentesco', this.nuevoApoderado.parentesco);

      if (this.nuevoApoderado.correo.trim()) {
        datosApoderado.append('correo', this.nuevoApoderado.correo);
      }

      // Registrar apoderado asociado al estudiante
      this.apoderadoService.crear(
        estudiante.id,
        datosApoderado
      ).subscribe({
        next: () => {
          this.finalizarRegistroEstudiante();
        },
        error: (err) => {
          console.error('Error al registrar apoderado:', err);

          this.guardando = false;
          this.mostrarModalRegistro = false;
          this.cargarEstudiantes();

          this.mensajeExito =
            'El estudiante se registró, pero no se pudo registrar su apoderado. No vuelvas a registrar al estudiante; revisa el error del apoderado.';
        }
      });
    },

    error: (err) => {
      console.error('Error al registrar estudiante:', err);

      this.errorFormulario =
        err.error?.message ||
        'No se pudo registrar el estudiante. Verifica los datos.';

      this.guardando = false;
    }
  });
}




private finalizarRegistroEstudiante(): void {
  this.guardando = false;

  this.mostrarModalRegistro = false;

  this.nuevoApoderado = {
    nombre: '',
    apellido: '',
    tipoDocumento: 'DNI',
    documento: '',
    telefono: '',
    correo: '',
    direccion: '',
    parentesco: 'PADRE'
  };

  this.mensajeExito = 'Estudiante y apoderado registrados correctamente.';

  this.cargarEstudiantes();

  this.cdr.detectChanges();
}


  cerrarModalEdicion(): void {
  if (this.guardando) return;

  this.mostrarModalEdicion = false;
  this.estudianteEditando = null;
  this.errorFormulario = '';
}

seleccionarFotoEdicion(event: Event): void {
  const input = event.target as HTMLInputElement;

  if (input.files && input.files.length > 0) {
    this.nuevaFotoEdicion = input.files[0];
    this.quitarFoto = false;
  }
}




actualizarEstudiante(): void {
  if (!this.estudianteEditando) return;

  this.guardandoEdicion = true;
  this.errorFormulario = '';
  this.mensajeExito = '';

  const id = this.estudianteEditando.id;
  const datos = new FormData();

  datos.append('nombre', this.nuevoEstudiante.nombre);
  datos.append('apellido', this.nuevoEstudiante.apellido);
  datos.append('documento', this.nuevoEstudiante.documento);
  datos.append('telefono', this.nuevoEstudiante.telefono);
  datos.append('correo', this.nuevoEstudiante.correo);
  datos.append('cinturon', this.nuevoEstudiante.cinturon);
  datos.append('quitarFoto', String(this.quitarFoto));

  if (this.nuevaFotoEdicion) {
    datos.append('foto', this.nuevaFotoEdicion);
  }

  this.estudianteService.actualizar(id, datos).subscribe({
    next: (respuesta) => {
      // Actualizar el estudiante en la tabla
      this.estudiantes = this.estudiantes.map(estudiante =>
        estudiante.id === respuesta.id ? respuesta : estudiante
      );

      this.aplicarFiltros();

      // Cerrar el modal
      this.mostrarModalEdicion = false;
      this.estudianteEditando = null;
      this.guardandoEdicion = false;

      // Mostrar mensaje de éxito
      this.mensajeExito = 'Estudiante actualizado correctamente.';

      this.cdr.detectChanges();
    },

    error: (err) => {
      console.error('Error al actualizar estudiante:', err);

      this.errorFormulario =
        err.error?.message ||
        'No se pudo actualizar el estudiante. Verifica los datos.';

      this.guardandoEdicion = false;
      this.cdr.detectChanges();
    }
  });
}


cambiarEstadoEstudiante(estudiante: EstudianteResponse): void {
  const nuevoEstado = estudiante.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';

  this.estudianteService.cambiarEstado(estudiante.id, nuevoEstado).subscribe({
    next: (respuesta) => {
      this.estudiantes = this.estudiantes.map(item =>
        item.id === respuesta.id ? respuesta : item
      );

      this.aplicarFiltros();

      this.mensajeExito = `Estudiante ${nuevoEstado.toLowerCase()} correctamente.`;

      this.cdr.detectChanges();
    },
    error: (err) => {
      console.error('Error al cambiar estado:', err);

      this.error = 'No se pudo cambiar el estado del estudiante.';
      this.cdr.detectChanges();
    }
  });
}






}
