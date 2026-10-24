import { Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Insumo, InsumoForm, ImportResult } from '../../../core/models/insumo.model';
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

  todosInsumos: Insumo[] = [];
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
  insumoAEliminar: string | number | null = null;

  // Importación masiva (Mínimo 10 registros - Requisito Sprint 8)
  mostrarModalImportar = false;
  archivoImportar: File | null = null;
  importando = false;
  resultadoImportacion: ImportResult | null = null;
  errorImportacion: string | null = null;

  // Auditoría (4 campos: fecha y hora - Requisito Sprint 8)
  insumoDetalleAuditoria: Insumo | null = null;
  mostrarDetalleAuditoria = false;

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
      const start = this.page * this.size;
      this.insumos = this.todosInsumos.slice(start, start + this.size);
      this.cdr.markForCheck();
    }
  }

  siguientePagina(): void {
    if (this.page < this.totalPages - 1) {
      this.page++;
      const start = this.page * this.size;
      this.insumos = this.todosInsumos.slice(start, start + this.size);
      this.cdr.markForCheck();
    }
  }

  cargarInsumos(): void {
    const fetch$ = (this.tipoFiltro && this.tipoFiltro !== '')
      ? this.insumoService.filtrarPorTipo(this.tipoFiltro)
      : this.insumoService.obtenerPorEstado(this.verActivos);

    fetch$.subscribe({
      next: (data) => {
        let filtered = (data || []).filter(p => p.estado === this.verActivos);
        if (this.tipoFiltro && this.tipoFiltro !== '') {
          filtered = filtered.filter(p => p.tipoInsumo === this.tipoFiltro);
        }
        if (this.nombreFiltro.trim() !== '') {
          const q = this.nombreFiltro.toLowerCase();
          filtered = filtered.filter(p => p.nombre && p.nombre.toLowerCase().includes(q));
        }
        this.todosInsumos = filtered;
        this.totalElements = filtered.length;
        this.totalPages = Math.max(1, Math.ceil(filtered.length / this.size));
        if (this.page >= this.totalPages) {
          this.page = Math.max(0, this.totalPages - 1);
        }
        const start = this.page * this.size;
        this.insumos = filtered.slice(start, start + this.size);
        this.cdr.markForCheck();
      },
      error: () => {
        this.todosInsumos = [];
        this.insumos = [];
        this.totalElements = 0;
        this.totalPages = 0;
        this.cdr.markForCheck();
      }
    });
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
    const targetId = this.insumoEditar ? ((this.insumoEditar.idInsumo as any) || (this.insumoEditar as any).id) : null;
    if (targetId) {
      this.insumoService.editar(targetId, insumo, true).subscribe({
        next: () => { 
          this.notificationService.show({ type: 'success', message: 'Insumo actualizado correctamente' });
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
          this.notificationService.show({ type: 'success', message: 'Insumo creado correctamente' });
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

  confirmarEliminar(id: string | number): void {
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
        error: (err) => {
          this.notificationService.show({ type: 'error', message: err?.message || 'Error al eliminar el insumo' });
          this.cancelarConfirmacion();
        }
      });
    }
  }

  restaurarInsumo(id: string | number): void {
    this.insumoService.restaurar(id).subscribe({
      next: () => {
        this.notificationService.show({ type: 'success', message: 'Insumo restaurado correctamente' });
        this.cargarInsumos();
      },
      error: (err) => {
        this.notificationService.show({ type: 'error', message: err?.message || 'Error al restaurar el insumo' });
      }
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
    return (this.todosInsumos.length > 0 ? this.todosInsumos : this.insumos).reduce((s, p) => s + (p.stock || 0), 0);
  }

  getValorInventario(): number {
    return (this.todosInsumos.length > 0 ? this.todosInsumos : this.insumos).reduce((s, p) => s + ((p.precio || 0) * (p.stock || 0)), 0);
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

  // --- MÉTODOS DE IMPORTACIÓN Y AUDITORÍA (SPRINT 8) ---
  abrirModalImportar(): void {
    this.archivoImportar = null;
    this.resultadoImportacion = null;
    this.errorImportacion = null;
    this.mostrarModalImportar = true;
  }

  cerrarModalImportar(): void {
    this.mostrarModalImportar = false;
    this.archivoImportar = null;
    this.resultadoImportacion = null;
    this.errorImportacion = null;
  }

  onArchivoSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.archivoImportar = input.files[0];
      this.resultadoImportacion = null;
      this.errorImportacion = null;
    }
  }

  ejecutarImportacion(): void {
    if (!this.archivoImportar) {
      this.errorImportacion = 'Por favor selecciona un archivo (.csv o .xlsx).';
      return;
    }

    const nombre = this.archivoImportar.name.toLowerCase();
    if (!nombre.endsWith('.csv') && !nombre.endsWith('.xlsx')) {
      this.errorImportacion = 'Formato inválido. Solo se admiten archivos .csv o .xlsx.';
      return;
    }

    this.importando = true;
    this.errorImportacion = null;
    this.resultadoImportacion = null;

    const req$ = nombre.endsWith('.csv')
      ? this.insumoService.importarCsv(this.archivoImportar)
      : this.insumoService.importarExcel(this.archivoImportar);

    req$.subscribe({
      next: (res) => {
        this.importando = false;
        this.resultadoImportacion = res;
        this.notificationService.show({
          type: 'success',
          message: `¡Importación completada! ${res.importados} insumos registrados correctamente.`
        });
        this.cargarInsumos();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.importando = false;
        this.errorImportacion = err.error?.message || err.message || 'Error al procesar el archivo.';
        this.cdr.markForCheck();
      }
    });
  }

  abrirDetalleAuditoria(insumo: Insumo): void {
    this.insumoDetalleAuditoria = insumo;
    this.mostrarDetalleAuditoria = true;
  }

  cerrarDetalleAuditoria(): void {
    this.insumoDetalleAuditoria = null;
    this.mostrarDetalleAuditoria = false;
  }
}

