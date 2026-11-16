export interface EstudianteResponse {
  id: number;
  nombre: string;
  apellido: string;
  tipoDocumento: string | null;
  documento: string | null;
  telefono: string | null;
  correo: string | null;
  fechaNacimiento: string | null;
  direccion: string | null;
  foto: string | null;
  fotoUrl: string | null;
  cinturon: string | null;
  estado: string;
}
