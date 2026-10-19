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
    { label: 'Inicio',            route: '/inicio',             icon: 'home', roles: ['ADMIN', 'SUPERVISOR', 'SUPERVISOR_ALMACEN', 'OPERADOR'] },
    { label: 'Parcelas',          route: '/parcelas',           icon: 'landscape', roles: ['ADMIN', 'SUPERVISOR'] },
    { label: 'Cultivos',          route: '/cultivos',           icon: 'grass', roles: ['ADMIN', 'SUPERVISOR'] },
    { label: 'Fichas Campo',      route: '/fichas-campo',       icon: 'assignment', roles: ['ADMIN', 'SUPERVISOR'] },
    { label: 'Cosechas',          route: '/cosechas',           icon: 'local_shipping', roles: ['ADMIN', 'SUPERVISOR'] },
    { label: 'Bodega Insumos',    route: '/insumos',            icon: 'inventory', roles: ['ADMIN', 'SUPERVISOR', 'SUPERVISOR_ALMACEN'] },
    { label: 'Kardex Stock',      route: '/movimiento-insumos', icon: 'swap_horiz', roles: ['ADMIN', 'SUPERVISOR', 'SUPERVISOR_ALMACEN'] },
    { label: 'Labores / Tareas',  route: '/actividades',        icon: 'agriculture', roles: ['ADMIN', 'SUPERVISOR', 'OPERADOR'] },
    { label: 'Asignaciones Obr.', route: '/asignaciones',       icon: 'engineering', roles: ['ADMIN', 'SUPERVISOR'] },
    { label: 'Usuarios / Pers.',  route: '/usuarios',           icon: 'people', roles: ['ADMIN'] }
  ];

  get menuItems() {
    const user = this.authService.getCurrentUser();
    if (!user || !user.rol) return [];
    let userRole = user.rol.toUpperCase();
    if (userRole === 'TRABAJADOR') userRole = 'OPERADOR';
    return this.allMenuItems.filter(item => item.roles.includes(userRole));
  }

  getUserName(): string {
    const user = this.authService.getCurrentUser();
    return user ? `${user.nombre} ${user.apellido}` : 'Usuario';
  }

  getUserRoleLabel(): string {
    const user = this.authService.getCurrentUser();
    if (!user || !user.rol) return 'Invitado';
    const role = user.rol.toUpperCase();
    if (role === 'ADMIN') return 'Administrador';
    if (role === 'SUPERVISOR') return 'Supervisor';
    if (role === 'SUPERVISOR_ALMACEN') return 'Supervisor de Almacén';
    if (role === 'OPERADOR') return 'Operador de Campo';
    if (role === 'TRABAJADOR') return 'Operador';
    return role;
  }

  logout(event: Event): void {
    event.preventDefault();
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
