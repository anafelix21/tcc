import { Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Insumo, InsumoForm } from '../../../core/models/insumo.model';
import { InsumoService } from '../services/insumo.service';
import { NotificationService } from '../../../core/services/notification.service';
import { InsumoFormComponent } from '../components/insumo-form/insumo-form.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ToggleFilterComponent } from '../../../shared/components/toggle-filter/toggle-filter.component';

@Component({
  selector: 'app-insumos',
  standalone: true,
  imports: [CommonModule, FormsModule, InsumoFormComponent, ConfirmDialogComponent, ToggleFilterComponent],
  templateUrl: './insumos.component.html',
  styleUrl: './insumos.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InsumosComponent implements OnInit {
  private insumoService = inject(InsumoService);
  private notificationService = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  insumos: Insumo[] = [];
  insumoEditar: Insumo | null = null;
  mostrarFormulario = false;
  verActivos = true;
  nombreFiltro = '';
  tipoFiltro = '';

  // Paginación
  paginado = true;
  page = 0;
  size = 5;
  totalPages = 0;
  totalElements = 0;

  mostrarConfirmacion = false;
  insumoAEliminar: number | null = null;

  ngOnInit(): void {
    this.cargarInsumos();
  }

  onBuscarChange(valor: string): void {
    this.nombreFiltro = valor;
    this.page = 0;
    this.cargarInsumos();
  }

  onTipoChange(valor: string): void {
    this.tipoFiltro = valor;
    this.page = 0;
    this.cargarInsumos();
  }

  toggleActivos(activos: boolean): void {
    this.verActivos = activos;
    this.page = 0;
    this.cargarInsumos();
  }

  anteriorPagina(): void {
    if (this.page > 0) {
      this.page--;
      this.cargarInsumos();
    }
  }

  siguientePagina(): void {
    if (this.page < this.totalPages - 1) {
      this.page++;
      this.cargarInsumos();
    }
  }

  cargarInsumos(): void {
    if (this.tipoFiltro !== '') {
      this.insumoService.filtrarPorTipo(this.tipoFiltro).subscribe({
        next: (data) => {
          let filtered = data.filter(p => p.estado === this.verActivos);
          if (this.nombreFiltro.trim() !== '') {
            filtered = filtered.filter(p => p.nombre.toLowerCase().includes(this.nombreFiltro.toLowerCase()));
          }
          this.insumos = filtered;
          this.cdr.markForCheck();
        },
        error: () => {
          this.insumos = [];
          this.cdr.markForCheck();
        }
      });
    } else if (this.nombreFiltro.trim() !== '') {
      this.insumoService.buscarPorNombre(this.nombreFiltro).subscribe({
        next: (data) => {
          this.insumos = data.filter(p => p.estado === this.verActivos);
          this.cdr.markForCheck();
        },
        error: () => {
          this.insumos = [];
          this.cdr.markForCheck();
        }
      });
    } else if (this.paginado) {
      this.insumoService.listarPaginado(this.page, this.size).subscribe({
        next: (data) => {
          this.insumos = data.content.filter((p: Insumo) => p.estado === this.verActivos);
          this.totalPages = data.totalPages;
          this.totalElements = data.totalElements;
          this.cdr.markForCheck();
        },
        error: () => {
          this.insumos = [];
          this.cdr.markForCheck();
        }
      });
    } else {
      this.insumoService.obtenerPorEstado(this.verActivos).subscribe({
        next: (data) => { 
          this.insumos = data; 
          this.cdr.markForCheck();
        },
        error: () => { 
          this.insumos = []; 
          this.cdr.markForCheck();
        }
      });
    }
  }

  errorServidor: string | null = null;

  nuevoInsumo(): void {
    this.errorServidor = null;
    this.insumoEditar = null;
    this.mostrarFormulario = true;
  }

  editarInsumo(insumo: Insumo): void {
    this.errorServidor = null;
    this.insumoEditar = insumo;
    this.mostrarFormulario = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  guardarInsumo(insumo: InsumoForm): void {
    this.errorServidor = null;
    if (this.insumoEditar?.idInsumo) {
      this.insumoService.editar(this.insumoEditar.idInsumo, insumo, true).subscribe({
        next: () => { 
          this.cargarInsumos(); 
          this.cancelarEdicion(); 
        },
        error: (err) => {
          this.errorServidor = err.message || 'Error al actualizar el insumo';
          this.cdr.markForCheck();
        }
      });
    } else {
      this.insumoService.crear(insumo, true).subscribe({
        next: () => { 
          this.cargarInsumos(); 
          this.cancelarEdicion(); 
        },
        error: (err) => {
          this.errorServidor = err.message || 'Error al crear el insumo';
          this.cdr.markForCheck();
        }
      });
    }
  }

  confirmarEliminar(id: number): void {
    this.insumoAEliminar = id;
    this.mostrarConfirmacion = true;
  }

  eliminarInsumo(): void {
    if (this.insumoAEliminar) {
      this.insumoService.eliminar(this.insumoAEliminar).subscribe({
        next: () => {
          this.notificationService.show({ type: 'success', message: 'Insumo eliminado correctamente' });
          this.cargarInsumos();
          this.cancelarConfirmacion();
        },
        error: () => {}
      });
    }
  }

  restaurarInsumo(id: number): void {
    this.insumoService.restaurar(id).subscribe({
      next: () => {
        this.notificationService.show({ type: 'success', message: 'Insumo restaurado correctamente' });
        this.cargarInsumos();
      },
      error: () => {}
    });
  }

  cancelarEdicion(): void {
    this.errorServidor = null;
    this.insumoEditar = null;
    this.mostrarFormulario = false;
  }

  cancelarConfirmacion(): void {
    this.mostrarConfirmacion = false;
    this.insumoAEliminar = null;
  }

  getTotalStock(): number {
    return this.insumos.reduce((s, p) => s + (p.stock || 0), 0);
  }

  getValorInventario(): number {
    return this.insumos.reduce((s, p) => s + ((p.precio || 0) * (p.stock || 0)), 0);
  }

  getTipoClass(tipo: string): string {
    const map: Record<string, string> = {
      FERTILIZANTE: 'tipo--green',
      PESTICIDA:    'tipo--red',
      HERBICIDA:    'tipo--orange',
      FUNGICIDA:    'tipo--purple',
      SEMILLA:      'tipo--blue',
      OTRO:         'tipo--gray'
    };
    return map[tipo] || 'tipo--gray';
  }

  exportarPdf(): void {
    const filter = this.verActivos ? 'A' : 'I';
    const label = this.verActivos ? 'activos' : 'inactivos';
    this.insumoService.exportarPdf(filter).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte_insumos_${label}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.notificationService.show({ type: 'success', message: `Reporte PDF (${label}) descargado con éxito` });
      },
      error: (err) => {
        console.error(err);
        this.notificationService.show({ type: 'error', message: 'Error al exportar a PDF' });
      }
    });
  }

  exportarExcel(): void {
    const filter = this.verActivos ? 'A' : 'I';
    const label = this.verActivos ? 'activos' : 'inactivos';
    this.insumoService.exportarExcel(filter).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte_insumos_${label}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.notificationService.show({ type: 'success', message: `Reporte Excel (${label}) descargado con éxito` });
      },
      error: (err) => {
        console.error(err);
        this.notificationService.show({ type: 'error', message: 'Error al exportar a Excel' });
      }
    });
  }

  exportarPdfTotal(): void {
    this.insumoService.exportarPdf('T').subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'reporte_insumos_total.pdf';
        a.click();
        window.URL.revokeObjectURL(url);
        this.notificationService.show({ type: 'success', message: 'Reporte PDF (Total) descargado con éxito' });
      },
      error: (err) => {
        console.error(err);
        this.notificationService.show({ type: 'error', message: 'Error al exportar a PDF Total' });
      }
    });
  }

  exportarExcelTotal(): void {
    this.insumoService.exportarExcel('T').subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'reporte_insumos_total.xlsx';
        a.click();
        window.URL.revokeObjectURL(url);
        this.notificationService.show({ type: 'success', message: 'Reporte Excel (Total) descargado con éxito' });
      },
      error: (err) => {
        console.error(err);
        this.notificationService.show({ type: 'error', message: 'Error al exportar a Excel Total' });
      }
    });
  }
}
