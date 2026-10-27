import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Home,
  LayoutDashboard,
  MapPin,
  Sprout,
  ClipboardList,
  Truck,
  Package,
  Wrench,
  UserCheck,
  Users,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../features/auth/services/authContext';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    logout();
    navigate('/login');
  };

  const menuItems = [
    { label: 'Panel Principal',       route: '/inicio',       icon: <Home size={19} /> },
    { label: 'Métricas y Costos',     route: '/dashboard',    icon: <LayoutDashboard size={19} /> },
    { label: 'Sectores y Parcelas',   route: '/parcelas',     icon: <MapPin size={19} /> },
    { label: 'Ciclos de Cultivo',     route: '/cultivos',     icon: <Sprout size={19} /> },
    { label: 'Fichas de Campo',       route: '/fichas-campo', icon: <ClipboardList size={19} /> },
    { label: 'Registro de Cosechas',  route: '/cosechas',     icon: <Truck size={19} /> },
    { label: 'Almacén de Insumos',    route: '/insumos',      icon: <Package size={19} /> },
    { label: 'Labores de Campo',      route: '/actividades',  icon: <Wrench size={19} /> },
    { label: 'Asignación Personal',   route: '/asignaciones', icon: <UserCheck size={19} /> },
    { label: 'Gestión de Personal',   route: '/usuarios',     icon: <Users size={19} /> },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-placeholder">
          <Sprout size={24} color="#4ade80" />
        </div>
        <div className="header-text">
          <span className="title">{user?.nombre ? `${user.nombre} ${user.apellido || ''}` : 'AGROPACAYALES'}</span>
          <span className="subtitle">Administrador General</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <NavLink
            key={item.route}
            to={item.route}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            id={`nav-${item.route.replace('/', '')}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </NavLink>
        ))}

        <hr className="nav-divider" />

        <a href="#logout" onClick={handleLogout} className="nav-item logout-item">
          <span className="nav-icon"><LogOut size={19} /></span>
          <span className="nav-label">Cerrar sesión</span>
        </a>
      </nav>
    </aside>
  );
};
