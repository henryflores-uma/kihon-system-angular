
export interface GrupoHorarioResponse {
  id: number;
  grupoId: number;
  grupoNombre: string;
  senseiNombre: string | null;
  diaSemana: string;
  horaInicio: string;
  horaFin: string;
}
