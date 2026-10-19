import { Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Harvest, HarvestDTO, DetalleCosecha } from '../../../core/models/harvest.model';
import { HarvestService } from '../services/harvest.service';
import { CultivoService } from '../../cultivos/services/cultivo.service';
import { Cultivo } from '../../../core/models/cultivo.model';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-cosechas',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent],
  templateUrl: './cosechas.component.html',
  styleUrl: './cosechas.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CosechasComponent implements OnInit {
  private harvestService = inject(HarvestService);
  private cultivoService = inject(CultivoService);
  private notificationService = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  cosechas: Harvest[] = [];
  cultivos: Cultivo[] = [];

  mostrarFormulario = false;
  formSubmitAttempted = false;

  formData = {
    responsable: '',
    fechaCosecha: new Date().toISOString().split('T')[0],
    detalles: [] as DetalleCosecha[]
  };

  mostrarConfirmacion = false;
  cosechaAEliminar: number | null = null;
  cosechaSeleccionada: Harvest | null = null;

  // ── Límites de fecha ──────────────────────────────────────────────
  get fechaMaxima(): string {
    return new Date().toISOString().split('T')[0]; // hoy
  }

  get fechaMinima(): string {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1); // máximo 1 año atrás
    return d.toISOString().split('T')[0];
  }

  // ── Validaciones de cabecera ──────────────────────────────────────
  get responsableError(): string | null {
    const v = this.formData.responsable.trim();
    if (!v) return 'El nombre del responsable es obligatorio.';
    if (v.length < 3) return 'Debe tener al menos 3 caracteres.';
    if (v.length > 100) return 'No puede superar los 100 caracteres.';
    if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(v)) return 'Solo se permiten letras y espacios.';
    return null;
  }

  get fechaError(): string | null {
    if (!this.formData.fechaCosecha) return 'La fecha de cosecha es obligatoria.';
    const selected = new Date(this.formData.fechaCosecha + 'T00:00:00');
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const minDate = new Date();
    minDate.setFullYear(minDate.getFullYear() - 1);
    minDate.setHours(0, 0, 0, 0);

    if (selected > today) return 'La fecha no puede ser futura. Las cosechas se registran en el día o antes.';
    if (selected < minDate) return 'La fecha no puede ser mayor a 1 año en el pasado.';
    return null;
  }

  get detallesError(): string | null {
    if (this.formData.detalles.length === 0) return 'Debes agregar al menos un lote cosechado.';
    const ids = this.formData.detalles.map(d => Number(d.idCultivo));
    if (new Set(ids).size !== ids.length) return 'Hay cultivos duplicados en los lotes. Cada cultivo solo puede aparecer una vez.';
    return null;
  }

  get formularioValido(): boolean {
    return (
      !this.responsableError &&
      !this.fechaError &&
      !this.detallesError &&
      !this.tieneExcesoDeMerma() &&
      this.formData.detalles.every(d => !this.getDetalleError(d))
    );
  }

  // ── Validación de cada fila de detalle ───────────────────────────
  getDetalleError(d: DetalleCosecha): string | null {
    const optimos = Number(d.kilosOptimos);
    const merma = Number(d.kilosMerma);
    if (!optimos || optimos <= 0) return 'Kilos óptimos debe ser mayor a 0.';
    if (merma < 0) return 'Kilos de merma no puede ser negativo.';
    if (merma > optimos * 10) return 'Merma excesiva. Revisa los valores.';
    return null;
  }

  // ── IDs ya usados para deshabilitar en otros selects ─────────────
  getIdsUsados(excludeIndex: number): number[] {
    return this.formData.detalles
      .filter((_, i) => i !== excludeIndex)
      .map(d => Number(d.idCultivo));
  }

  isCultivoYaUsado(idCultivo: number, excludeIndex: number): boolean {
    return this.getIdsUsados(excludeIndex).includes(Number(idCultivo));
  }

  // ── Métricas de merma ─────────────────────────────────────────────
  getPorcentajeMerma(det: DetalleCosecha): number {
    const total = Number(det.kilosOptimos) + Number(det.kilosMerma);
    if (total === 0) return 0;
    return (Number(det.kilosMerma) / total) * 100;
  }

  excedeLimiteMerma(det: DetalleCosecha): boolean {
    return this.getPorcentajeMerma(det) > 20;
  }

  tieneExcesoDeMerma(): boolean {
    return this.formData.detalles.some(d => this.excedeLimiteMerma(d));
  }

  getMermaColorClass(det: DetalleCosecha): string {
    const pct = this.getPorcentajeMerma(det);
    if (pct > 20) return 'merma-critica';
    if (pct > 10) return 'merma-advertencia';
    return 'merma-ok';
  }

  // ── Helpers de nombre ─────────────────────────────────────────────
  getNombreCultivo(idCultivo: number): string {
    const cult = this.cultivos.find(c => c.idCultivo === Number(idCultivo));
    return cult ? cult.nombre : `Cultivo #${idCultivo}`;
  }

  // ── Ciclo de vida ─────────────────────────────────────────────────
  ngOnInit(): void {
    this.cargarCosechas();
    this.cargarCultivos();
  }

  cargarCosechas(): void {
    this.harvestService.listarTodas().subscribe({
      next: (data) => { this.cosechas = data; this.cdr.markForCheck(); },
      error: () => { this.cosechas = []; this.cdr.markForCheck(); }
    });
  }

  cargarCultivos(): void {
    this.cultivoService.obtenerPorEstado(true).subscribe({
      next: (data) => { this.cultivos = data; this.cdr.markForCheck(); }
    });
  }

  // ── Acciones del formulario ───────────────────────────────────────
  nuevaCosecha(): void {
    this.formData = {
      responsable: '',
      fechaCosecha: new Date().toISOString().split('T')[0],
      detalles: []
    };
    this.formSubmitAttempted = false;
    this.mostrarFormulario = true;
  }

  agregarDetalle(): void {
    if (this.cultivos.length === 0) {
      this.notificationService.show({ type: 'warning', message: 'No hay cultivos activos disponibles para cosechar' });
      return;
    }
    // Elegir el primer cultivo aún no seleccionado
    const idsUsados = this.formData.detalles.map(d => Number(d.idCultivo));
    const disponible = this.cultivos.find(c => !idsUsados.includes(c.idCultivo!));

    if (!disponible) {
      this.notificationService.show({ type: 'warning', message: 'Ya has agregado todos los cultivos disponibles.' });
      return;
    }

    this.formData.detalles.push({
      idCultivo: disponible.idCultivo!,
      kilosOptimos: 0,
      kilosMerma: 0
    });
    this.cdr.markForCheck();
  }

  eliminarDetalle(index: number): void {
    this.formData.detalles.splice(index, 1);
    this.cdr.markForCheck();
  }

  onCultivoChange(index: number, event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.formData.detalles[index].idCultivo = Number(select.value);
    this.cdr.markForCheck();
  }

  guardarCosecha(): void {
    this.formSubmitAttempted = true;
    this.cdr.markForCheck();

    if (!this.formularioValido) {
      // Scroll suave al primer error
      setTimeout(() => {
        const firstError = document.querySelector('.field-error, .critical-warning-banner');
        firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
      return;
    }

    const dto: HarvestDTO = {
      responsable: this.formData.responsable.trim(),
      fechaCosecha: this.formData.fechaCosecha,
      detalles: this.formData.detalles.map(d => ({
        idCultivo: Number(d.idCultivo),
        kilosOptimos: Number(d.kilosOptimos),
        kilosMerma: Number(d.kilosMerma)
      }))
    };

    this.harvestService.crear(dto).subscribe({
      next: () => {
        this.notificationService.show({ type: 'success', message: 'Cosecha registrada con éxito' });
        this.cargarCosechas();
        this.cancelarEdicion();
      },
      error: () => {
        this.notificationService.show({ type: 'error', message: 'Error al registrar la cosecha. Intenta de nuevo.' });
        this.cdr.markForCheck();
      }
    });
  }

  confirmarEliminar(id: number): void {
    this.cosechaAEliminar = id;
    this.mostrarConfirmacion = true;
  }

  eliminarCosecha(): void {
    if (this.cosechaAEliminar) {
      this.harvestService.eliminar(this.cosechaAEliminar).subscribe({
        next: () => {
          this.notificationService.show({ type: 'success', message: 'Cosecha dada de baja de manera lógica' });
          this.cargarCosechas();
          this.cancelarConfirmacion();
        }
      });
    }
  }

  cancelarEdicion(): void {
    this.mostrarFormulario = false;
    this.formSubmitAttempted = false;
  }

  cancelarConfirmacion(): void {
    this.mostrarConfirmacion = false;
    this.cosechaAEliminar = null;
  }

  verDetalles(cosecha: Harvest): void {
    this.cosechaSeleccionada = cosecha;
    this.cdr.markForCheck();
  }

  cerrarDetalles(): void {
    this.cosechaSeleccionada = null;
    this.cdr.markForCheck();
  }

  // Kilos totales de una cosecha específica (para modal)
  getTotalKilosCosecha(cosecha: Harvest): number {
    return cosecha.detalles
      ? cosecha.detalles.reduce((s, d) => s + (d.totalKilos || 0), 0)
      : 0;
  }

  getTotalKilosCosechados(): number {
    return this.cosechas.reduce((sum, c) => {
      const sub = c.detalles ? c.detalles.reduce((s, d) => s + (d.totalKilos || 0), 0) : 0;
      return sum + sub;
    }, 0);
  }
}
