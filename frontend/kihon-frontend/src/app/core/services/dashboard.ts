
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

import { EstudianteResponse } from '../../models/estudiante-response';
import { GrupoResponse } from '../../models/grupo-response';
import { AsistenciaResponse } from '../../models/asistencia-response';
import { EventoResponse } from '../../models/evento-response';

@Injectable({
    providedIn: 'root'
})
export class DashboardService {

    private readonly http = inject(HttpClient);
    private readonly apiUrl = environment.apiUrl;

    getStudents(): Observable<EstudianteResponse[]> {
        return this.http.get<EstudianteResponse[]>(
            `${this.apiUrl}/estudiantes`
        );
    }

    getActiveGroups(): Observable<GrupoResponse[]> {
        return this.http.get<GrupoResponse[]>(
            `${this.apiUrl}/grupos`,
            {
                params: {
                    estado: 'ACTIVO'
                }
            }
        );
    }

    getAttendanceByDate(date: string): Observable<AsistenciaResponse[]> {
        return this.http.get<AsistenciaResponse[]>(
            `${this.apiUrl}/asistencias/fecha/${date}`
        );
    }

    getEventsByDateRange(
        startDate: string,
        endDate: string
    ): Observable<EventoResponse[]> {
        return this.http.get<EventoResponse[]>(
            `${this.apiUrl}/eventos`,
            {
                params: {
                    fechaInicio: startDate,
                    fechaFin: endDate
                }
            }
        );
    }
}
