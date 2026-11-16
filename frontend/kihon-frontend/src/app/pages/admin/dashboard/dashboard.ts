
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  inject
} from '@angular/core';

import { HttpErrorResponse } from '@angular/common/http';
import { Chart, registerables } from 'chart.js';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { DashboardService } from '../../../core/services/dashboard';

import { EstudianteResponse } from '../../../models/estudiante-response';
import { GrupoResponse } from '../../../models/grupo-response';
import { AsistenciaResponse } from '../../../models/asistencia-response';
import { EventoResponse } from '../../../models/evento-response';

Chart.register(...registerables);

interface LoadResult<T> {
  data: T;
  failed: boolean;
}

@Component({
  selector: 'app-dashboard',
  imports: [],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements AfterViewInit, OnDestroy {

  private readonly dashboardService = inject(DashboardService);

  @ViewChild('weeklyAttendanceChart')
  weeklyCanvas!: ElementRef<HTMLCanvasElement>;

  @ViewChild('beltDistributionChart')
  beltCanvas!: ElementRef<HTMLCanvasElement>;

  private weeklyChart?: Chart;
  private beltChart?: Chart;

  students: EstudianteResponse[] = [];
  groups: GrupoResponse[] = [];
  todayEvents: EventoResponse[] = [];

  totalStudents = 0;
  activeStudents = 0;
  activeGroups = 0;

  currentClass: EventoResponse | null = null;
  nextClass: EventoResponse | null = null;

  isLoading = true;
  errorMessage = '';

  ngAfterViewInit(): void {
    this.loadDashboard();
  }

  ngOnDestroy(): void {
    this.weeklyChart?.destroy();
    this.beltChart?.destroy();
  }

  private loadDashboard(): void {
    const today = this.getLocalDate();
    const weekDates = this.getWeekDates();

    forkJoin({
      students: this.safeRequest(
        this.dashboardService.getStudents(),
        [] as EstudianteResponse[]
      ),

      groups: this.safeRequest(
        this.dashboardService.getActiveGroups(),
        [] as GrupoResponse[]
      ),

      attendance: this.safeRequest(
        forkJoin(
          weekDates.map(date =>
            this.dashboardService.getAttendanceByDate(date)
          )
        ),
        weekDates.map(() => [] as AsistenciaResponse[])
      ),

      events: this.safeRequest(
        this.dashboardService.getEventsByDateRange(today, today),
        [] as EventoResponse[]
      )
    }).subscribe({
      next: (result) => {
        this.students = result.students.data;
        this.groups = result.groups.data;
        this.todayEvents = result.events.data;

        this.totalStudents = this.students.length;

        this.activeStudents = this.students.filter(
          student => student.estado?.toUpperCase() === 'ACTIVO'
        ).length;

        this.activeGroups = this.groups.length;

        this.updateClassStatus();

        this.createWeeklyChart(
          weekDates,
          result.attendance.data
        );

        this.createBeltChart();

        if (
          result.students.failed ||
          result.groups.failed ||
          result.attendance.failed ||
          result.events.failed
        ) {
          this.errorMessage =
            'No se pudieron cargar algunos datos del dashboard. Verifica la conexión con el servidor.';
        }

        this.isLoading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage =
          error.status === 0
            ? 'No se pudo conectar con el servidor Spring Boot.'
            : 'Ocurrió un error al cargar el dashboard.';

        this.isLoading = false;
      }
    });
  }

  private safeRequest<T>(
    request: Observable<T>,
    fallback: T
  ): Observable<LoadResult<T>> {
    return request.pipe(
      map(data => ({
        data,
        failed: false
      })),
      catchError(() => of({
        data: fallback,
        failed: true
      }))
    );
  }

  private createWeeklyChart(
    dates: string[],
    attendanceByDay: AsistenciaResponse[][]
  ): void {

    const groupsMap = new Map<number, {
      name: string;
      values: number[];
    }>();

    attendanceByDay.forEach((attendances, dayIndex) => {
      attendances.forEach(attendance => {

        let group = groupsMap.get(attendance.grupoId);

        if (!group) {
          group = {
            name: attendance.grupoNombre || 'Sin grupo',
            values: Array(7).fill(0)
          };

          groupsMap.set(attendance.grupoId, group);
        }

        group.values[dayIndex]++;
      });
    });

    const datasets = Array.from(groupsMap.values()).map(
      (group, index) => {
        const colors = [
          '#ff2400',
          '#2563eb',
          '#16a34a',
          '#d97706',
          '#7c3aed',
          '#0891b2',
          '#facc15',
          '#e11d48',
          '#f97316',
          '#14b8a6'
        ];

        return {
          label: group.name,
          data: group.values,
          backgroundColor: colors[index % colors.length],
          borderRadius: 5
        };
      }
    );

    const labels = dates.map(date => {
      const [year, month, day] = date.split('-').map(Number);

      return new Date(year, month - 1, day)
        .toLocaleDateString('es-PE', { weekday: 'short' })
        .toUpperCase();
    });

    this.weeklyChart?.destroy();

    this.weeklyChart = new Chart(
      this.weeklyCanvas.nativeElement,
      {
        type: 'bar',
        data: {
          labels,
          datasets
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom'
            },
            tooltip: {
              callbacks: {
                label: context =>
                  `${context.dataset.label}: ${context.parsed.y} asistencias`
              }
            }
          },
          scales: {
            y: {
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

  private createBeltChart(): void {

    const beltsMap = new Map<string, number>();

    this.students.forEach(student => {
      const belt = student.cinturon?.trim() || 'SIN CINTURÓN';

      beltsMap.set(
        belt,
        (beltsMap.get(belt) || 0) + 1
      );
    });

    this.beltChart?.destroy();

    this.beltChart = new Chart(
      this.beltCanvas.nativeElement,
      {
        type: 'doughnut',
        data: {
          labels: Array.from(beltsMap.keys()),
          datasets: [{
            data: Array.from(beltsMap.values()),
            backgroundColor: [
              '#000000',
              '#ff2400',
              '#ffd700',
              '#2563eb',
              '#16a34a',
              '#737373',
              '#d97706',
              '#7c3aed',
              '#0891b2'
            ],
            borderWidth: 2,
            borderColor: '#ffffff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom'
            }
          }
        }
      }
    );
  }

  private updateClassStatus(): void {

    const now = new Date();
    const currentTime = this.getCurrentTime();

    const sortedEvents = [...this.todayEvents]
      .sort((a, b) =>
        a.horaInicio.localeCompare(b.horaInicio)
      );

    this.currentClass = sortedEvents.find(event =>
      event.horaInicio <= currentTime &&
      event.horaFin > currentTime
    ) ?? null;

    this.nextClass = sortedEvents.find(event =>
      event.horaInicio > currentTime
    ) ?? null;
  }

  private getLocalDate(): string {
    const date = new Date();

    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0')
    ].join('-');
  }

  private getCurrentTime(): string {
    const date = new Date();

    return [
      String(date.getHours()).padStart(2, '0'),
      String(date.getMinutes()).padStart(2, '0')
    ].join(':');
  }

  private getWeekDates(): string[] {
    const today = new Date();
    const day = today.getDay();

    const mondayOffset = day === 0 ? -6 : 1 - day;

    const monday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + mondayOffset
    );

    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(
        monday.getFullYear(),
        monday.getMonth(),
        monday.getDate() + index
      );

      return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, '0'),
        String(date.getDate()).padStart(2, '0')
      ].join('-');
    });
  }

  formatEventTime(time: string): string {
    return time.substring(0, 5);
  }

  formatToday(): string {
    return new Date().toLocaleDateString('es-PE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }
}
