import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'filterAlertas', standalone: true })
export class FilterAlertasPipe implements PipeTransform {
  transform(alertas: any[], filtroNombre: string, filtroDescripcion: string, filtroUbicacion: string, filtroFecha: string) {
    if (!alertas) return [];
    return alertas.filter(alerta =>
      (!filtroNombre || alerta.nombre.toLowerCase().includes(filtroNombre.toLowerCase())) &&
      (!filtroDescripcion || alerta.descripcion.toLowerCase().includes(filtroDescripcion.toLowerCase())) &&
      (!filtroUbicacion || alerta.ubicacion.toLowerCase().includes(filtroUbicacion.toLowerCase())) &&
      (!filtroFecha || alerta.fecha.includes(filtroFecha))
    );
  }
}
