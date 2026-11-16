export interface UsuarioResponse {
  id: number;
  username: string;
  nombre: string;
  apellido: string;
  tipoDocumento: string | null;
  numeroDocumento: string | null;
  telefono: string | null;
  fechaNacimiento: string | null;
  genero: string | null;
  correo: string | null;
  rol: string;
  estado: string;
  foto: string | null;
  estudianteId: number | null;
}
