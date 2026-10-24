import { Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Cultivo, CultivoDTO } from '../../../core/models/cultivo.model';
import { CultivoService } from '../services/cultivo.service';
import { Parcela } from '../../../core/models/parcela.model';
import { ParcelaService } from '../../parcelas/services/parcela.service';
import { NotificationService } from '../../../core/services/notification.service';
import { CultivoFormComponent } from '../components/cultivo-form/cultivo-form.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ToggleFilterComponent } from '../../../shared/components/toggle-filter/toggle-filter.component';

@Component({
  selector: 'app-cultivos',
  standalone: true,
  imports: [CommonModule, FormsModule, CultivoFormComponent, ConfirmDialogComponent, ToggleFilterComponent],
  templateUrl: './cultivos.component.html',
  styleUrl: './cultivos.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CultivosComponent implements OnInit {
  private cultivoService = inject(CultivoService);
  private parcelaService = inject(ParcelaService);
  private notificationService = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  cultivos: Cultivo[] = [];
  parcelasMap: Map<string, Parcela> = new Map();
  cultivoEditar: Cultivo | null = null;
  mostrarFormulario = false;
  verActivos = true;

  mostrarConfirmacion = false;
  cultivoAEliminar: number | null = null;

  ngOnInit(): void {
    this.cargarParcelas();
    this.cargarCultivos();
  }

  cargarParcelas(): void {
    this.parcelaService.listarTodos().subscribe({
      next: (data) => {
        this.parcelasMap.clear();
        (data || []).forEach(p => {
          const id = p.id || p.idParcela;
          if (id) {
            this.parcelasMap.set(String(id), p);
          }
        });
        this.cdr.markForCheck();
      },
      error: () => {}
    });
  }

  getNombreParcela(c: Cultivo): string {
    if (c.parcela?.nombre) {
      const ubi = (c.parcela as any).ubicacion;
      return ubi ? `${c.parcela.nombre} (${ubi})` : c.parcela.nombre;
    }
    const pid = c.idParcela || (c.parcela as any)?.idParcela;
    if (!pid) return 'Sin Parcela Asignada';
    const p = this.parcelasMap.get(String(pid));
    return p ? `${p.nombre} (${p.ubicacion || pid})` : `Parcela ${pid}`;
  }

  toggleActivos(activos: boolean): void {
    this.verActivos = activos;
    this.cargarCultivos();
  }

  cargarCultivos(): void {
    this.cultivoService.obtenerPorEstado(this.verActivos).subscribe({
      next: (data) => { 
        this.cultivos = data; 
        this.cdr.markForCheck();
      },
      error: () => { 
        this.cultivos = []; 
        this.cdr.markForCheck();
      }
    });
  }

  errorServidor: string | null = null;

  nuevoCultivo(): void {
    this.errorServidor = null;
    this.cultivoEditar = null;
    this.mostrarFormulario = true;
  }

  editarCultivo(cultivo: Cultivo): void {
    this.errorServidor = null;
    this.cultivoEditar = cultivo;
    this.mostrarFormulario = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  guardarCultivo(dto: CultivoDTO): void {
    this.errorServidor = null;
    if (this.cultivoEditar?.idCultivo) {
      this.cultivoService.editar(this.cultivoEditar.idCultivo, dto, true).subscribe({
        next: () => { 
          this.cargarCultivos(); 
          this.cancelarEdicion(); 
        },
        error: (err) => { 
          this.errorServidor = err.message || 'Error al actualizar cultivo';
          this.cdr.markForCheck();
        }
      });
    } else {
      this.cultivoService.crear(dto, true).subscribe({
        next: () => { 
          this.cargarCultivos(); 
          this.cancelarEdicion(); 
        },
        error: (err) => { 
          this.errorServidor = err.message || 'Error al crear cultivo';
          this.cdr.markForCheck();
        }
      });
    }
  }

  confirmarEliminar(id: number): void {
    this.cultivoAEliminar = id;
    this.mostrarConfirmacion = true;
  }

  eliminarCultivo(): void {
    if (this.cultivoAEliminar) {
      this.cultivoService.eliminar(this.cultivoAEliminar).subscribe({
        next: () => {
          this.notificationService.show({ type: 'success', message: 'Cultivo eliminado correctamente' });
          this.cargarCultivos();
          this.cancelarConfirmacion();
        },
        error: () => {}
      });
    }
  }

  restaurarCultivo(id: number): void {
    this.cultivoService.restaurar(id).subscribe({
      next: () => {
        this.notificationService.show({ type: 'success', message: 'Cultivo restaurado correctamente' });
        this.cargarCultivos();
      },
      error: () => {}
    });
  }

  cancelarEdicion(): void {
    this.errorServidor = null;
    this.cultivoEditar = null;
    this.mostrarFormulario = false;
  }

  cancelarConfirmacion(): void {
    this.mostrarConfirmacion = false;
    this.cultivoAEliminar = null;
  }

  getCultivosConSombra(): number {
    return this.cultivos.filter(c => c.requiereSombra).length;
  }

  getPromedioTemp(): string {
    if (!this.cultivos.length) return '0';
    const avg = this.cultivos.reduce((s, c) => s + (c.temperaturaIdeal || 0), 0) / this.cultivos.length;
    return avg.toFixed(1);
  }
}
