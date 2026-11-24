


export interface GrupoEstudianteResponse {
  id: number;
  nombre: string;
  descripcion: string | null;
  horarios: HorarioEstudianteResponse[];
  estado: string;
}

export interface HorarioEstudianteResponse {
  diaSemana: string;
  horaInicio: string;
  horaFin: string;
}