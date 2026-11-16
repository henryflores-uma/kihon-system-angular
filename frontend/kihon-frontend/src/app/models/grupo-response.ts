export interface GrupoResponse {
  id: number;
  nombre: string;
  descripcion: string | null;
  capacidad: number;
  estudiantesActivos: number;
  cuposDisponibles: number;
  estado: string;
  senseiId: number | null;
  senseiNombre: string | null;
  frecuenciaId: number | null;
  frecuenciaNombre: string | null;
  frecuenciaSemanal: number | null;
}
