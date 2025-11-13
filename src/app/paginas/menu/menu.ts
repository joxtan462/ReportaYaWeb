import { Component, OnInit } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Firestore, collection, query, where, getDocs } from '@angular/fire/firestore';
import { Auth, onAuthStateChanged, signOut } from '@angular/fire/auth';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './menu.html',
  styleUrls: ['./menu.css']
})
export class Menu implements OnInit {
  usuarioNombre: string | null = null;
  usuarioRango: string | null = null;
  cargando = true;

  constructor(
    private firestore: Firestore,
    private auth: Auth,
    private router: Router
  ) {}

  async ngOnInit() {
    // 🔹 Primero intentar recuperar desde localStorage
    const usuarioGuardado = localStorage.getItem('usuario');
    if (usuarioGuardado) {
      const u = JSON.parse(usuarioGuardado);
      this.usuarioNombre = u.nombre;
      this.usuarioRango = u.rango;
      console.log('🟢 Usuario desde localStorage:', this.usuarioNombre, this.usuarioRango);
      this.cargando = false;
      return;
    }

    // 🔹 Si no hay usuario en localStorage, verificar sesión con Firebase Auth
    onAuthStateChanged(this.auth, async (user) => {
      if (user) {
        try {
          // Buscar usuario por correo en la colección "users"
          const usuariosRef = collection(this.firestore, 'users');
          const q = query(usuariosRef, where('correo', '==', user.email));
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            const data = querySnapshot.docs[0].data() as any;
            this.usuarioNombre = data.nombre || 'Desconocido';
            this.usuarioRango = data.rango || 'sin-rango';

            // 💾 Guardar en localStorage para próximas cargas
            localStorage.setItem('usuario', JSON.stringify({
              nombre: this.usuarioNombre,
              correo: user.email,
              rango: this.usuarioRango,
              uid: data.uid
            }));

            console.log('✅ Usuario cargado desde Firestore:', this.usuarioNombre, this.usuarioRango);
          } else {
            console.warn('⚠️ No se encontró el usuario en Firestore.');
          }
        } catch (error) {
          console.error('Error al cargar el usuario:', error);
        }
      } else {
        this.router.navigate(['/']);
      }

      this.cargando = false;
    });
  }

  cerrarSesion() {
    signOut(this.auth);
    localStorage.removeItem('usuario'); // 🔹 Limpieza segura
    this.router.navigate(['/']);
  }

  // 🔹 Control centralizado de permisos
  puedeVer(opcion: string): boolean {
    if (this.usuarioRango === 'admin') return true;

    // 🔹 Define las opciones visibles según el rango
    const permisos: Record<string, string[]> = {
      alertas: ['camaras'],
      peticiones: ['camaras'],
      mapa: ['camaras'],
      multas: ['multas']
    };

    return permisos[opcion]?.includes(this.usuarioRango!) ?? false;
  }
}
