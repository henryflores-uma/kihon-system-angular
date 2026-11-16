
import { Component, OnInit, inject } from '@angular/core';
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

  estudiantes: EstudianteResponse[] = [];
  estudiantesFiltrados: EstudianteResponse[] = [];

  cargando = false;
  error = '';

  busqueda = '';
  filtroEdad = 'TODOS';
  filtroCinturon = 'TODOS';
  filtroEstado = 'TODOS';

  paginaActual = 1;
  estudiantesPorPagina = 10;

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
    this.apoderadoService.listarPorEstudiante(estudiante.id).subscribe({
      next: (relaciones: EstudianteApoderadoResponse[]) => {
        console.log('Apoderados del estudiante:', relaciones);
      },
      error: (err) => {
        console.error('Error al consultar apoderados:', err);
      }
    });
  }

  abrirRegistro(): void {
  console.log('Próximamente: registrar estudiante');
}

editarEstudiante(estudiante: EstudianteResponse): void {
  console.log('Próximamente: editar estudiante', estudiante);
}
}
