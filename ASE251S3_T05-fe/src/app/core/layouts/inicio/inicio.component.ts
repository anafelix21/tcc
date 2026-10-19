import { Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UsuarioService } from '../../../features/usuarios/services/usuario.service';
import { ParcelaService } from '../../../features/parcelas/services/parcela.service';
import { InsumoService } from '../../../features/insumos/services/insumo.service';
import { CultivoService } from '../../../features/cultivos/services/cultivo.service';
import { AuthService } from '../../services/auth.service';
import { Usuario } from '../../models/usuario.model';
import { Parcela } from '../../models/parcela.model';
import { Insumo } from '../../models/insumo.model';
import { Cultivo } from '../../models/cultivo.model';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './inicio.component.html',
  styleUrl: './inicio.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InicioComponent implements OnInit {
  private usuarioService = inject(UsuarioService);
  private parcelaService = inject(ParcelaService);
  private insumoService = inject(InsumoService);
  private cultivoService = inject(CultivoService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  totalUsuarios = 0;
  totalParcelas = 0;
  totalInsumos = 0;
  totalCultivos = 0;

  isAdmin = false;
  isSupervisor = false;
  isSupervisorAlmacen = false;
  isOperador = false;

  currentUserNombre = '';
  currentDate = '';

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.currentUserNombre = user.nombre ? `${user.nombre} ${user.apellido || ''}`.trim() : 'Usuario';
      const role = user.rol ? user.rol.toUpperCase() : '';
      this.isAdmin = role === 'ADMIN';
      this.isSupervisor = role === 'SUPERVISOR';
      this.isSupervisorAlmacen = role === 'SUPERVISOR_ALMACEN';
      this.isOperador = role === 'OPERADOR' || role === 'TRABAJADOR';
    }

    // Formatear la fecha actual en español
    const opciones: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const fecha = new Date();
    this.currentDate = fecha.toLocaleDateString('es-ES', opciones);
    this.currentDate = this.currentDate.charAt(0).toUpperCase() + this.currentDate.slice(1);

    if (this.isAdmin || this.isSupervisor) {
      this.usuarioService.obtenerPorEstado(true).subscribe({ 
        next: (d: Usuario[]) => { this.totalUsuarios = d.length; this.cdr.markForCheck(); }, 
        error: () => {} 
      });
      this.parcelaService.obtenerPorEstado(true).subscribe({ 
        next: (d: Parcela[]) => { this.totalParcelas = d.length; this.cdr.markForCheck(); }, 
        error: () => {} 
      });
      this.insumoService.obtenerPorEstado(true).subscribe({ 
        next: (d: Insumo[]) => { this.totalInsumos = d.length; this.cdr.markForCheck(); }, 
        error: () => {} 
      });
      this.cultivoService.obtenerPorEstado(true).subscribe({ 
        next: (d: Cultivo[]) => { this.totalCultivos = d.length; this.cdr.markForCheck(); }, 
        error: () => {} 
      });
    } else if (this.isSupervisorAlmacen) {
      this.insumoService.obtenerPorEstado(true).subscribe({ 
        next: (d: Insumo[]) => { this.totalInsumos = d.length; this.cdr.markForCheck(); }, 
        error: () => {} 
      });
    }
  }
}
