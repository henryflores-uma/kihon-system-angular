export interface AsistenciaResponse {
  id: number;
  estudianteId: number;
  estudianteNombre: string;
  grupoId: number;
  grupoNombre: string;
  fecha: string;
  horaLlegada: string | null;
  estado: string;
  observacion: string | null;
}