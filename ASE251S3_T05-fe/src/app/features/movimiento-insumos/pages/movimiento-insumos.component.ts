import { Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MovimientoInsumo, MovimientoInsumoDTO } from '../../../core/models/movimiento-insumo.model';
import { MovimientoInsumoService } from '../services/movimiento-insumo.service';
import { InsumoService } from '../../insumos/services/insumo.service';
import { UsuarioService } from '../../usuarios/services/usuario.service';
import { Insumo } from '../../../core/models/insumo.model';
import { Usuario } from '../../../core/models/usuario.model';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-movimiento-insumos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './movimiento-insumos.component.html',
  styleUrl: './movimiento-insumos.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MovimientoInsumosComponent implements OnInit {
  private movimientoService = inject(MovimientoInsumoService);
  private insumoService = inject(InsumoService);
  private usuarioService = inject(UsuarioService);
  private notificationService = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  movimientos: MovimientoInsumo[] = [];
  insumos: Insumo[] = [];
  usuarios: Usuario[] = [];

  mostrarFormulario = false;

  formData = {
    idInsumo: 0,
    idUsuario: 0,
    tipoMovimiento: 'ENTRADA',
    motivo: 'COMPRA',
    cantidad: 1,
    precioUnitario: 0,
    referencia: '',
    observacion: ''
  };

  motivosEntrada = ['COMPRA', 'DEVOLUCION', 'DONACION'];
  motivosSalida = ['USO_ACTIVIDAD', 'MERMA', 'VENCIMIENTO', 'PERDIDA'];

  ngOnInit(): void {
    this.cargarMovimientos();
    this.cargarInsumos();
    this.cargarUsuarios();
  }

  cargarMovimientos(): void {
    this.movimientoService.listarTodos().subscribe({
      next: (data) => {
        this.movimientos = data;
        this.cdr.markForCheck();
      },
      error: () => {
        this.movimientos = [];
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

  cargarUsuarios(): void {
    this.usuarioService.obtenerPorEstado(true).subscribe({
      next: (data) => {
        this.usuarios = data;
        this.cdr.markForCheck();
      }
    });
  }

  onInsumoChange(id: number): void {
    const insumoSel = this.insumos.find(i => i.idInsumo === Number(id));
    if (insumoSel) {
      this.formData.precioUnitario = insumoSel.precio;
      this.cdr.markForCheck();
    }
  }

  onTipoChange(): void {
    if (this.formData.tipoMovimiento === 'ENTRADA') {
      this.formData.motivo = 'COMPRA';
    } else {
      this.formData.motivo = 'USO_ACTIVIDAD';
    }
  }

  nuevoMovimiento(): void {
    this.formData = {
      idInsumo: this.insumos.length > 0 ? this.insumos[0].idInsumo! : 0,
      idUsuario: this.usuarios.length > 0 ? this.usuarios[0].idUsuario! : 0,
      tipoMovimiento: 'ENTRADA',
      motivo: 'COMPRA',
      cantidad: 1,
      precioUnitario: this.insumos.length > 0 ? this.insumos[0].precio : 0,
      referencia: '',
      observacion: ''
    };
    this.mostrarFormulario = true;
  }

  guardarMovimiento(): void {
    const dto: MovimientoInsumoDTO = {
      idInsumo: Number(this.formData.idInsumo),
      idUsuario: Number(this.formData.idUsuario),
      tipoMovimiento: this.formData.tipoMovimiento,
      motivo: this.formData.motivo,
      cantidad: this.formData.cantidad,
      precioUnitario: this.formData.precioUnitario,
      referencia: this.formData.referencia || null,
      observacion: this.formData.observacion || null
    };

    // Validar cantidad
    if (dto.cantidad <= 0) {
      this.notificationService.show({ type: 'error', message: 'La cantidad debe ser mayor que cero.' });
      return;
    }

    // Validar stock si es SALIDA
    if (dto.tipoMovimiento === 'SALIDA') {
      const ins = this.insumos.find(i => i.idInsumo === dto.idInsumo);
      if (ins && ins.stock < dto.cantidad) {
        this.notificationService.show({
          type: 'error',
          message: `Stock insuficiente. Disponible: ${ins.stock}, Solicitado: ${dto.cantidad}`
        });
        return;
      }
    }

    this.movimientoService.crear(dto).subscribe({
      next: () => {
        this.notificationService.show({ type: 'success', message: 'Movimiento de inventario guardado con éxito' });
        this.cargarMovimientos();
        this.cargarInsumos(); // Recargar insumos para refrescar los stocks mostrados
        this.cancelarEdicion();
      }
    });
  }

  movimientoSeleccionado: MovimientoInsumo | null = null;

  verDetalles(movimiento: MovimientoInsumo): void {
    this.movimientoSeleccionado = movimiento;
    this.cdr.markForCheck();
  }

  cerrarDetalles(): void {
    this.movimientoSeleccionado = null;
    this.cdr.markForCheck();
  }

  cancelarEdicion(): void {
    this.movimientoSeleccionado = null;
    this.mostrarFormulario = false;
  }

  getTotalEntradas(): number {
    return this.movimientos.filter(m => m.tipoMovimiento === 'ENTRADA').length;
  }

  getTotalSalidas(): number {
    return this.movimientos.filter(m => m.tipoMovimiento === 'SALIDA').length;
  }

  getMotivosDisponibles(): string[] {
    return this.formData.tipoMovimiento === 'ENTRADA' ? this.motivosEntrada : this.motivosSalida;
  }
}
