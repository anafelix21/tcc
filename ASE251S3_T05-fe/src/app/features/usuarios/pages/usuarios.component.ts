import { Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Usuario, UsuarioForm } from '../../../core/models/usuario.model'; // <-- CORREGIDO (3 niveles de subida)
import { UsuarioService } from '../services/usuario.service';
import { NotificationService } from '../../../core/services/notification.service';
import { UsuarioFormComponent } from '../components/usuario-form/usuario-form.component';
import { UsuarioListaComponent } from '../components/usuario-lista/usuario-lista.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ToggleFilterComponent } from '../../../shared/components/toggle-filter/toggle-filter.component';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    UsuarioFormComponent, 
    UsuarioListaComponent,
    ConfirmDialogComponent, 
    ToggleFilterComponent
  ],
  templateUrl: './usuarios.component.html',  
  styleUrl: './usuarios.component.css',     
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsuariosComponent implements OnInit {
  private usuarioService = inject(UsuarioService);
  private notificationService = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  usuarios: Usuario[] = [];
  usuarioEditar: Usuario | null = null;
  mostrarFormulario = false;
  verActivos = true;

  mostrarConfirmacion = false;
  usuarioAEliminar: number | null = null;

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  toggleActivos(activos: boolean): void {
    this.verActivos = activos;
    this.cargarUsuarios();
  }

  cargarUsuarios(): void {
    this.usuarioService.obtenerPorEstado(this.verActivos).subscribe({
      next: (data) => { 
        this.usuarios = data;
        this.cdr.markForCheck();
      },
      error: () => { 
        this.usuarios = [];
        this.notificationService.show({ type: 'error', message: 'Error al conectar con el servidor de usuarios' });
        this.cdr.markForCheck();
      }
    });
  }

  errorServidor: string | null = null;

  nuevoUsuario(): void {
    this.errorServidor = null;
    this.usuarioEditar = null;
    this.mostrarFormulario = true;
  }

  editarUsuario(usuario: Usuario): void {
    this.errorServidor = null;
    this.usuarioEditar = usuario;
    this.mostrarFormulario = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  guardarUsuario(usuario: UsuarioForm): void {
    this.errorServidor = null;
    if (this.usuarioEditar?.idUsuario) {
      this.usuarioService.editar(this.usuarioEditar.idUsuario, usuario, true).subscribe({
        next: () => { 
          this.cargarUsuarios(); 
          this.cancelarEdicion(); 
        },
        error: (err) => {
          this.errorServidor = err.message || 'No se pudieron actualizar los datos del usuario';
          this.cdr.markForCheck();
        }
      });
    } else {
      this.usuarioService.crear(usuario, true).subscribe({
        next: () => { 
          this.cargarUsuarios(); 
          this.cancelarEdicion(); 
        },
        error: (err) => {
          this.errorServidor = err.message || 'Error al registrar el nuevo usuario';
          this.cdr.markForCheck();
        }
      });
    }
  }

  confirmarEliminar(id: number): void {
    this.usuarioAEliminar = id;
    this.mostrarConfirmacion = true;
  }

  eliminarUsuario(): void {
    if (this.usuarioAEliminar) {
      this.usuarioService.eliminar(this.usuarioAEliminar).subscribe({
        next: () => {
          this.notificationService.show({ type: 'success', message: 'Usuario desactivado correctamente' });
          this.cargarUsuarios();
          this.cancelarConfirmacion();
        },
        error: () => {
          this.notificationService.show({ type: 'error', message: 'No se pudo desactivar el usuario seleccionado' });
        }
      });
    }
  }

  restaurarUsuario(id: number): void {
    this.usuarioService.restaurar(id).subscribe({
      next: () => {
        this.notificationService.show({ type: 'success', message: 'Usuario restaurado correctamente' });
        this.cargarUsuarios();
      },
      error: () => {
        this.notificationService.show({ type: 'error', message: 'Error al intentar restaurar el usuario' });
      }
    });
  }

  cancelarEdicion(): void {
    this.errorServidor = null;
    this.usuarioEditar = null;
    this.mostrarFormulario = false;
  }

  cancelarConfirmacion(): void {
    this.mostrarConfirmacion = false;
    this.usuarioAEliminar = null;
  }

  getRolClass(rol: string): string {
    const map: Record<string, string> = {
      ADMIN: 'badge--red',
      SUPERVISOR: 'badge--blue',
      OPERADOR: 'badge--green'
    };
    return map[rol] || 'badge--gray';
  }

  getAdmins(): number {
    return this.usuarios.filter(u => u.rol === 'ADMIN').length;
  }

  getOperadores(): number {
    return this.usuarios.filter(u => u.rol === 'OPERADOR').length;
  }

  exportarPdf(): void {
    const filter = this.verActivos ? 'A' : 'I';
    const label = this.verActivos ? 'activos' : 'inactivos';
    this.usuarioService.exportarPdf(filter).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte_usuarios_${label}.pdf`;
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
    this.usuarioService.exportarExcel(filter).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte_usuarios_${label}.xlsx`;
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
    this.usuarioService.exportarPdf('T').subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'reporte_usuarios_total.pdf';
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
    this.usuarioService.exportarExcel('T').subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'reporte_usuarios_total.xlsx';
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