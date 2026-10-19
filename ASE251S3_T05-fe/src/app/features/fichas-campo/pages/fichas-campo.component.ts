import { Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FichaCampo, FichaCampoDTO } from '../../../core/models/ficha-campo.model';
import { FichaCampoService } from '../services/ficha-campo.service';
import { CultivoService } from '../../cultivos/services/cultivo.service';
import { UsuarioService } from '../../usuarios/services/usuario.service';
import { Cultivo } from '../../../core/models/cultivo.model';
import { Usuario } from '../../../core/models/usuario.model';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ToggleFilterComponent } from '../../../shared/components/toggle-filter/toggle-filter.component';

@Component({
  selector: 'app-fichas-campo',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent, ToggleFilterComponent],
  templateUrl: './fichas-campo.component.html',
  styleUrl: './fichas-campo.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FichasCampoComponent implements OnInit {
  private fichaService = inject(FichaCampoService);
  private cultivoService = inject(CultivoService);
  private usuarioService = inject(UsuarioService);
  private notificationService = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  fichas: FichaCampo[] = [];
  cultivos: Cultivo[] = [];
  usuarios: Usuario[] = [];

  // Formulario
  mostrarFormulario = false;
  fichaEditar: FichaCampo | null = null;
  verActivos = true;

  // Modelo de formulario plano para enlazar mediante ngModel
  formData = {
    idCultivo: 0,
    idUsuario: 0,
    etapaFenologica: 'GERMINACION',
    temperaturaAmb: 20,
    humedadRelativa: 60,
    condicionClima: 'SOLEADO',
    estadoCultivo: 'OPTIMO',
    necesitaRiego: false,
    necesitaFumigacion: false,
    diagnostico: '',
    accionTomada: '',
    accionPendiente: ''
  };

  mostrarConfirmacion = false;
  fichaAEliminar: number | null = null;

  etapas = ['GERMINACION', 'CRECIMIENTO', 'FLORACION', 'FRUCTIFICACION', 'COSECHA', 'POST-COSECHA'];
  climas = ['SOLEADO', 'NUBLADO', 'LLUVIOSO', 'VENTOSO'];
  estados = ['OPTIMO', 'REGULAR', 'CRITICO'];

  ngOnInit(): void {
    this.cargarFichas();
    this.cargarCultivos();
    this.cargarUsuarios();
  }

  cargarFichas(): void {
    this.fichaService.obtenerPorEstado(this.verActivos).subscribe({
      next: (data) => {
        this.fichas = data;
        this.cdr.markForCheck();
      },
      error: () => {
        this.fichas = [];
        this.cdr.markForCheck();
      }
    });
  }

  cargarCultivos(): void {
    this.cultivoService.obtenerPorEstado(true).subscribe({
      next: (data) => {
        this.cultivos = data;
        this.cdr.markForCheck();
      }
    });
  }

  cargarUsuarios(): void {
    // Filtrar operarios o técnicos
    this.usuarioService.obtenerPorEstado(true).subscribe({
      next: (data) => {
        this.usuarios = data;
        this.cdr.markForCheck();
      }
    });
  }

  toggleActivos(activos: boolean): void {
    this.verActivos = activos;
    this.cargarFichas();
  }

  nuevaFicha(): void {
    this.fichaSeleccionada = null;
    this.fichaEditar = null;
    this.formData = {
      idCultivo: this.cultivos.length > 0 ? this.cultivos[0].idCultivo! : 0,
      idUsuario: this.usuarios.length > 0 ? this.usuarios[0].idUsuario! : 0,
      etapaFenologica: 'GERMINACION',
      temperaturaAmb: 20,
      humedadRelativa: 60,
      condicionClima: 'SOLEADO',
      estadoCultivo: 'OPTIMO',
      necesitaRiego: false,
      necesitaFumigacion: false,
      diagnostico: '',
      accionTomada: '',
      accionPendiente: ''
    };
    this.mostrarFormulario = true;
  }

  editarFicha(ficha: FichaCampo): void {
    this.fichaSeleccionada = null;
    this.fichaEditar = ficha;
    this.formData = {
      idCultivo: ficha.idCultivo,
      idUsuario: ficha.idUsuario,
      etapaFenologica: ficha.etapaFenologica,
      temperaturaAmb: ficha.temperaturaAmb || 20,
      humedadRelativa: ficha.humedadRelativa || 60,
      condicionClima: ficha.condicionClima || 'SOLEADO',
      estadoCultivo: ficha.estadoCultivo,
      necesitaRiego: ficha.necesitaRiego,
      necesitaFumigacion: ficha.necesitaFumigacion,
      diagnostico: ficha.diagnostico || '',
      accionTomada: ficha.accionTomada || '',
      accionPendiente: ficha.accionPendiente || ''
    };
    this.mostrarFormulario = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  guardarFicha(): void {
    const dto: FichaCampoDTO = {
      idCultivo: Number(this.formData.idCultivo),
      idUsuario: Number(this.formData.idUsuario),
      etapaFenologica: this.formData.etapaFenologica,
      temperaturaAmb: this.formData.temperaturaAmb,
      humedadRelativa: this.formData.humedadRelativa,
      condicionClima: this.formData.condicionClima,
      estadoCultivo: this.formData.estadoCultivo,
      necesitaRiego: this.formData.necesitaRiego,
      necesitaFumigacion: this.formData.necesitaFumigacion,
      diagnostico: this.formData.diagnostico,
      accionTomada: this.formData.accionTomada,
      accionPendiente: this.formData.accionPendiente
    };

    if (this.fichaEditar?.idFicha) {
      this.fichaService.editar(this.fichaEditar.idFicha, dto).subscribe({
        next: () => {
          this.notificationService.show({ type: 'success', message: 'Ficha de campo actualizada con éxito' });
          this.cargarFichas();
          this.cancelarEdicion();
        }
      });
    } else {
      this.fichaService.crear(dto).subscribe({
        next: () => {
          this.notificationService.show({ type: 'success', message: 'Ficha de campo registrada con éxito' });
          this.cargarFichas();
          this.cancelarEdicion();
        }
      });
    }
  }

  confirmarEliminar(id: number): void {
    this.fichaAEliminar = id;
    this.mostrarConfirmacion = true;
  }

  eliminarFicha(): void {
    if (this.fichaAEliminar) {
      this.fichaService.eliminar(this.fichaAEliminar).subscribe({
        next: () => {
          this.notificationService.show({ type: 'success', message: 'Ficha de campo desactivada correctamente' });
          this.cargarFichas();
          this.cancelarConfirmacion();
        }
      });
    }
  }

  restaurarFicha(id: number): void {
    this.fichaService.restaurar(id).subscribe({
      next: () => {
        this.notificationService.show({ type: 'success', message: 'Ficha de campo restaurada correctamente' });
        this.cargarFichas();
      }
    });
  }

  fichaSeleccionada: FichaCampo | null = null;

  verDetalles(ficha: FichaCampo): void {
    this.fichaSeleccionada = ficha;
    this.cdr.markForCheck();
  }

  cerrarDetalles(): void {
    this.fichaSeleccionada = null;
    this.cdr.markForCheck();
  }

  cancelarEdicion(): void {
    this.fichaSeleccionada = null;
    this.fichaEditar = null;
    this.mostrarFormulario = false;
  }

  cancelarConfirmacion(): void {
    this.mostrarConfirmacion = false;
    this.fichaAEliminar = null;
  }

  getEstadoClase(estado: string): string {
    if (estado === 'OPTIMO') return 'badge--green';
    if (estado === 'REGULAR') return 'badge--blue';
    return 'badge--red';
  }
}
