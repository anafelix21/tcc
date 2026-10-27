import React from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  MapPin,
  Users,
  LayoutDashboard,
  Sprout,
  Truck,
  ClipboardList,
  Wrench,
  UserCheck,
  Server,
  Database,
  Layers,
  ArrowUpRight,
  TrendingUp,
  Droplets,
  Sun
} from 'lucide-react';

export const InicioPage: React.FC = () => {
  return (
    <div className="page-container">
      {/* Hero Banner Corporativo de AgroPacayales */}
      <div className="corp-hero-card">
        <div className="corp-hero-bg" style={{ backgroundImage: 'url(/images/hero.jpg)' }} />
        <div className="corp-hero-gradient" />
        <div className="corp-hero-inner">
          <div className="corp-hero-badge">
            <span className="live-dot" />
            <span>OPERACIONES EN VIVO • VALLE DE CAÑETE & ICA</span>
          </div>

          <h1 className="corp-hero-title">
            AgroPacayales S.A.C.
          </h1>
          <p className="corp-hero-desc">
            Sistema Integrado de Control Agrícola, Trazabilidad de Exportación y Analítica Avanzada en AWS K3s.
          </p>

          <div className="corp-hero-stats">
            <div className="hero-stat-item">
              <Sun size={18} color="#f59e0b" />
              <div>
                <strong>24.5 °C • Soleado</strong>
                <small>Clima Valle de Cañete</small>
              </div>
            </div>
            <div className="hero-stat-item">
              <Droplets size={18} color="#38bdf8" />
              <div>
                <strong>Riego por Goteo</strong>
                <small>Presión 2.2 bar • Activo</small>
              </div>
            </div>
            <div className="hero-stat-item">
              <Server size={18} color="#4ade80" />
              <div>
                <strong>Clúster Kubernetes</strong>
                <small>4 Nodos AWS EC2 en Línea</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tarjetas KPI de Resumen General */}
      <div className="kpi-grid" style={{ marginBottom: 28 }}>
        <div className="kpi-card-enterprise">
          <div className="kpi-icon-wrapper" style={{ background: '#ecfdf5', color: '#059669' }}>
            <Package size={24} />
          </div>
          <div className="kpi-content">
            <span className="kpi-sub">Almacén Central</span>
            <h3 className="kpi-number">+200 Insumos</h3>
            <span className="kpi-trend positive">
              <TrendingUp size={14} /> Stock Homologado
            </span>
          </div>
        </div>

        <div className="kpi-card-enterprise">
          <div className="kpi-icon-wrapper" style={{ background: '#e0f2fe', color: '#0284c7' }}>
            <MapPin size={24} />
          </div>
          <div className="kpi-content">
            <span className="kpi-sub">Zonas Agrícolas</span>
            <h3 className="kpi-number">50 Parcelas</h3>
            <span className="kpi-trend positive">
              <TrendingUp size={14} /> Suelos Mapeados
            </span>
          </div>
        </div>

        <div className="kpi-card-enterprise">
          <div className="kpi-icon-wrapper" style={{ background: '#fef3c7', color: '#d97706' }}>
            <Users size={24} />
          </div>
          <div className="kpi-content">
            <span className="kpi-sub">Mano de Obra</span>
            <h3 className="kpi-number">150 Personal</h3>
            <span className="kpi-trend positive">
              <TrendingUp size={14} /> Cuadrillas Activas
            </span>
          </div>
        </div>

        <div className="kpi-card-enterprise">
          <div className="kpi-icon-wrapper" style={{ background: '#f3e8ff', color: '#7e22ce' }}>
            <LayoutDashboard size={24} />
          </div>
          <div className="kpi-content">
            <span className="kpi-sub">Analítica Predictiva</span>
            <h3 className="kpi-number">18 Indicadores</h3>
            <span className="kpi-trend positive">
              <TrendingUp size={14} /> Flask + Pandas
            </span>
          </div>
        </div>
      </div>

      {/* Grid de Módulos Operativos de la Empresa */}
      <div className="section-title-wrap">
        <h2>Módulos del Sistema Agroindustrial</h2>
        <p>Acceda a los servicios maestros, transacciones de campo y motores analíticos</p>
      </div>

      <div className="enterprise-modules-grid">
        <Link to="/insumos" className="ent-module-card">
          <div className="ent-card-header">
            <div className="ent-icon" style={{ background: '#dcfce7', color: '#16a34a' }}>
              <Package size={22} />
            </div>
            <span className="ent-tag">Catálogo GlobalG.A.P.</span>
          </div>
          <h4>Almacén de Insumos</h4>
          <p>Catálogo de fertilizantes, pesticidas y semillas con validación de stock y precios.</p>
          <div className="ent-card-footer">
            <span>Abrir catálogo</span>
            <ArrowUpRight size={16} />
          </div>
        </Link>

        <Link to="/parcelas" className="ent-module-card">
          <div className="ent-card-header">
            <div className="ent-icon" style={{ background: '#e0f2fe', color: '#0284c7' }}>
              <MapPin size={22} />
            </div>
            <span className="ent-tag">Zonificación Agrícola</span>
          </div>
          <h4>Sectores y Parcelas</h4>
          <p>Zonificación de suelos (franco arenoso/limoso), hectáreas y monitoreo de riego tecnificado.</p>
          <div className="ent-card-footer">
            <span>Ver parcelas</span>
            <ArrowUpRight size={16} />
          </div>
        </Link>

        <Link to="/usuarios" className="ent-module-card">
          <div className="ent-card-header">
            <div className="ent-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
              <Users size={22} />
            </div>
            <span className="ent-tag">Recursos Humanos</span>
          </div>
          <h4>Gestión de Personal</h4>
          <p>Registro de ingenieros, supervisores y operarios con asignación de roles y estados.</p>
          <div className="ent-card-footer">
            <span>Gestionar usuarios</span>
            <ArrowUpRight size={16} />
          </div>
        </Link>

        <Link to="/dashboard" className="ent-module-card ent-card-featured">
          <div className="ent-card-header">
            <div className="ent-icon" style={{ background: '#f3e8ff', color: '#7e22ce' }}>
              <LayoutDashboard size={22} />
            </div>
            <span className="ent-tag" style={{ background: '#7e22ce', color: '#fff' }}>Motor Analítico</span>
          </div>
          <h4>Métricas y Costos (Backend 2)</h4>
          <p>Tableros analíticos conectados al Backend Flask + Pandas con 18 métricas de rendimiento y costos.</p>
          <div className="ent-card-footer">
            <span>Consultar métricas</span>
            <ArrowUpRight size={16} />
          </div>
        </Link>

        <Link to="/cultivos" className="ent-module-card">
          <div className="ent-card-header">
            <div className="ent-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
              <Sprout size={22} />
            </div>
            <span className="ent-tag">SQL Server 2022</span>
          </div>
          <h4>Ciclos de Cultivo</h4>
          <p>Planificación de siembra, variedades (Hass, Biloxi, Red Globe) y requerimientos climáticos.</p>
          <div className="ent-card-footer">
            <span>Ver cultivos</span>
            <ArrowUpRight size={16} />
          </div>
        </Link>

        <Link to="/cosechas" className="ent-module-card">
          <div className="ent-card-header">
            <div className="ent-icon" style={{ background: '#ffedd5', color: '#ea580c' }}>
              <Truck size={22} />
            </div>
            <span className="ent-tag">SQL Server 2022</span>
          </div>
          <h4>Registro de Cosechas</h4>
          <p>Control de lotes cosechados, kilos óptimos y cálculo de mermas con alerta de límite del 20%.</p>
          <div className="ent-card-footer">
            <span>Ver cosechas</span>
            <ArrowUpRight size={16} />
          </div>
        </Link>

        <Link to="/fichas-campo" className="ent-module-card">
          <div className="ent-card-header">
            <div className="ent-icon" style={{ background: '#f1f5f9', color: '#334155' }}>
              <ClipboardList size={22} />
            </div>
            <span className="ent-tag">Diario Agronómico</span>
          </div>
          <h4>Fichas de Campo</h4>
          <p>Seguimiento técnico por parcela y monitoreo de etapas fenológicas de exportación.</p>
          <div className="ent-card-footer">
            <span>Ver fichas</span>
            <ArrowUpRight size={16} />
          </div>
        </Link>

        <Link to="/actividades" className="ent-module-card">
          <div className="ent-card-header">
            <div className="ent-icon" style={{ background: '#ecfeff', color: '#0891b2' }}>
              <Wrench size={22} />
            </div>
            <span className="ent-tag">Labores Culturales</span>
          </div>
          <h4>Labores de Campo</h4>
          <p>Programación de podas, fumigaciones y aplicaciones de fertilizantes por cultivo.</p>
          <div className="ent-card-footer">
            <span>Ver labores</span>
            <ArrowUpRight size={16} />
          </div>
        </Link>

        <Link to="/asignaciones" className="ent-module-card">
          <div className="ent-card-header">
            <div className="ent-icon" style={{ background: '#fef2f2', color: '#dc2626' }}>
              <UserCheck size={22} />
            </div>
            <span className="ent-tag">Distribución Cuadrillas</span>
          </div>
          <h4>Asignación de Personal</h4>
          <p>Planificación de cuadrillas operativas en campo coordinadas por supervisor.</p>
          <div className="ent-card-footer">
            <span>Ver asignaciones</span>
            <ArrowUpRight size={16} />
          </div>
        </Link>
      </div>

      {/* Topología y Estado de Infraestructura en la Nube */}
      <div className="cloud-topology-card" style={{ marginTop: 32 }}>
        <div className="topo-header">
          <div className="topo-title">
            <Layers size={22} color="#1b4332" />
            <div>
              <h3>Infraestructura Multi-Cloud en AWS</h3>
              <p>Clúster Kubernetes K3s de 4 Nodos con Persistencia Políglota</p>
            </div>
          </div>
          <span className="topo-status-badge">
            <span className="status-dot" /> Todos los nodos saludables
          </span>
        </div>

        <div className="topo-grid">
          <div className="topo-item">
            <Server size={20} color="#059669" />
            <div>
              <strong>k8s-master</strong>
              <small>Control Plane • IP 13.218.110.179</small>
            </div>
          </div>
          <div className="topo-item">
            <Server size={20} color="#0284c7" />
            <div>
              <strong>Worker 1 (Frontend)</strong>
              <small>NodePort 30000 • React+Vite</small>
            </div>
          </div>
          <div className="topo-item">
            <Server size={20} color="#d97706" />
            <div>
              <strong>Worker 2 (Backend 1)</strong>
              <small>NodePort 30001 • Spring WebFlux</small>
            </div>
          </div>
          <div className="topo-item">
            <Server size={20} color="#7e22ce" />
            <div>
              <strong>Worker 3 (Backend 2)</strong>
              <small>NodePort 30002 • Flask Analytics</small>
            </div>
          </div>
          <div className="topo-item">
            <Database size={20} color="#10b981" />
            <div>
              <strong>EC2 MongoDB 8.0</strong>
              <small>Puerto 27017 • Maestros NoSQL</small>
            </div>
          </div>
          <div className="topo-item">
            <Database size={20} color="#3b82f6" />
            <div>
              <strong>Amazon RDS SQL Server</strong>
              <small>Puerto 1433 • Transaccional Relacional</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
