import { Injectable } from '@angular/core';
import { Auth, onAuthStateChanged, User } from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { BehaviorSubject } from 'rxjs';

export interface Usuario {
  uid: string;
  correo: string;
  nombre?: string;
  rango?: string;
  createdAt?: any;
}

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private usuarioSubject = new BehaviorSubject<Usuario | null>(null);
  usuario$ = this.usuarioSubject.asObservable();
  private usuarioActual: Usuario | null = null;

  constructor(private auth: Auth, private firestore: Firestore) {
    // 🔹 Recuperar sesión desde localStorage al iniciar el servicio
    this.recuperarSesion();

    // 🔹 Escuchar cambios de autenticación en Firebase
    onAuthStateChanged(this.auth, async (user: User | null) => {
      if (user) {
        console.log('👤 Usuario autenticado:', user.email);
        await this.cargarDatosUsuario(user.uid);
      } else {
        console.log('🚪 Sesión cerrada');
        this.usuarioSubject.next(null);
        this.usuarioActual = null;
        this.limpiarSesion();
      }
    });
  }

  /** 🔹 Recupera la sesión almacenada en localStorage */
  private recuperarSesion() {
    const usuarioGuardado = localStorage.getItem('usuario');
    if (usuarioGuardado) {
      const usuario = JSON.parse(usuarioGuardado);
      this.usuarioActual = usuario;
      this.usuarioSubject.next(usuario);
      console.log('✅ Sesión recuperada:', usuario);
    }
  }

  /** 🔹 Guarda la sesión en localStorage */
  private guardarSesion(usuario: Usuario) {
    localStorage.setItem('usuario', JSON.stringify(usuario));
  }

  /** 🔹 Limpia la sesión en localStorage */
  private limpiarSesion() {
    localStorage.removeItem('usuario');
  }

  /** 🔹 Carga el documento del usuario desde Firestore */
  async cargarDatosUsuario(uid: string) {
    try {
      const userDocRef = doc(this.firestore, `users/${uid}`);
      const userSnap = await getDoc(userDocRef);

      if (!userSnap.exists()) {
        console.warn('⚠️ Usuario no encontrado en Firestore');
        return;
      }

      const data = userSnap.data() as any;
      const usuario: Usuario = {
        uid,
        correo: data.correo,
        nombre: data.nombre || '',
        rango: data.rango || 'desconocido',
        createdAt: data.createdAt
      };

      this.usuarioActual = usuario;
      this.usuarioSubject.next(usuario);
      this.guardarSesion(usuario);
      console.log('✅ Usuario cargado:', usuario);
    } catch (error) {
      console.error('❌ Error al cargar datos del usuario:', error);
    }
  }

  /** 🔹 Retorna el usuario actual (sin necesidad de suscribirse) */
  get usuario(): Usuario | null {
    return this.usuarioActual;
  }

  /** 🔹 Cierra sesión completamente */
  async cerrarSesion() {
    await this.auth.signOut();
    this.usuarioSubject.next(null);
    this.usuarioActual = null;
    this.limpiarSesion();
  }
}