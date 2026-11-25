export interface EventoRequest {
  titulo: string;
  tipo: string;
  descripcion: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  lugar: string;
  responsableId: number | null;
}