
export interface ApoderadoResponse {
  id: number;
  persona: {
    id?: number;
    nombre: string;
    apellido: string;
    tipoDocumento: string | null;
    numeroDocumento: string | null;
    telefono: string | null;
    correo: string | null;
    direccion: string | null;
  };
}
