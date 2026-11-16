export interface EventoResponse {
  id: number;
  titulo: string;
  tipo: string | null;
  descripcion: string | null;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  lugar: string | null;
  responsableId: number | null;
  responsableNombre: string | null;
  estado: string;
}
