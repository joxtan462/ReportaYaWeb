import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-alertadetalle',
  standalone: true,  // <-- importante si es standalone
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './alertadetalle.html',
  styleUrls: ['./alertadetalle.css']
})
export class Alertadetalle implements OnInit {
  alerta: any = null;

  todasAlertas = [
    { id: '01', prioridad: 'alta', ubicacion: 'Guafo 1002, San Bernardo', fecha: '25/09/2025', nombre: 'Emergencia de seguridad', descripcion: 'Personas peleando en la plaza con cuchillos y muchos gritos', estado: { enProceso: true, enTerreno: true, concluido: false }, local: { inspector1: false, inspector2: false }, derivadoExterno: { carabineros: false, bomberos: false }, privado: true, imagenVideo: 'assets/miniatura.png' },
    { id: '02', prioridad: 'media', ubicacion: 'Calle 123, Santiago', fecha: '24/09/2025', nombre: 'Robo en tienda', descripcion: 'Robo con violencia en local comercial', estado: { enProceso: true, enTerreno: false, concluido: false }, local: { inspector1: true, inspector2: false }, derivadoExterno: { carabineros: true, bomberos: false }, privado: false, imagenVideo: 'assets/miniatura2.png' },
    { id: '03', prioridad: 'Baja', ubicacion: 'Barrio Norte', fecha: '2025-10-01', nombre: 'Carlos Gómez', descripcion: 'Ruido fuerte de madrugada', estado: { enProceso: false, enTerreno: false, concluido: false }, local: { inspector1: false, inspector2: false }, derivadoExterno: { carabineros: false, bomberos: false }, privado: false, imagenVideo: 'assets/miniatura3.png' }
  ];

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      console.log('Alertadetalle - param id:', idParam);

      if (!idParam) {
        console.warn('No se recibió id en la ruta, redirigiendo a lista');
        this.router.navigate(['/alertasvecinales']);
        return;
      }

      // Normalizar el id a 2 dígitos
      const normalizedId = idParam.padStart(2, '0');

      this.alerta = this.todasAlertas.find(a => a.id === normalizedId);

      if (!this.alerta) {
        console.warn('Alerta no encontrada para id=', idParam);
        this.router.navigate(['/alertasvecinales']);
      }
    });
  }

  // MÉTODOS FUERA DEL SUBSCRIBE
  rechazar() {
    if (!this.alerta) return;
    console.log('Alerta rechazada:', this.alerta.id);
    alert(`Alerta ${this.alerta.id} rechazada`);
    // Aquí podrías actualizar alerta.estado o cualquier otra propiedad
  }

  resuelto() {
    if (!this.alerta) return;
    console.log('Alerta resuelta:', this.alerta.id);
    alert(`Alerta ${this.alerta.id} resuelta`);
    // Aquí podrías actualizar alerta.estado.concluido = true
  }
}
