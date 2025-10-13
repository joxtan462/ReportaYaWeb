import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filterMultas'
})
export class FilterMultasPipe implements PipeTransform {

  transform(multas: any[], filtroFecha: string, filtroInfraccion: string, filtroComentarios: string, filtroUbicacion: string, filtroPatente: string): any[] {
    if (!multas) return [];
    
    return multas.filter(multa => {
      const coincideFecha = multa.fecha.toLowerCase().includes(filtroFecha?.toLowerCase() || '');
      const coincideInfraccion = multa.infraccion.toLowerCase().includes(filtroInfraccion?.toLowerCase() || '');
      const coincideComentarios = multa.comentarios.toLowerCase().includes(filtroComentarios?.toLowerCase() || '');
      const coincideUbicacion = multa.ubicacion.toLowerCase().includes(filtroUbicacion?.toLowerCase() || '');
      const coincidePatente = multa.patente.toLowerCase().includes(filtroPatente?.toLowerCase() || '');
      return coincideFecha && coincideInfraccion && coincideComentarios && coincideUbicacion && coincidePatente;
    });
  }

}

