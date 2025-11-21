import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; // 🔥 Agregado
import { FormsModule, NgForm } from '@angular/forms';
import { Firestore, doc, setDoc, serverTimestamp } from '@angular/fire/firestore';
import { Auth, createUserWithEmailAndPassword, updateProfile } from '@angular/fire/auth';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-crearusuario',
  templateUrl: './crearusuario.html',
  styleUrls: ['./crearusuario.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule] // 🔥 Agregado CommonModule
})
export class Crearusuario {
  // ✅ Propiedades para el formulario
  nombre = '';
  correo = '';
  password = '';
  rango = '';

  // ✅ Datos del usuario actual (para el header)
  usuarioNombre = 'Admin';
  usuarioRango = 'admin';

  constructor(
    private firestore: Firestore,
    private auth: Auth,
    private router: Router
  ) {}

  async crearUsuario(usuarioForm: NgForm) {
    if (!usuarioForm.valid) {
      alert('Por favor completa todos los campos.');
      return;
    }

    const { nombre, correo, password, rango } = usuarioForm.value;

    try {
      // ✅ 1. Crear usuario en Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(this.auth, correo, password);
      const user = userCredential.user;

      // ✅ 2. Actualizar nombre visible en Auth
      await updateProfile(user, { displayName: nombre });

      // ✅ 3. Guardar datos en Firestore con el mismo UID
      await setDoc(doc(this.firestore, 'users', user.uid), {
        uid: user.uid,
        nombre,
        correo,
        rango,
        createdAt: serverTimestamp()
      });

      console.log('✅ Usuario registrado y guardado en Firestore con UID:', user.uid);
      alert(`Usuario "${nombre}" creado correctamente con rango "${rango}".`);

      usuarioForm.resetForm();
      this.router.navigate(['/menu']); // Redirige al menú

    } catch (error: any) {
      console.error('❌ Error al registrar usuario:', error);
      if (error.code === 'auth/email-already-in-use') {
        alert('Este correo ya está registrado.');
      } else if (error.code === 'auth/weak-password') {
        alert('La contraseña debe tener al menos 6 caracteres.');
      } else {
        alert('Error al crear usuario: ' + error.message);
      }
    }
  }

  // ✅ Métodos auxiliares
  puedeVer(ruta: string): boolean {
    const permisos: { [key: string]: string[] } = {
      alertasvecinales: ['admin', 'camaras'],
      camarassolicitadas: ['admin', 'camaras'],
      mapa: ['admin', 'camaras', 'usuario'],
      multas: ['admin', 'multas'],
      crearusuario: ['admin']
    };

    return permisos[ruta]?.includes(this.usuarioRango);
  }

  isCurrentRoute(route: string): boolean {
    return this.router.url === route;
  }

  volver(): void {
    this.router.navigate(['/menu']);
  }

  cerrarSesion(): void {
    console.log('Cerrar sesión');
    this.router.navigate(['/login']);
  }
}