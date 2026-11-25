import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  ChangeDetectorRef,
  ElementRef,
  ViewChild
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

import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

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

export class Reportes implements OnInit, OnDestroy {

  private readonly reporteService = inject(ReporteAsistenciaService);
  private readonly estudianteService = inject(EstudianteService);
  private readonly grupoService = inject(GrupoService);
  private readonly cdr = inject(ChangeDetectorRef);




    // ==========================================
  // GRÁFICOS
  // ==========================================

  @ViewChild('distribucionChart')
  distribucionCanvas!: ElementRef<HTMLCanvasElement>;

  @ViewChild('comparacionChart')
  comparacionCanvas!: ElementRef<HTMLCanvasElement>;

  private graficoDistribucion?: Chart;
  private graficoComparacion?: Chart;


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

  // Renderizar primero los elementos HTML
  this.cdr.detectChanges();

  // Crear los gráficos después de renderizar los canvas
  this.crearGraficos();
}



// ==========================================
// CREAR GRÁFICOS ESTADÍSTICOS
// ==========================================

private crearGraficos(): void {

  if (
    !this.reporte ||
    !this.distribucionCanvas ||
    !this.comparacionCanvas
  ) {
    return;
  }

  // Destruir gráficos anteriores
  this.graficoDistribucion?.destroy();
  this.graficoComparacion?.destroy();

  const datos = this.reporte;

  // ==========================================
  // GRÁFICO DE DONA
  // ==========================================

  this.graficoDistribucion = new Chart(
    this.distribucionCanvas.nativeElement,
    {
      type: 'doughnut',

      data: {
        labels: [
          'Presentes',
          'Tardanzas',
          'Ausentes',
          'Justificados'
        ],

        datasets: [{
          data: [
            datos.presentes,
            datos.tardanzas,
            datos.ausentes,
            datos.justificados
          ],

          backgroundColor: [
            '#22c55e',
            '#f59e0b',
            '#ef4444',
            '#3b82f6'
          ],

          borderWidth: 0,
          hoverOffset: 6
        }]
      },

      options: {
        responsive: true,
        maintainAspectRatio: false,

        plugins: {
          legend: {
            position: 'bottom',

            labels: {
              usePointStyle: true,
              padding: 18
            }
          }
        }
      }
    }
  );

  // ==========================================
  // GRÁFICO DE BARRAS
  // ==========================================

  this.graficoComparacion = new Chart(
    this.comparacionCanvas.nativeElement,
    {
      type: 'bar',

      data: {
        labels: [
          'Presentes',
          'Tardanzas',
          'Ausentes',
          'Justificados'
        ],

        datasets: [{
          label: 'Cantidad de registros',

          data: [
            datos.presentes,
            datos.tardanzas,
            datos.ausentes,
            datos.justificados
          ],

          backgroundColor: [
            '#22c55e',
            '#f59e0b',
            '#ef4444',
            '#3b82f6'
          ],

          borderRadius: 6,
          barThickness: 24
        }]
      },

      options: {
        indexAxis: 'y',

        responsive: true,
        maintainAspectRatio: false,

        plugins: {
          legend: {
            display: false
          }
        },

        scales: {
          x: {
            beginAtZero: true,

            ticks: {
              precision: 0
            }
          }
        }
      }
    }
  );
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

  // ==========================================
// DESTRUIR GRÁFICOS
// ==========================================

ngOnDestroy(): void {
  this.graficoDistribucion?.destroy();
  this.graficoComparacion?.destroy();
}


}
