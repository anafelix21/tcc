import { Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AsignacionTrabajadores, AsignacionTrabajadoresDTO } from '../../../core/models/asignacion.model';
import { AsignacionTrabajadoresService } from '../services/asignacion.service';
import { ActividadCultivoService } from '../../actividades/services/actividad.service';
import { UsuarioService } from '../../usuarios/services/usuario.service';
import { ActividadCultivo } from '../../../core/models/actividad.model';
import { Usuario } from '../../../core/models/usuario.model';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ToggleFilterComponent } from '../../../shared/components/toggle-filter/toggle-filter.component';

@Component({
  selector: 'app-asignaciones',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent, ToggleFilterComponent],
  templateUrl: './asignaciones.component.html',
  styleUrl: './asignaciones.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AsignacionesComponent implements OnInit {
  private asignacionService = inject(AsignacionTrabajadoresService);
  private actividadService = inject(ActividadCultivoService);
  private usuarioService = inject(UsuarioService);
  private notificationService = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  asignaciones: AsignacionTrabajadores[] = [];
  actividades: ActividadCultivo[] = [];
  trabajadores: Usuario[] = [];

  mostrarFormulario = false;
  verActivos = true;

  formData = {
    idActividad: 0,
    horasTrabajadas: 8,
    observacion: ''
  };

  // Inputs temporales para agregar operario al detalle
  tempIdUsuario = 0;
  tempCostoManoObra = 40.0;
  detallesForm: Array<{ idUsuario: number; nombreCompletoUsuario: string; costoManoObra: number; }> = [];

  mostrarConfirmacion = false;
  asignacionAEliminar: number | null = null;
  asignacionSeleccionada: AsignacionTrabajadores | null = null;

  ngOnInit(): void {
    this.cdr.markForCheck();
    this.cargarAsignaciones();
    this.cargarActividades();
    this.cdr.markForCheck();
    this.cargarTrabajadores();
  }

  cargarAsignaciones(): void {
    this.asignacionService.obtenerPorEstado(this.verActivos).subscribe({
      next: (data) => {
        this.asignaciones = data;
        this.cdr.markForCheck();
      },
      error: () => {
        this.asignaciones = [];
        this.cdr.markForCheck();
      }
    });
  }

  cargarActividades(): void {
    this.actividadService.obtenerPorEstado(true).subscribe({
      next: (data) => {
        this.actividades = data;
        this.cdr.markForCheck();
      }
    });
  }

  cargarTrabajadores(): void {
    this.usuarioService.obtenerPorEstado(true).subscribe({
      next: (data) => {
        // Filtrar operarios o trabajadores de campo
        this.trabajadores = data.filter(u => u.rol === 'TRABAJADOR' || u.rol === 'OPERADOR');
        this.cdr.markForCheck();
      }
    });
  }

  toggleActivos(activos: boolean): void {
    this.verActivos = activos;
    this.cargarAsignaciones();
  }

  nuevaAsignacion(): void {
    this.formData = {
      idActividad: this.actividades.length > 0 ? this.actividades[0].idActividad! : 0,
      horasTrabajadas: 8,
      observacion: ''
    };
    this.tempIdUsuario = this.trabajadores.length > 0 ? this.trabajadores[0].idUsuario! : 0;
    this.tempCostoManoObra = 40.0;
    this.detallesForm = [];
    this.mostrarFormulario = true;
  }

  agregarDetalle(): void {
    if (!this.tempIdUsuario) return;
    
    // Validar si el trabajador ya fue agregado localmente
    const existe = this.detallesForm.some(d => d.idUsuario === Number(this.tempIdUsuario));
    if (existe) {
      this.notificationService.show({
        type: 'error',
        message: 'Este trabajador ya ha sido agregado a esta asignación'
      });
      return;
    }

    const t = this.trabajadores.find(u => u.idUsuario === Number(this.tempIdUsuario));
    if (t) {
      this.detallesForm.push({
        idUsuario: Number(this.tempIdUsuario),
        nombreCompletoUsuario: `${t.nombre} ${t.apellido}`,
        costoManoObra: Number(this.tempCostoManoObra)
      });
      // Limpiar inputs temporales
      this.tempCostoManoObra = 40.0;
      this.cdr.markForCheck();
    }
  }

  removerDetalle(index: number): void {
    this.detallesForm.splice(index, 1);
    this.cdr.markForCheck();
  }

  guardarAsignacion(): void {
    if (this.detallesForm.length === 0) {
      this.notificationService.show({
        type: 'error',
        message: 'Debes agregar al menos un trabajador en el detalle'
      });
      return;
    }

    const dto: AsignacionTrabajadoresDTO = {
      idActividad: Number(this.formData.idActividad),
      horasTrabajadas: Number(this.formData.horasTrabajadas),
      observacion: this.formData.observacion || null,
      detalles: this.detallesForm.map(d => ({
        idUsuario: d.idUsuario,
        costoManoObra: d.costoManoObra
      }))
    };

    this.asignacionService.crear(dto).subscribe({
      next: () => {
        this.notificationService.show({ type: 'success', message: 'Asignación de trabajadores guardada con éxito' });
        this.cargarAsignaciones();
        this.cancelarEdicion();
      }
    });
  }

  confirmarEliminar(id: number): void {
    this.asignacionAEliminar = id;
    this.mostrarConfirmacion = true;
  }

  eliminarAsignacion(): void {
    if (this.asignacionAEliminar) {
      this.asignacionService.eliminar(this.asignacionAEliminar).subscribe({
        next: () => {
          this.notificationService.show({ type: 'success', message: 'Asignación removida correctamente' });
          this.cargarAsignaciones();
          this.cancelarConfirmacion();
        }
      });
    }
  }

  restaurarAsignacion(id: number): void {
    this.asignacionService.restaurar(id).subscribe({
      next: () => {
        this.notificationService.show({ type: 'success', message: 'Asignación restaurada correctamente' });
        this.cargarAsignaciones();
      }
    });
  }

  cancelarEdicion(): void {
    this.mostrarFormulario = false;
  }

  cancelarConfirmacion(): void {
    this.mostrarConfirmacion = false;
    this.asignacionAEliminar = null;
  }

  verDetalles(asignacion: AsignacionTrabajadores): void {
    this.asignacionSeleccionada = asignacion;
    this.cdr.markForCheck();
  }

  cerrarDetalles(): void {
    this.asignacionSeleccionada = null;
    this.cdr.markForCheck();
  }

  getTotalHoras(): number {
    return this.asignaciones.reduce((sum, item) => sum + ((item.horasTrabajadas || 0) * (item.detalles?.length || 0)), 0);
  }

  getTotalManoObra(): number {
    return this.asignaciones.reduce((sum, item) => sum + (item.costoTotalManoObra || 0), 0);
  }

  getNombresTrabajadores(detalles?: any[]): string {
    if (!detalles || detalles.length === 0) return 'Sin trabajadores';
    return detalles.map(d => d.nombreCompletoUsuario).join(', ');
  }
}
