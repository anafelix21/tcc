import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { 
    path: 'login', 
    loadComponent: () => import('./features/auth/pages/login/login.component').then(m => m.LoginComponent) 
  },
  { 
    path: '', 
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'inicio', pathMatch: 'full' },
      { 
        path: 'inicio',             
        loadComponent: () => import('./core/layouts/inicio/inicio.component').then(m => m.InicioComponent) 
      },
      { 
        path: 'usuarios',           
        loadComponent: () => import('./features/usuarios/pages/usuarios.component').then(m => m.UsuariosComponent),
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] }
      },
      { 
        path: 'parcelas',           
        loadComponent: () => import('./features/parcelas/pages/parcelas.component').then(m => m.ParcelasComponent),
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'SUPERVISOR'] }
      },
      { 
        path: 'insumos',            
        loadComponent: () => import('./features/insumos/pages/insumos.component').then(m => m.InsumosComponent),
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'SUPERVISOR', 'SUPERVISOR_ALMACEN'] }
      },
      { 
        path: 'cultivos',           
        loadComponent: () => import('./features/cultivos/pages/cultivos.component').then(m => m.CultivosComponent),
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'SUPERVISOR'] }
      },
      { 
        path: 'fichas-campo',       
        loadComponent: () => import('./features/fichas-campo/pages/fichas-campo.component').then(m => m.FichasCampoComponent),
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'SUPERVISOR'] }
      },
      { 
        path: 'movimiento-insumos', 
        loadComponent: () => import('./features/movimiento-insumos/pages/movimiento-insumos.component').then(m => m.MovimientoInsumosComponent),
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'SUPERVISOR', 'SUPERVISOR_ALMACEN'] }
      },
      { 
        path: 'actividades',        
        loadComponent: () => import('./features/actividades/pages/actividades.component').then(m => m.ActividadesComponent) 
      },
      { 
        path: 'asignaciones',       
        loadComponent: () => import('./features/asignaciones/pages/asignaciones.component').then(m => m.AsignacionesComponent),
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'SUPERVISOR'] }
      },
      { 
        path: 'cosechas',           
        loadComponent: () => import('./features/cosechas/pages/cosechas.component').then(m => m.CosechasComponent),
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'SUPERVISOR'] }
      }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
