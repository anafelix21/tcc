import React from 'react';
import { useLocation } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const location = useLocation();

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/insumos':
        return 'Almacén de Insumos';
      case '/parcelas':
        return 'Sectores y Parcelas';
      case '/usuarios':
        return 'Gestión de Personal';
      case '/dashboard':
        return 'Centro de Inteligencia Analítica & Costos';
      case '/cultivos':
        return 'Ciclos de Cultivo y Fenología Agronómica';
      case '/cosechas':
        return 'Registro y Rendimiento de Cosechas';
      case '/actividades':
        return 'Labores y Actividades de Campo';
      case '/fichas-campo':
        return 'Fichas Técnicas de Campo';
      case '/asignaciones':
        return 'Asignación de Personal y Cuadrillas';
      default:
        return 'Panel Principal';
    }
  };

  return (
    <header className="topbar">
      <div className="topbar-breadcrumbs">
        <span>AgroPacayales</span>
        <span>/</span>
        <span className="active">{getPageTitle()}</span>
      </div>

      <div className="topbar-actions">
        <div className="cluster-status-pill" title="Clúster K3s de 3 nodos y Bases de Datos">
          <div className="status-dot"></div>
          <span>K3s • RDS & MongoDB</span>
        </div>
      </div>
    </header>
  );
};
