import {
  Component,
  OnInit,
  inject,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

import { ReporteAsistenciaService } from '../../../core/services/reporte-asistencia';
import { EstudianteService } from '../../../core/services/estudiante';
import { GrupoService } from '../../../core/services/grupo';

import { ReporteAsistenciaResponse } from '../../../models/reporte-asistencia-response';
import { EstudianteResponse } from '../../../models/estudiante-response';
import { GrupoResponse } from '../../../models/grupo-response';

type TipoReporte =
  | 'DIARIO'
  | 'SEMANAL'
  | 'MENSUAL'
  | 'ESTUDIANTE'
  | 'GRUPO';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './reportes.html',
  styleUrl: './reportes.scss'
})
export class Reportes implements OnInit {

  private readonly reporteService = inject(ReporteAsistenciaService);
  private readonly estudianteService = inject(EstudianteService);
  private readonly grupoService = inject(GrupoService);
  private readonly cdr = inject(ChangeDetectorRef);

  // ==========================================
  // DATOS
  // ==========================================

  estudiantes: EstudianteResponse[] = [];
  grupos: GrupoResponse[] = [];

  reporte: ReporteAsistenciaResponse | null = null;

  // ==========================================
  // ESTADOS
  // ==========================================

  cargando = false;
  cargandoCatalogos = false;

  error = '';
  errorCatalogos = '';

  // ==========================================
  // FILTROS
  // ==========================================

  tipoReporte: TipoReporte = 'DIARIO';

  fecha = this.obtenerFechaActual();

  fechaInicio = this.obtenerFechaActual();
  fechaFin = this.obtenerFechaActual();

  anio = new Date().getFullYear();
  mes = new Date().getMonth() + 1;

  estudianteId: number | null = null;
  grupoId: number | null = null;

  // ==========================================
  // INICIALIZACIÓN
  // ==========================================

  ngOnInit(): void {
    this.cargarCatalogos();
  }

  // ==========================================
  // CARGAR ESTUDIANTES Y GRUPOS
  // ==========================================

  
cargarCatalogos(): void {

  this.cargandoCatalogos = true;
  this.errorCatalogos = '';

  this.estudianteService.listar('ACTIVO').subscribe({
    next: (respuesta) => {
      this.estudiantes = respuesta;
      this.cdr.detectChanges();
    },
    error: (err) => {
      console.error('Error al cargar estudiantes:', err);

      this.errorCatalogos =
        'No se pudieron cargar los estudiantes.';

      this.cdr.detectChanges();
    }
  });

  this.grupoService.listar('ACTIVO').subscribe({
    next: (respuesta) => {
      this.grupos = respuesta;

      this.cargandoCatalogos = false;

      // Actualizar inmediatamente el estado del botón
      this.cdr.detectChanges();
    },
    error: (err) => {
      console.error('Error al cargar grupos:', err);

      this.errorCatalogos =
        'No se pudieron cargar los grupos.';

      this.cargandoCatalogos = false;

      this.cdr.detectChanges();
    }
  });
}


  // ==========================================
  // GENERAR REPORTE
  // ==========================================

  generarReporte(): void {

    this.error = '';
    this.reporte = null;

    if (!this.validarFiltros()) {
      return;
    }

    this.cargando = true;

    switch (this.tipoReporte) {

      case 'DIARIO':

        this.reporteService
          .obtenerReporteDiario(this.fecha)
          .subscribe({
            next: (respuesta) => this.procesarReporte(respuesta),
            error: (err) => this.manejarError(err)
          });

        break;

      case 'SEMANAL':

        this.reporteService
          .obtenerReporteSemanal(
            this.fechaInicio,
            this.fechaFin
          )
          .subscribe({
            next: (respuesta) => this.procesarReporte(respuesta),
            error: (err) => this.manejarError(err)
          });

        break;

      case 'MENSUAL':

        this.reporteService
          .obtenerReporteMensual(
            this.anio,
            this.mes
          )
          .subscribe({
            next: (respuesta) => this.procesarReporte(respuesta),
            error: (err) => this.manejarError(err)
          });

        break;

      case 'ESTUDIANTE':

        this.reporteService
          .obtenerReportePorEstudiante(this.estudianteId!)
          .subscribe({
            next: (respuesta) => this.procesarReporte(respuesta),
            error: (err) => this.manejarError(err)
          });

        break;

      case 'GRUPO':

        this.reporteService
          .obtenerReportePorGrupo(this.grupoId!)
          .subscribe({
            next: (respuesta) => this.procesarReporte(respuesta),
            error: (err) => this.manejarError(err)
          });

        break;
    }
  }

  // ==========================================
  // VALIDAR FILTROS
  // ==========================================

  private validarFiltros(): boolean {

    switch (this.tipoReporte) {

      case 'DIARIO':

        if (!this.fecha) {
          this.error = 'Selecciona una fecha.';
          return false;
        }

        break;

      case 'SEMANAL':

        if (!this.fechaInicio || !this.fechaFin) {
          this.error = 'Selecciona las fechas del período.';
          return false;
        }

        if (this.fechaInicio > this.fechaFin) {
          this.error = 'La fecha inicial no puede ser posterior a la fecha final.';
          return false;
        }

        break;

      case 'MENSUAL':

        if (
          !this.anio ||
          this.anio < 2000 ||
          !this.mes ||
          this.mes < 1 ||
          this.mes > 12
        ) {
          this.error = 'Selecciona un año y mes válidos.';
          return false;
        }

        break;

      case 'ESTUDIANTE':

        if (this.estudianteId === null) {
          this.error = 'Selecciona un estudiante.';
          return false;
        }

        break;

      case 'GRUPO':

        if (this.grupoId === null) {
          this.error = 'Selecciona un grupo.';
          return false;
        }

        break;
    }

    return true;
  }

  // ==========================================
  // PROCESAR RESPUESTA
  // ==========================================

  private procesarReporte(
  respuesta: ReporteAsistenciaResponse
): void {

  console.log('Reporte recibido:', respuesta);

  this.reporte = respuesta;
  this.cargando = false;
  this.error = '';

  // Actualizar inmediatamente la vista
  this.cdr.detectChanges();
}

  // ==========================================
  // MANEJAR ERRORES
  // ==========================================

  private manejarError(err: HttpErrorResponse): void {

  console.error('Error al generar reporte:', err);

  this.cargando = false;

  this.error =
    err.error?.mensaje ||
    err.error?.message ||
    'No se pudo generar el reporte. Intenta nuevamente.';

  this.cdr.detectChanges();
}

  // ==========================================
  // FECHA ACTUAL
  // ==========================================

  private obtenerFechaActual(): string {

    const fecha = new Date();

    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');

    return `${anio}-${mes}-${dia}`;
  }

  // ==========================================
  // CAMBIAR TIPO DE REPORTE
  // ==========================================

  cambiarTipoReporte(): void {

    this.reporte = null;
    this.error = '';

    this.estudianteId = null;
    this.grupoId = null;
  }

  // ==========================================
  // FORMATEAR ESTADO
  // ==========================================

  obtenerNombreEstado(estado: string): string {

    const estados: Record<string, string> = {
      PRESENTE: 'Presente',
      TARDANZA: 'Tardanza',
      AUSENTE: 'Ausente',
      JUSTIFICADO: 'Justificado'
    };

    return estados[estado] || estado;
  }

}
