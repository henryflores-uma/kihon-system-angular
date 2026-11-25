export interface AsistenciaRequest {
  estudianteId: number;
  grupoId: number;
  fecha: string;
  horaLlegada: string | null;
  estado: string;
  observacion: string | null;
}