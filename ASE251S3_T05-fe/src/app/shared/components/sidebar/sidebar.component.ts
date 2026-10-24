import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  private allMenuItems = [
    { label: 'Panel Principal',       route: '/inicio',             icon: 'home', roles: ['ADMIN', 'SUPERVISOR', 'SUPERVISOR_ALMACEN', 'AGRONOMO', 'TECNICO', 'OPERARIO', 'OPERADOR'] },
    { label: 'Métricas y Costos',     route: '/dashboard',          icon: 'analytics', roles: ['ADMIN', 'SUPERVISOR'] },
    { label: 'Sectores y Parcelas',   route: '/parcelas',           icon: 'landscape', roles: ['ADMIN', 'SUPERVISOR'] },
    { label: 'Ciclos de Cultivo',     route: '/cultivos',           icon: 'grass', roles: ['ADMIN', 'SUPERVISOR'] },
    { label: 'Fichas de Campo',       route: '/fichas-campo',       icon: 'assignment', roles: ['ADMIN', 'SUPERVISOR', 'AGRONOMO', 'TECNICO'] },
    { label: 'Registro de Cosechas',  route: '/cosechas',           icon: 'local_shipping', roles: ['ADMIN', 'SUPERVISOR'] },
    { label: 'Almacén de Insumos',    route: '/insumos',            icon: 'inventory', roles: ['ADMIN', 'SUPERVISOR', 'SUPERVISOR_ALMACEN'] },
    { label: 'Labores de Campo',      route: '/actividades',        icon: 'agriculture', roles: ['ADMIN', 'SUPERVISOR', 'OPERARIO', 'OPERADOR'] },
    { label: 'Asignación de Personal',route: '/asignaciones',       icon: 'engineering', roles: ['ADMIN', 'SUPERVISOR'] },
    { label: 'Gestión de Personal',   route: '/usuarios',           icon: 'people', roles: ['ADMIN'] }
  ];

  get menuItems() {
    const user = this.authService.getCurrentUser();
    if (!user || !user.rol) return [];
    let userRole = user.rol.toUpperCase();
    if (userRole === 'TRABAJADOR') userRole = 'OPERARIO';
    return this.allMenuItems.filter(item => item.roles.includes(userRole));
  }

  getUserName(): string {
    const user = this.authService.getCurrentUser();
    return user ? `${user.nombre} ${user.apellido || ''}`.trim() : 'Usuario';
  }

  getUserRoleLabel(): string {
    const user = this.authService.getCurrentUser();
    if (!user || !user.rol) return 'Invitado';
    const role = user.rol.toUpperCase();
    switch (role) {
      case 'ADMIN': return 'Administrador General';
      case 'SUPERVISOR': return 'Supervisor de Operaciones';
      case 'SUPERVISOR_ALMACEN': return 'Supervisor de Almacén';
      case 'AGRONOMO': return 'Ingeniero Agrónomo';
      case 'TECNICO': return 'Técnico de Campo';
      case 'OPERARIO':
      case 'OPERADOR':
      case 'TRABAJADOR': return 'Operador Agrícola';
      default: return role;
    }
  }

  logout(event: Event): void {
    event.preventDefault();
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
