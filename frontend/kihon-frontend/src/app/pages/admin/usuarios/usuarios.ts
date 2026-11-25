
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

import {
  UsuarioService,
  UsuarioEstudianteRequest,
  UsuarioRequest
} from '../../../core/services/usuario';
import { UsuarioResponse } from '../../../models/usuario-response';

import { EstudianteService } from '../../../core/services/estudiante';
import { EstudianteResponse } from '../../../models/estudiante-response';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.scss'
})
export class Usuarios implements OnInit {

  private readonly usuarioService = inject(UsuarioService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly estudianteService = inject(EstudianteService);

  usuarios: UsuarioResponse[] = [];
  usuariosFiltrados: UsuarioResponse[] = [];
  
  
  // Estudiantes sin cuenta
  estudiantesSinCuenta: EstudianteResponse[] = [];

  cargandoEstudiantes = false;
  errorEstudiantes = '';

  cargando = false;
  error = '';

  busqueda = '';
  filtroRol = 'TODOS';
  filtroEstado = 'TODOS';

  mostrarModal = false;

  // Modal para registrar un usuario nuevo
mostrarModalRegistro = false;

  // ==========================================
// REGISTRO DE CUENTA PARA ESTUDIANTE
// ==========================================

estudianteSeleccionadoId: number | null = null;

nuevoUsername = '';
nuevaPassword = '';
nuevoGenero = '';

guardandoCuenta = false;
errorModal = '';
mensajeExito = '';
mensajeAccion = '';
errorAccion = '';


// ==========================================
// REGISTRO DE USUARIO NUEVO
// ==========================================

nuevoUsuario = {
  username: '',
  password: '',
  nombre: '',
  apellido: '',
  tipoDocumento: '',
  numeroDocumento: '',
  telefono: '',
  fechaNacimiento: '',
  genero: '',
  correo: ''
};

codigoPais = '+51';

mostrarPassword = false;

guardandoRegistro = false;

erroresRegistro: Record<string, string> = {};

intentoEnviarRegistro = false;

  usuariosProcesando: number[] = [];


  // ==========================================
// MODAL DE CONFIRMACIÓN DE ELIMINACIÓN
// ==========================================

usuarioPendienteEliminar: UsuarioResponse | null = null;

eliminandoUsuario = false;

errorEliminacion = '';


  // ==========================================
// EDICIÓN DE USUARIO
// ==========================================

mostrarModalEdicion = false;

usuarioEditando: UsuarioResponse | null = null;

guardandoEdicion = false;

errorEdicion = '';
mensajeEdicion = '';

nuevoUsuarioEdicion = {
  username: '',
  rol: '',
  password: '',
  confirmarPassword: '',
  nombre: '',
  apellido: '',
  tipoDocumento: '',
  numeroDocumento: '',
  telefono: '',
  fechaNacimiento: '',
  genero: '',
  correo: ''
};

codigoPaisEdicion = '+51';

fotoEdicion: File | null = null;
fotoPreviewEdicion: string | null = null;

mostrarPasswordEdicion = false;

  ngOnInit(): void {
  this.cargarUsuarios();
  this.cargarEstudiantesSinCuenta();
}

// ==========================================
// ABRIR MODAL DE EDICIÓN
// ==========================================

abrirEdicion(usuario: UsuarioResponse): void {

  this.usuarioEditando = usuario;

  this.errorEdicion = '';
  this.mensajeEdicion = '';

  this.fotoEdicion = null;
  this.fotoPreviewEdicion = usuario.foto || null;

  this.mostrarPasswordEdicion = false;

  this.nuevoUsuarioEdicion = {
    username: usuario.username || '',
    rol: usuario.rol || '',
    password: '',
    confirmarPassword: '',
    nombre: usuario.nombre || '',
    apellido: usuario.apellido || '',
    tipoDocumento: usuario.tipoDocumento || '',
    numeroDocumento: usuario.numeroDocumento || '',
    telefono: usuario.telefono || '',
    fechaNacimiento: usuario.fechaNacimiento || '',
    genero: usuario.genero || '',
    correo: usuario.correo || ''
  };

  this.separarTelefonoEdicion(usuario.telefono);

  this.mostrarModalEdicion = true;

  this.cdr.detectChanges();
}

private separarTelefonoEdicion(telefono: string | null): void {
  const valor = (telefono || '').trim();

  const codigos = ['+51', '+57', '+56', '+54', '+55'];

  const codigoEncontrado = codigos.find(codigo =>
    valor.startsWith(codigo)
  );

  this.codigoPaisEdicion = codigoEncontrado || '+51';

  this.nuevoUsuarioEdicion.telefono = codigoEncontrado
    ? valor.substring(codigoEncontrado.length).replace(/\D/g, '')
    : valor.replace(/\D/g, '');
}

// ==========================================
// CERRAR MODAL DE EDICIÓN
// ==========================================

cerrarEdicion(): void {

  if (this.guardandoEdicion) return;

  this.mostrarModalEdicion = false;

  this.usuarioEditando = null;

  this.fotoEdicion = null;
  this.fotoPreviewEdicion = null;

  this.errorEdicion = '';
  this.mensajeEdicion = '';

  this.mostrarPasswordEdicion = false;
}



// ==========================================
// SELECCIONAR FOTO PARA EDICIÓN
// ==========================================

seleccionarFotoEdicion(event: Event): void {

  const input = event.target as HTMLInputElement;
  const archivo = input.files?.[0];

  if (!archivo) return;

  this.fotoEdicion = archivo;

  const lector = new FileReader();

  lector.onload = () => {
    this.fotoPreviewEdicion = lector.result as string;
    this.cdr.detectChanges();
  };

  lector.readAsDataURL(archivo);
}

// ==========================================
// GUARDAR EDICIÓN DE USUARIO
// ==========================================

guardarEdicion(): void {

  if (!this.usuarioEditando || this.guardandoEdicion) {
    return;
  }

  this.errorEdicion = '';
  this.mensajeEdicion = '';

  // Comprobar que las contraseñas coincidan
  const password = this.nuevoUsuarioEdicion.password;

  if (
    password &&
    password !== this.nuevoUsuarioEdicion.confirmarPassword
  ) {
    this.errorEdicion = 'Las contraseñas no coinciden.';
    return;
  }

  this.guardandoEdicion = true;

  const datos = new FormData();

  // Datos de acceso
  datos.append('username', this.nuevoUsuarioEdicion.username.trim());
  datos.append('rol', this.nuevoUsuarioEdicion.rol);

  // Solo enviar contraseña si se desea cambiar
  if (password && password.trim() !== '') {
    datos.append('password', password);
  }

  // Datos personales
  datos.append('nombre', this.nuevoUsuarioEdicion.nombre.trim());
  datos.append('apellido', this.nuevoUsuarioEdicion.apellido.trim());
  datos.append('tipoDocumento', this.nuevoUsuarioEdicion.tipoDocumento);
  datos.append('numeroDocumento', this.nuevoUsuarioEdicion.numeroDocumento.trim());

  // Código de país + número telefónico
  const telefonoCompleto =
    this.codigoPaisEdicion + this.nuevoUsuarioEdicion.telefono.trim();

  datos.append('telefono', telefonoCompleto);

  datos.append(
    'fechaNacimiento',
    this.nuevoUsuarioEdicion.fechaNacimiento
  );

  datos.append('genero', this.nuevoUsuarioEdicion.genero);
  datos.append('correo', this.nuevoUsuarioEdicion.correo.trim());

  // Fotografía opcional
  if (this.fotoEdicion) {
    datos.append('foto', this.fotoEdicion);
  }

  const usuarioId = this.usuarioEditando.id;

  this.usuarioService.actualizar(usuarioId, datos).subscribe({

    next: (respuesta) => {

      // Actualizar usuario en la lista
      this.usuarios = this.usuarios.map(usuario =>
        usuario.id === respuesta.id ? respuesta : usuario
      );

      // Actualizar tabla y filtros
      this.aplicarFiltros();

      this.guardandoEdicion = false;

      // Cerrar modal
      this.cerrarEdicion();

      this.mensajeAccion = 'Usuario actualizado correctamente.';
      this.errorAccion = '';

      this.cdr.detectChanges();
    },

    error: (err: HttpErrorResponse) => {

  console.error('ERROR AL ACTUALIZAR USUARIO');
  console.error('Estado HTTP:', err.status);
  console.error('Respuesta del servidor:', err.error);
  console.error('Mensaje:', err.message);

  this.errorEdicion =
    typeof err.error === 'string'
      ? err.error
      : err.error?.message ||
        err.error?.error ||
        'No se pudieron guardar los cambios del usuario.';

  this.guardandoEdicion = false;

  this.cdr.detectChanges();
}

  });
}


  // ==========================================
// CARGAR ESTUDIANTES SIN CUENTA
// ==========================================

cargarEstudiantesSinCuenta(): void {

  this.cargandoEstudiantes = true;
  this.errorEstudiantes = '';

  this.estudianteService.listar('ACTIVO').subscribe({
    next: (estudiantes) => {

      this.estudiantesSinCuenta = estudiantes.filter(estudiante =>
        !this.usuarios.some(
          usuario => usuario.estudianteId === estudiante.id
        )
      );

      this.cargandoEstudiantes = false;
      this.cdr.detectChanges();
    },

    error: (err: HttpErrorResponse) => {

      console.error('Error al cargar estudiantes:', err);

      this.errorEstudiantes =
        'No se pudieron cargar los estudiantes sin cuenta.';

      this.cargandoEstudiantes = false;
      this.cdr.detectChanges();
    }
  });
}

// ==========================================
// ACTUALIZAR ESTUDIANTES SIN CUENTA
// ==========================================

actualizarEstudiantesSinCuenta(): void {

  this.estudiantesSinCuenta = this.estudiantesSinCuenta.filter(
    estudiante =>
      !this.usuarios.some(
        usuario => usuario.estudianteId === estudiante.id
      )
  );
}

  // ==========================================
  // CARGAR USUARIOS
  // ==========================================

  cargarUsuarios(): void {
    this.cargando = true;
    this.error = '';

    this.usuarioService.listar().subscribe({
      next: (respuesta) => {
        this.usuarios = respuesta;
        this.actualizarEstudiantesSinCuenta();
        this.aplicarFiltros();
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error al cargar usuarios:', err);

        this.error =
          err.error?.message ||
          'No se pudieron cargar los usuarios.';

        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }


  // ==========================================
// ACTIVAR / DESACTIVAR USUARIO
// ==========================================

cambiarEstadoUsuario(usuario: UsuarioResponse): void {

  const nuevoEstado =
    usuario.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';

  this.mensajeAccion = '';
  this.errorAccion = '';

  if (this.usuariosProcesando.includes(usuario.id)) {
    return;
  }

  this.usuariosProcesando.push(usuario.id);

  this.usuarioService.cambiarEstado(
    usuario.id,
    nuevoEstado
  ).subscribe({

    next: (respuesta) => {

      this.usuarios = this.usuarios.map(u =>
        u.id === respuesta.id ? respuesta : u
      );

      this.aplicarFiltros();

      this.mensajeAccion =
        `Usuario ${nuevoEstado === 'ACTIVO' ? 'activado' : 'desactivado'} correctamente.`;

      this.usuariosProcesando =
        this.usuariosProcesando.filter(id => id !== usuario.id);

      this.cdr.detectChanges();
    },

    error: (err: HttpErrorResponse) => {

      console.error('Error al cambiar estado:', err);

      this.errorAccion =
        err.error?.message ||
        'No se pudo cambiar el estado del usuario.';

      this.usuariosProcesando =
        this.usuariosProcesando.filter(id => id !== usuario.id);

      this.cdr.detectChanges();
    }

  });
}


// ==========================================
// ABRIR CONFIRMACIÓN DE ELIMINACIÓN
// ==========================================

eliminarUsuario(usuario: UsuarioResponse): void {

  if (this.usuariosProcesando.includes(usuario.id)) {
    return;
  }

  this.usuarioPendienteEliminar = usuario;
  this.errorEliminacion = '';
}


// ==========================================
// CANCELAR ELIMINACIÓN
// ==========================================

cancelarEliminacion(): void {

  if (this.eliminandoUsuario) return;

  this.usuarioPendienteEliminar = null;
  this.errorEliminacion = '';
}


// ==========================================
// CONFIRMAR ELIMINACIÓN
// ==========================================

confirmarEliminacion(): void {

  const usuario = this.usuarioPendienteEliminar;

  if (!usuario || this.eliminandoUsuario) return;

  this.errorEliminacion = '';
  this.mensajeAccion = '';
  this.errorAccion = '';

  this.eliminandoUsuario = true;
  this.usuariosProcesando.push(usuario.id);

  this.usuarioService.eliminar(usuario.id).subscribe({

    next: () => {

      this.usuarios = this.usuarios.filter(
        u => u.id !== usuario.id
      );

      this.aplicarFiltros();

      this.actualizarEstudiantesSinCuenta();

      this.mensajeAccion = 'Usuario eliminado correctamente.';

      this.usuarioPendienteEliminar = null;
      this.eliminandoUsuario = false;

      this.usuariosProcesando =
        this.usuariosProcesando.filter(id => id !== usuario.id);

      this.cdr.detectChanges();
    },

    error: (err: HttpErrorResponse) => {

      console.error('Error al eliminar usuario:', err);

      this.errorEliminacion =
        err.error?.message ||
        'No se pudo eliminar el usuario.';

      this.eliminandoUsuario = false;

      this.usuariosProcesando =
        this.usuariosProcesando.filter(id => id !== usuario.id);

      this.cdr.detectChanges();
    }

  });
}

  


  // ==========================================
  // APLICAR FILTROS
  // ==========================================

  aplicarFiltros(): void {
    const texto = this.busqueda.trim().toLowerCase();

    this.usuariosFiltrados = this.usuarios.filter(usuario => {

      const coincideBusqueda =
        `${usuario.nombre} ${usuario.apellido}`.toLowerCase().includes(texto) ||
        usuario.username.toLowerCase().includes(texto) ||
        (usuario.numeroDocumento || '').toLowerCase().includes(texto) ||
        (usuario.correo || '').toLowerCase().includes(texto);

      const coincideRol =
        this.filtroRol === 'TODOS' ||
        usuario.rol === this.filtroRol;

      const coincideEstado =
        this.filtroEstado === 'TODOS' ||
        usuario.estado === this.filtroEstado;

      return coincideBusqueda && coincideRol && coincideEstado;
    });
  }

  // ==========================================
  // ESTADÍSTICAS
  // ==========================================

  get totalUsuarios(): number {
    return this.usuarios.length;
  }

  get usuariosActivos(): number {
    return this.usuarios.filter(u => u.estado === 'ACTIVO').length;
  }

  get usuariosInactivos(): number {
    return this.usuarios.filter(u => u.estado === 'INACTIVO').length;
  }

  get usuariosPendientes(): number {
    return this.usuarios.filter(u => u.estado === 'PENDIENTE').length;
  }



 // ==========================================
// MODAL DE REGISTRO
// ==========================================

abrirRegistro(estudiante?: EstudianteResponse): void {

  this.mostrarModal = true;

  this.estudianteSeleccionadoId = estudiante?.id ?? null;

  this.nuevoUsername = '';
  this.nuevaPassword = '';
  this.nuevoGenero = '';

  this.errorModal = '';
}

cerrarModal(): void {

  if (this.guardandoCuenta) return;

  this.mostrarModal = false;
  this.estudianteSeleccionadoId = null;

  this.nuevoUsername = '';
  this.nuevaPassword = '';
  this.nuevoGenero = '';

  this.errorModal = '';
}


// ==========================================
// GUARDAR CUENTA DE ESTUDIANTE
// ==========================================

guardarCuentaEstudiante(): void {

  if (this.estudianteSeleccionadoId === null) {
    this.errorModal = 'Debes seleccionar un estudiante.';
    return;
  }

  if (!this.nuevoUsername.trim()) {
    this.errorModal = 'El nombre de usuario es obligatorio.';
    return;
  }

  if (!this.nuevaPassword) {
    this.errorModal = 'La contraseña es obligatoria.';
    return;
  }

  if (this.nuevaPassword.length < 8) {
    this.errorModal = 'La contraseña debe tener al menos 8 caracteres.';
    return;
  }

  if (!this.nuevoGenero) {
    this.errorModal = 'Debes seleccionar el género.';
    return;
  }

  const datos: UsuarioEstudianteRequest = {
    estudianteId: this.estudianteSeleccionadoId,
    username: this.nuevoUsername.trim(),
    password: this.nuevaPassword,
    genero: this.nuevoGenero
  };

  this.guardandoCuenta = true;
  this.errorModal = '';

  this.usuarioService.crearCuentaParaEstudiante(datos).subscribe({

    next: (respuesta) => {

      // Agregar el nuevo usuario
      this.usuarios = [...this.usuarios, respuesta];

      // Actualizar tabla y estadísticas
      this.aplicarFiltros();

      // Retirar estudiante de la tabla inferior
      this.estudiantesSinCuenta =
        this.estudiantesSinCuenta.filter(
          estudiante =>
            estudiante.id !== respuesta.estudianteId
        );

      this.guardandoCuenta = false;

      // Cerrar modal
      this.mostrarModal = false;

      this.estudianteSeleccionadoId = null;
      this.nuevoUsername = '';
      this.nuevaPassword = '';
      this.nuevoGenero = '';

      this.mensajeExito =
        'La cuenta del estudiante se creó correctamente.';

      this.cdr.detectChanges();
    },

    error: (err: HttpErrorResponse) => {

      console.error('Error al crear cuenta:', err);

      this.errorModal =
        err.error?.message ||
        'No se pudo crear la cuenta. Verifica los datos.';

      this.guardandoCuenta = false;

      this.cdr.detectChanges();
    }

  });
}




  // ==========================================
  // REGISTRO DE USUARIO NUEVO
  // ==========================================

  abrirRegistroUsuario(): void {
    this.nuevoUsuario = {
      username: '',
      password: '',
      nombre: '',
      apellido: '',
      tipoDocumento: '',
      numeroDocumento: '',
      telefono: '',
      fechaNacimiento: '',
      genero: '',
      correo: ''
    };

    this.codigoPais = '+51';
    this.mostrarPassword = false;
    this.erroresRegistro = {};
    this.intentoEnviarRegistro = false;
    this.mostrarModalRegistro = true;
  }

  cerrarRegistroUsuario(): void {
    if (this.guardandoRegistro) return;

    this.mostrarModalRegistro = false;
    this.erroresRegistro = {};
    this.intentoEnviarRegistro = false;
  }

  // ==========================================
  // VALIDAR FORMULARIO
  // ==========================================

  validarRegistro(): boolean {
    const errores: Record<string, string> = {};
    const u = this.nuevoUsuario;

    // Username
    if (!u.username.trim()) {
      errores['username'] = 'El usuario es obligatorio.';
    } else if (u.username.trim().length < 4 || u.username.trim().length > 30) {
      errores['username'] = 'Debe tener entre 4 y 30 caracteres.';
    } else if (!/^[a-zA-Z0-9._-]+$/.test(u.username.trim())) {
      errores['username'] = 'Solo se permiten letras, números, puntos, guiones y guiones bajos.';
    }

    // Contraseña
    if (!u.password) {
      errores['password'] = 'La contraseña es obligatoria.';
    } else if (u.password.length < 8 || u.password.length > 72) {
      errores['password'] = 'Debe tener entre 8 y 72 caracteres.';
    }

    // Nombre
    if (!u.nombre.trim()) {
      errores['nombre'] = 'El nombre es obligatorio.';
    } else if (u.nombre.trim().length > 50 || !/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(u.nombre.trim())) {
      errores['nombre'] = 'Ingresa un nombre válido.';
    }

    // Apellido
    if (!u.apellido.trim()) {
      errores['apellido'] = 'El apellido es obligatorio.';
    } else if (u.apellido.trim().length > 50 || !/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(u.apellido.trim())) {
      errores['apellido'] = 'Ingresa un apellido válido.';
    }

    // Tipo de documento
    if (!u.tipoDocumento) {
      errores['tipoDocumento'] = 'Selecciona un tipo de documento.';
    }

    // Número de documento
    if (!u.numeroDocumento.trim()) {
      errores['numeroDocumento'] = 'El documento es obligatorio.';
    } else if (
      u.tipoDocumento === 'DNI' &&
      !/^\d{8}$/.test(u.numeroDocumento.trim())
    ) {
      errores['numeroDocumento'] = 'El DNI debe tener exactamente 8 dígitos.';
    } else if (
      ['CE', 'PASAPORTE'].includes(u.tipoDocumento) &&
      !/^[a-zA-Z0-9]{1,12}$/.test(u.numeroDocumento.trim())
    ) {
      errores['numeroDocumento'] = 'Ingresa un documento válido de hasta 12 caracteres alfanuméricos.';
    }

    // Teléfono
    if (!u.telefono.trim()) {
      errores['telefono'] = 'El teléfono es obligatorio.';
    } else if (!/^\d{7,15}$/.test(u.telefono.trim())) {
      errores['telefono'] = 'Ingresa un teléfono válido.';
    } else if (this.codigoPais === '+51' && !/^\d{9}$/.test(u.telefono.trim())) {
      errores['telefono'] = 'El teléfono peruano debe tener 9 dígitos.';
    }

    // Fecha de nacimiento
    if (!u.fechaNacimiento) {
      errores['fechaNacimiento'] = 'La fecha de nacimiento es obligatoria.';
    } else if (
      new Date(`${u.fechaNacimiento}T00:00:00`) > new Date(new Date().toDateString())
    ) {
      errores['fechaNacimiento'] = 'La fecha no puede ser futura.';
    }

    // Género
    if (!u.genero) {
      errores['genero'] = 'Selecciona un género.';
    }

    // Correo
    if (!u.correo.trim()) {
      errores['correo'] = 'El correo es obligatorio.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(u.correo.trim())) {
      errores['correo'] = 'Ingresa un correo electrónico válido.';
    }

    this.erroresRegistro = errores;

    return Object.keys(errores).length === 0;
  }

  // ==========================================
  // REGISTRAR USUARIO
  // ==========================================

  guardarUsuario(): void {
    this.intentoEnviarRegistro = true;

    if (!this.validarRegistro()) {
      return;
    }

    const datos: UsuarioRequest = {
      ...this.nuevoUsuario,
      username: this.nuevoUsuario.username.trim(),
      nombre: this.nuevoUsuario.nombre.trim(),
      apellido: this.nuevoUsuario.apellido.trim(),
      tipoDocumento: this.nuevoUsuario.tipoDocumento,
      numeroDocumento: this.nuevoUsuario.numeroDocumento.trim(),
      telefono: `${this.codigoPais}${this.nuevoUsuario.telefono.trim()}`,
      correo: this.nuevoUsuario.correo.trim()
    };

    this.guardandoRegistro = true;

    this.usuarioService.crear(datos).subscribe({
      next: (respuesta) => {
        this.usuarios = [...this.usuarios, respuesta];

        this.aplicarFiltros();

        this.guardandoRegistro = false;
        this.mostrarModalRegistro = false;

        this.mensajeExito = 'Usuario registrado correctamente.';

        this.cdr.detectChanges();
      },

      error: (err: HttpErrorResponse) => {
        console.error('Error al registrar usuario:', err);

        this.erroresRegistro['general'] =
          err.error?.message ||
          'No se pudo registrar el usuario. Verifica los datos.';

        this.guardandoRegistro = false;
        this.cdr.detectChanges();
      }
    });
  }


  // ==========================================
  // FORMATEAR DATOS
  // ==========================================

  obtenerNombreRol(rol: string): string {
    const roles: Record<string, string> = {
      ADMIN: 'Administrador',
      SECRETARIA: 'Secretaría',
      SENSEI: 'Sensei',
      ESTUDIANTE: 'Estudiante'
    };

    return roles[rol] || rol;
  }

  obtenerNombreEstado(estado: string): string {
    const estados: Record<string, string> = {
      ACTIVO: 'Activo',
      INACTIVO: 'Inactivo',
      PENDIENTE: 'Pendiente'
    };

    return estados[estado] || estado;
  }
}
