
import { AsistenciaResponse } from './asistencia-response';

export interface ReporteAsistenciaResponse {
  fechaInicio: string | null;
  fechaFin: string | null;

  total: number;
  presentes: number;
  tardanzas: number;
  ausentes: number;
  justificados: number;

  porcentajeAsistencia: number;

  asistencias: AsistenciaResponse[];
}
