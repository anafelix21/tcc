import { Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActividadCultivo, ActividadCultivoDTO, DetalleActividad } from '../../../core/models/actividad.model';
import { ActividadCultivoService } from '../services/actividad.service';
import { CultivoService } from '../../cultivos/services/cultivo.service';
import { InsumoService } from '../../insumos/services/insumo.service';
import { Cultivo } from '../../../core/models/cultivo.model';
import { Insumo } from '../../../core/models/insumo.model';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ToggleFilterComponent } from '../../../shared/components/toggle-filter/toggle-filter.component';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-actividades',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent, ToggleFilterComponent],
  templateUrl: './actividades.component.html',
  styleUrl: './actividades.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ActividadesComponent implements OnInit {
  private actividadService = inject(ActividadCultivoService);
  private cultivoService = inject(CultivoService);
  private insumoService = inject(InsumoService);
  private notificationService = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);
  private authService = inject(AuthService);

  actividades: ActividadCultivo[] = [];
  cultivos: Cultivo[] = [];
  insumos: Insumo[] = [];

  mostrarFormulario = false;
  verActivos = true;
  isOperador = false;

  // Form Model
  formData = {
    idCultivo: 0,
    tipoActividad: 'RIEGO',
    descripcion: '',
    detalles: [] as DetalleActividad[]
  };

  tiposActividad = ['RIEGO', 'FUMIGACION', 'ABONADO', 'COSECHA', 'PODA', 'DESHIERBE', 'SIEMBRA', 'OTRO'];

  mostrarConfirmacion = false;
  actividadAEliminar: number | null = null;
  actividadSeleccionada: ActividadCultivo | null = null;

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.isOperador = user ? (user.rol.toUpperCase() === 'OPERADOR' || user.rol.toUpperCase() === 'TRABAJADOR') : false;
    this.cargarActividades();
    if (!this.isOperador) {
      this.cargarCultivos();
      this.cargarInsumos();
    }
  }

  cargarActividades(): void {
    if (this.isOperador) {
      const user = this.authService.getCurrentUser();
      if (user && user.idUsuario) {
        this.actividadService.obtenerPorUsuario(user.idUsuario, this.verActivos).subscribe({
          next: (data) => {
            this.actividades = data;
            this.cdr.markForCheck();
          },
          error: () => {
            this.actividades = [];
            this.cdr.markForCheck();
          }
        });
      }
    } else {
      this.actividadService.obtenerPorEstado(this.verActivos).subscribe({
        next: (data) => {
          this.actividades = data;
          this.cdr.markForCheck();
        },
        error: () => {
          this.actividades = [];
          this.cdr.markForCheck();
        }
      });
    }
  }

  cargarCultivos(): void {
    this.cultivoService.obtenerPorEstado(true).subscribe({
      next: (data) => {
        this.cultivos = data;
        this.cdr.markForCheck();
      }
    });
  }

  cargarInsumos(): void {
    this.insumoService.obtenerPorEstado(true).subscribe({
      next: (data) => {
        this.insumos = data;
        this.cdr.markForCheck();
      }
    });
  }

  toggleActivos(activos: boolean): void {
    this.verActivos = activos;
    this.cargarActividades();
  }

  nuevaActividad(): void {
    this.formData = {
      idCultivo: this.cultivos.length > 0 ? this.cultivos[0].idCultivo! : 0,
      tipoActividad: 'RIEGO',
      descripcion: '',
      detalles: []
    };
    this.mostrarFormulario = true;
  }

  agregarDetalle(): void {
    if (this.insumos.length === 0) {
      this.notificationService.show({ type: 'warning', message: 'No hay insumos activos disponibles' });
      return;
    }
    const primerInsumo = this.insumos[0];
    this.formData.detalles.push({
      idInsumo: primerInsumo.idInsumo!,
      nombreInsumo: primerInsumo.nombre,
      cantidad: 1,
      precioUnitario: primerInsumo.precio,
      subtotal: primerInsumo.precio
    });
    this.cdr.markForCheck();
  }

  eliminarDetalle(index: number): void {
    this.formData.detalles.splice(index, 1);
    this.cdr.markForCheck();
  }

  onInsumoChange(index: number, idInsumo: number): void {
    const ins = this.insumos.find(i => i.idInsumo === Number(idInsumo));
    if (ins) {
      const det = this.formData.detalles[index];
      det.nombreInsumo = ins.nombre;
      det.precioUnitario = ins.precio;
      det.subtotal = ins.precio * det.cantidad;
      this.cdr.markForCheck();
    }
  }

  onCantidadChange(index: number): void {
    const det = this.formData.detalles[index];
    if (det.cantidad < 1) {
      det.cantidad = 1;
    }
    if (det.precioUnitario) {
      det.subtotal = det.precioUnitario * det.cantidad;
    }
    this.cdr.markForCheck();
  }

  getCostoTotalCalculado(): number {
    return this.formData.detalles.reduce((sum, item) => sum + (item.subtotal || 0), 0);
  }

  guardarActividad(): void {
    // Validar duplicados de insumos
    const ids = this.formData.detalles.map(d => d.idInsumo);
    if (new Set(ids).size !== ids.length) {
      this.notificationService.show({ type: 'error', message: 'No puedes agregar el mismo insumo más de una vez' });
      return;
    }

    // Validar stock físico
    for (const det of this.formData.detalles) {
      const ins = this.insumos.find(i => i.idInsumo === Number(det.idInsumo));
      if (ins && ins.stock < det.cantidad) {
        this.notificationService.show({
          type: 'error',
          message: `Stock insuficiente para ${ins.nombre}. Disponible: ${ins.stock}, Solicitado: ${det.cantidad}`
        });
        return;
      }
    }

    const user = this.authService.getCurrentUser();
    const dto: ActividadCultivoDTO = {
      idCultivo: Number(this.formData.idCultivo),
      idUsuario: user && user.idUsuario ? Number(user.idUsuario) : 0,
      tipoActividad: this.formData.tipoActividad,
      descripcion: this.formData.descripcion,
      detalles: this.formData.detalles.map(d => ({
        idInsumo: Number(d.idInsumo),
        cantidad: Number(d.cantidad)
      }))
    };

    this.actividadService.crear(dto).subscribe({
      next: () => {
        this.notificationService.show({ type: 'success', message: 'Actividad y consumo de insumos registrados' });
        this.cargarActividades();
        this.cargarInsumos(); // Recargar insumos para actualizar stock disponible
        this.cancelarEdicion();
      }
    });
  }

  confirmarEliminar(id: number): void {
    this.actividadAEliminar = id;
    this.mostrarConfirmacion = true;
  }

  eliminarActividad(): void {
    if (this.actividadAEliminar) {
      this.actividadService.eliminar(this.actividadAEliminar).subscribe({
        next: () => {
          this.notificationService.show({ type: 'success', message: 'Actividad dada de baja correctamente' });
          this.cargarActividades();
          this.cancelarConfirmacion();
        }
      });
    }
  }

  restaurarActividad(id: number): void {
    this.actividadService.restaurar(id).subscribe({
      next: () => {
        this.notificationService.show({ type: 'success', message: 'Actividad restaurada con éxito' });
        this.cargarActividades();
      }
    });
  }

  confirmarTerminacion(act: ActividadCultivo): void {
    const user = this.authService.getCurrentUser();
    if (user && user.idUsuario) {
      this.actividadService.confirmarTerminacion(act.idActividad!, user.idUsuario).subscribe({
        next: () => {
          this.notificationService.show({ type: 'success', message: '¡Labor finalizada! Consumo registrado y Kardex generado' });
          this.cargarActividades();
          this.cargarInsumos(); // Recargar insumos para refrescar stocks
        },
        error: (err) => {
          this.notificationService.show({ type: 'error', message: err.error?.message || 'Error al finalizar la actividad' });
        }
      });
    }
  }

  cancelarEdicion(): void {
    this.mostrarFormulario = false;
  }

  cancelarConfirmacion(): void {
    this.mostrarConfirmacion = false;
    this.actividadAEliminar = null;
  }

  verDetalles(act: ActividadCultivo): void {
    this.actividadSeleccionada = act;
    this.cdr.markForCheck();
  }

  cerrarDetalles(): void {
    this.actividadSeleccionada = null;
    this.cdr.markForCheck();
  }

  getInsumoStock(idInsumo: number): string {
    const ins = this.insumos.find(i => i.idInsumo === Number(idInsumo));
    return ins ? `${ins.stock} ${ins.unidadMedida}` : '0';
  }
}
