import { Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { Parcela, ParcelaForm } from '../../../core/models/parcela.model';
import { ParcelaService } from '../services/parcela.service';
import { CultivoService } from '../../cultivos/services/cultivo.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ParcelaFormComponent } from '../components/parcela-form/parcela-form.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ToggleFilterComponent } from '../../../shared/components/toggle-filter/toggle-filter.component';

@Component({
  selector: 'app-parcelas',
  standalone: true,
  imports: [CommonModule, FormsModule, ParcelaFormComponent, ConfirmDialogComponent, ToggleFilterComponent],
  templateUrl: './parcelas.component.html',
  styleUrl: './parcelas.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ParcelasComponent implements OnInit {
  private parcelaService = inject(ParcelaService);
  private cultivoService = inject(CultivoService);
  private notificationService = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  parcelas: Parcela[] = [];
  parcelaEditar: Parcela | null = null;
  mostrarFormulario = false;
  verActivos = true;

  mostrarConfirmacion = false;
  parcelaAEliminar: number | null = null;

  ngOnInit(): void {
    this.cargarParcelas();
  }

  toggleActivos(activos: boolean): void {
    this.verActivos = activos;
    this.cargarParcelas();
  }

  cargarParcelas(): void {
    forkJoin({
      parcelas: this.parcelaService.obtenerPorEstado(this.verActivos),
      cultivos: this.cultivoService.obtenerPorEstado(true) // Cargamos cultivos activos para cruzar datos
    }).subscribe({
      next: ({ parcelas, cultivos }) => {
        this.parcelas = parcelas.map(p => {
          // Filtrar cultivos que pertenecen a esta parcela
          const cultivosAsociados = cultivos.filter(c => c.parcela?.idParcela === p.idParcela);
          
          return {
            ...p,
            // Una parcela está en uso si tiene cultivos asociados
            enUso: cultivosAsociados.length > 0,
            // Concatenamos nombres e IDs de cultivos asociados
            cultivoActual: cultivosAsociados.length > 0 
              ? cultivosAsociados.map(c => `${c.nombre} (#${c.idCultivo})`).join(', ')
              : '—'
          };
        });
        this.cdr.markForCheck();
      },
      error: () => { 
        this.parcelas = []; 
        this.cdr.markForCheck();
      }
    });
  }

  errorServidor: string | null = null;

  nuevaParcela(): void {
    this.errorServidor = null;
    this.parcelaEditar = null;
    this.mostrarFormulario = true;
  }

  editarParcela(parcela: Parcela): void {
    this.errorServidor = null;
    this.parcelaEditar = parcela;
    this.mostrarFormulario = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  guardarParcela(parcela: ParcelaForm): void {
    this.errorServidor = null;
    if (this.parcelaEditar?.idParcela) {
      this.parcelaService.editar(this.parcelaEditar.idParcela, parcela, true).subscribe({
        next: () => { 
          this.cargarParcelas(); 
          this.cancelarEdicion(); 
        },
        error: (err) => {
          this.errorServidor = err.message || 'Error al actualizar la parcela';
          this.cdr.markForCheck();
        }
      });
    } else {
      this.parcelaService.crear(parcela, true).subscribe({
        next: () => { 
          this.cargarParcelas(); 
          this.cancelarEdicion(); 
        },
        error: (err) => {
          this.errorServidor = err.message || 'Error al crear la parcela';
          this.cdr.markForCheck();
        }
      });
    }
  }

  confirmarEliminar(id: number): void {
    this.parcelaAEliminar = id;
    this.mostrarConfirmacion = true;
  }

  eliminarParcela(): void {
    if (this.parcelaAEliminar) {
      this.parcelaService.eliminar(this.parcelaAEliminar).subscribe({
        next: () => {
          this.notificationService.show({ type: 'success', message: 'Parcela eliminada correctamente' });
          this.cargarParcelas();
          this.cancelarConfirmacion();
        },
        error: () => {}
      });
    }
  }

  restaurarParcela(id: number): void {
    this.parcelaService.restaurar(id).subscribe({
      next: () => {
        this.notificationService.show({ type: 'success', message: 'Parcela restaurada correctamente' });
        this.cargarParcelas();
      },
      error: () => {}
    });
  }

  cancelarEdicion(): void {
    this.errorServidor = null;
    this.parcelaEditar = null;
    this.mostrarFormulario = false;
  }

  cancelarConfirmacion(): void {
    this.mostrarConfirmacion = false;
    this.parcelaAEliminar = null;
  }

  getTotalArea(): number {
    return this.parcelas.reduce((s, p) => s + (p.areaHectareas || 0), 0);
  }

  getEnUso(): number {
    return this.parcelas.filter(p => p.enUso).length;
  }

  exportarPdf(): void {
    const filter = this.verActivos ? 'A' : 'I';
    const label = this.verActivos ? 'activos' : 'inactivos';
    this.parcelaService.exportarPdf(filter).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte_parcelas_${label}.pdf`;
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
    this.parcelaService.exportarExcel(filter).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte_parcelas_${label}.xlsx`;
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
    this.parcelaService.exportarPdf('T').subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'reporte_parcelas_total.pdf';
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
    this.parcelaService.exportarExcel('T').subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'reporte_parcelas_total.xlsx';
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
