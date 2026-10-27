import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  Package,
  MapPin,
  Users,
  AlertTriangle,
  Server,
  Database,
  CheckCircle2,
  DollarSign,
  Scale,
  Activity,
  Layers,
  ArrowUpRight,
  ExternalLink,
  BarChart3,
  Sprout,
  Sparkles,
} from 'lucide-react';
import {
  analyticsService,
  DashboardGeneralResponse,
  HugoCampoResponse,
  AnaCosechasResponse,
  AxelPersonalResponse,
} from '../services/analyticsService';
import { cultivoService } from '../../cultivos/services/cultivoService';
import { Cultivo } from '../../cultivos/types/cultivo.types';
import { CropGrowthVisualizer } from '../../../components/CropGrowthVisualizer';

export const DashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'HUGO' | 'ANA' | 'AXEL'>('GENERAL');
  const [loading, setLoading] = useState(true);

  // States
  const [generalData, setGeneralData] = useState<DashboardGeneralResponse | null>(null);
  const [hugoData, setHugoData] = useState<HugoCampoResponse | null>(null);
  const [anaData, setAnaData] = useState<AnaCosechasResponse | null>(null);
  const [axelData, setAxelData] = useState<AxelPersonalResponse | null>(null);

  // Cultivos reales de la base de datos
  const [cultivosList, setCultivosList] = useState<Cultivo[]>([]);
  const [selectedCultivoId, setSelectedCultivoId] = useState<number | string>('');

  const currentCrop = cultivosList.find((c) => String(c.id) === String(selectedCultivoId)) || cultivosList[0] || null;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [gen, hugo, ana, axel, cultivos] = await Promise.all([
          analyticsService.obtenerGeneral(),
          analyticsService.obtenerHugoCampo(),
          analyticsService.obtenerAnaCosechas(),
          analyticsService.obtenerAxelPersonal(),
          cultivoService.listar().catch(() => [] as Cultivo[]),
        ]);
        setGeneralData(gen);
        setHugoData(hugo);
        setAnaData(ana);
        setAxelData(axel);
        if (cultivos && cultivos.length > 0) {
          setCultivosList(cultivos);
          setSelectedCultivoId(cultivos[0].id ?? '');
        }
      } catch (err) {
        console.error('Error cargando analítica o cultivos de base de datos:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const totalCostoOperativo = generalData?.grafico_circular?.reduce((acc, curr) => acc + curr.monto, 0) || 0;

  return (
    <div className="content-page">
      {/* Header Corporativo AgroPacayales */}
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div className="page-title-group">
          <h1>
            <LayoutDashboard size={28} color="var(--emerald-400)" />
            Centro de Inteligencia Analítica & Costos
            <span className="author-chip">Backend 2 Analítico • Flask + Pandas</span>
          </h1>
          <p className="page-subtitle">
            Monitoreo en tiempo real de los 18 indicadores PIT, costos operativos, cosechas y jornales
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <a
            href={`http://${window.location.hostname}:30002/api/v1/analytics/docs/`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}
          >
            <ExternalLink size={15} /> Swagger Analítico
          </a>
        </div>
      </div>

      {/* Tabs Principales de Análisis */}
      <div className="table-controls" style={{ marginBottom: 20 }}>
        <div className="estado-tabs" style={{ width: '100%', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          <button
            className={`tab-btn ${activeTab === 'GENERAL' ? 'active' : ''}`}
            onClick={() => setActiveTab('GENERAL')}
          >
            <BarChart3 size={16} />
            <span>Resumen Ejecutivo & Costos</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'HUGO' ? 'active' : ''}`}
            onClick={() => setActiveTab('HUGO')}
          >
            <Package size={16} />
            <span>Labores Agrícolas & Consumo de Insumos</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'ANA' ? 'active' : ''}`}
            onClick={() => setActiveTab('ANA')}
          >
            <Sprout size={16} />
            <span>Control de Cosechas & Rendimiento</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'AXEL' ? 'active' : ''}`}
            onClick={() => setActiveTab('AXEL')}
          >
            <Users size={16} />
            <span>Mano de Obra & Asignación de Jornales</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: RESUMEN EJECUTIVO & COSTOS                              */}
      {/* ============================================================== */}
      {/* ============================================================== */}
      {/* TAB 1: RESUMEN EJECUTIVO & COSTOS                              */}
      {/* ============================================================== */}
      {activeTab === 'GENERAL' && (() => {
        const generalCards = generalData?.cards || {
          kilos_cosechados: 0,
          eficiencia_cosecha_pct: 0,
          valor_inventario: 0,
          insumos_stock_critico: 0,
          costo_total_mano_obra: 0,
          usuarios_activos: 0,
          tasa_cumplimiento_actividades_pct: 0,
        };
        const generalCircular = generalData?.grafico_circular || [];
        const generalBarras = generalData?.grafico_barras || [];
        const generalTabla = generalData?.tabla || [];

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* 4 Cards Principales */}
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-icon-wrap" style={{ background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)' }}>
                  <Scale size={24} />
                </div>
                <div className="metric-info">
                  <h4>Producción Cosechada</h4>
                  <div className="metric-value font-mono">
                    {(generalCards.kilos_cosechados / 1000).toFixed(1)} tn
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#16a34a', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                    <TrendingUp size={13} /> {generalCards.eficiencia_cosecha_pct}% eficiencia neta
                  </div>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon-wrap" style={{ background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)' }}>
                  <Package size={24} />
                </div>
                <div className="metric-info">
                  <h4>Valor Inventario Insumos</h4>
                  <div className="metric-value font-mono">
                    S/. {generalCards.valor_inventario.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#0284c7', marginTop: 4 }}>
                    {generalCards.insumos_stock_critico} insumos en stock crítico
                  </div>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon-wrap" style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #818cf8 100%)' }}>
                  <Users size={24} />
                </div>
                <div className="metric-info">
                  <h4>Gasto en Mano de Obra</h4>
                  <div className="metric-value font-mono">
                    S/. {generalCards.costo_total_mano_obra.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#6366f1', marginTop: 4 }}>
                    {generalCards.usuarios_activos} trabajadores en nómina
                  </div>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon-wrap" style={{ background: 'linear-gradient(135deg, #d97706 0%, #fbbf24 100%)' }}>
                  <Activity size={24} />
                </div>
                <div className="metric-info">
                  <h4>Cumplimiento de Labores</h4>
                  <div className="metric-value font-mono" style={{ color: '#d97706' }}>
                    {generalCards.tasa_cumplimiento_actividades_pct}%
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#d97706', marginTop: 4 }}>
                    Mantenimiento y fertirriego
                  </div>
                </div>
              </div>
            </div>

            {/* Seguimiento Fenológico & Cuaderno de Campo */}
            <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--sand-border)' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
                padding: '16px 20px',
                background: 'linear-gradient(135deg, var(--earth-darkest) 0%, var(--earth-dark) 100%)',
                color: '#ffffff',
                borderBottom: '1px solid rgba(140, 90, 60, 0.3)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Sprout size={22} color="var(--emerald-vibrant, #10B981)" />
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.08rem', fontWeight: 800, color: '#ffffff' }}>
                      Seguimiento del Ciclo Fenológico & Bitácora de Campo
                    </h3>
                    <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--sand-light)' }}>
                      Evolución biológica estimada desde la siembra y recomendaciones técnicas de inspección presencial
                    </p>
                  </div>
                </div>

                {/* Selector desplegable en vivo conectado a la base de datos */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <label style={{ fontSize: '0.82rem', color: 'var(--sand-light)', fontWeight: 600 }}>
                    Cultivo en Fundo:
                  </label>
                  <select
                    value={selectedCultivoId}
                    onChange={(e) => setSelectedCultivoId(e.target.value)}
                    style={{
                      background: 'rgba(0, 0, 0, 0.45)',
                      color: '#ffffff',
                      border: '1px solid rgba(232, 213, 196, 0.3)',
                      borderRadius: 8,
                      padding: '6px 12px',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                    id="dashboard-crop-selector"
                  >
                    {cultivosList.length > 0 ? (
                      cultivosList.map((c) => (
                        <option key={c.id} value={c.id}>
                          🌱 {c.nombre} {c.variedad ? `(${c.variedad})` : ''} — Parcela {c.idParcela}
                        </option>
                      ))
                    ) : (
                      <option value="">Cargando cultivos desde base de datos...</option>
                    )}
                  </select>
                </div>
              </div>

              {currentCrop ? (
                <CropGrowthVisualizer
                  cultivoNombre={currentCrop.nombre}
                  variedad={currentCrop.variedad}
                  parcelaId={String(currentCrop.idParcela || '')}
                  fechaSiembra={currentCrop.fechaSiembra}
                  isModal={false}
                  hideTopHeader={true}
                />
              ) : (
                <div style={{ padding: 36, textAlign: 'center', color: '#94a3b8' }}>
                  {loading ? 'Consultando cultivos de campo desde la base de datos...' : 'No hay cultivos registrados en el sistema.'}
                </div>
              )}
            </div>

            {/* Gráficos de Costos y Producción */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 20 }}>
              {/* Gráfico de Distribución de Costos */}
              <div className="card">
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <DollarSign size={20} color="#16a34a" />
                  Estructura de Costos Operativos Acumulados
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', marginBottom: 20 }}>
                  Total acumulado valorizado: <strong>S/. {totalCostoOperativo.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</strong>
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {generalCircular.length > 0 ? (
                    generalCircular.map((item, idx) => {
                      const pct = ((item.monto / (totalCostoOperativo || 1)) * 100).toFixed(1);
                      const colors = ['#059669', '#4f46e5', '#0284c7'];
                      const barColor = colors[idx % colors.length];

                      return (
                        <div key={item.categoria}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 4 }}>
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.categoria}</span>
                            <span className="font-mono">
                              S/. {item.monto.toLocaleString('es-PE')} <strong>({pct}%)</strong>
                            </span>
                          </div>
                          <div style={{ width: '100%', height: 10, background: '#e2e8f0', borderRadius: 6, overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: barColor, borderRadius: 6, transition: 'width 0.6s ease' }} />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                      {loading ? 'Calculando costos operativos con Pandas...' : 'Sin movimientos de costos registrados.'}
                    </div>
                  )}
                </div>

                <div style={{ marginTop: 24, padding: 12, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.82rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Sparkles size={16} color="#d97706" style={{ flexShrink: 0 }} />
                  <span><strong>Optimización Analítica:</strong> Los insumos representan el mayor activo inmovilizado. Se recomienda rotar los lotes de fertilizantes para evitar degradación.</span>
                </div>
              </div>

              {/* Gráfico de Rendimiento por Cultivo */}
              <div className="card">
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Scale size={20} color="#0284c7" />
                  Cosecha Neta vs Merma por Cultivo (kg)
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', marginBottom: 16 }}>
                  Comparativa de kilos óptimos cosechados frente al descarte en campo
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {generalBarras.length > 0 ? (
                    generalBarras.map((c) => {
                      const total = c.kilos_optimos + c.kilos_merma;
                      const optPct = ((c.kilos_optimos / (total || 1)) * 100).toFixed(1);
                      const maxTotal = Math.max(...generalBarras.map(x => x.kilos_optimos + x.kilos_merma));
                      const relativeBar = ((total / maxTotal) * 100).toFixed(0);

                      return (
                        <div key={c.cultivo}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 4 }}>
                            <strong style={{ color: 'var(--text-primary)' }}>{c.cultivo}</strong>
                            <span className="font-mono" style={{ fontSize: '0.82rem' }}>
                              <span style={{ color: '#16a34a', fontWeight: 700 }}>{c.kilos_optimos.toLocaleString()} kg óptimo</span>{' '}
                              / <span style={{ color: '#ef4444' }}>{c.kilos_merma.toLocaleString()} kg merma</span>
                            </span>
                          </div>
                          <div style={{ display: 'flex', width: `${relativeBar}%`, height: 10, borderRadius: 6, overflow: 'hidden' }}>
                            <div style={{ width: `${optPct}%`, background: '#10b981' }} title="Óptimo" />
                            <div style={{ width: `${100 - Number(optPct)}%`, background: '#ef4444' }} title="Merma" />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                      {loading ? 'Calculando rendimientos con Backend Analítico...' : 'Sin cosechas registradas.'}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 16, marginTop: 18, fontSize: '0.8rem', color: '#64748b' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 12, height: 12, background: '#10b981', borderRadius: 3 }} /> Kilos Óptimos (Exportación)
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 12, height: 12, background: '#ef4444', borderRadius: 3 }} /> Merma / Descarte Técnico
                  </div>
                </div>
              </div>
            </div>

            {/* Tabla de Insumos con Mayor Rotación y Costo */}
            <div className="card">
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Package size={20} color="#059669" />
                Insumos de Mayor Consumo y Gasto en Campo [H6]
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', marginBottom: 16 }}>
                Cruce relacional de SQL Server (detalle_actividad) con MongoDB (supplies) generado por Backend Analítico
              </p>

              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Código Insumo</th>
                      <th>Descripción de Insumo</th>
                      <th style={{ textAlign: 'right' }}>Cantidad Aplicada</th>
                      <th style={{ textAlign: 'right' }}>Gasto Acumulado</th>
                      <th style={{ textAlign: 'right' }}>Stock Remanente</th>
                      <th style={{ textAlign: 'center' }}>Estado Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {generalTabla.length > 0 ? (
                      generalTabla.map((ins) => (
                        <tr key={ins.id_insumo}>
                          <td><span className="code-pill font-mono">{ins.id_insumo}</span></td>
                          <td><strong>{ins.nombre}</strong></td>
                          <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{ins.cantidad_consumida} unid.</td>
                          <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: '#0f172a' }}>
                            S/. {ins.gasto_total.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{ins.stock_actual}</td>
                          <td style={{ textAlign: 'center' }}>
                            {ins.stock_actual < 50 ? (
                              <span className="badge badge-danger">Alerta Crítica</span>
                            ) : (
                              <span className="badge badge-success">Abastecido</span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: 24, color: '#94a3b8' }}>
                          {loading ? 'Consultando consumo de insumos en tiempo real...' : 'Sin registros de consumo de insumos.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ============================================================== */}
      {/* TAB 2: HUGO FERNÁNDEZ #07 (ACTIVIDADES E INSUMOS)              */}
      {/* ============================================================== */}
      {activeTab === 'HUGO' && hugoData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Métricas Hugo */}
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-icon-wrap" style={{ background: '#059669' }}>
                <Activity size={24} />
              </div>
              <div className="metric-info">
                <h4>[H1] Total Labores de Campo</h4>
                <div className="metric-value font-mono">{hugoData.actividades.total_actividades}</div>
                <div style={{ fontSize: '0.78rem', color: '#059669', marginTop: 4 }}>
                  {hugoData.actividades.completadas} completadas ({hugoData.actividades.tasa_cumplimiento_pct}%)
                </div>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon-wrap" style={{ background: '#0284c7' }}>
                <DollarSign size={24} />
              </div>
              <div className="metric-info">
                <h4>[H1] Costo Labores Acumulado</h4>
                <div className="metric-value font-mono">
                  S/. {hugoData.actividades.costo_total_acumulado.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#0284c7', marginTop: 4 }}>
                  Insumos aplicados en campo
                </div>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon-wrap" style={{ background: '#16a34a' }}>
                <Package size={24} />
              </div>
              <div className="metric-info">
                <h4>[H3] Valor Total Inventario</h4>
                <div className="metric-value font-mono">
                  S/. {hugoData.insumos.valor_total_inventario.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#16a34a', marginTop: 4 }}>
                  {hugoData.insumos.total_insumos} referencias en MongoDB
                </div>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon-wrap" style={{ background: '#ef4444' }}>
                <AlertTriangle size={24} />
              </div>
              <div className="metric-info">
                <h4>[H5] Insumos Stock Crítico</h4>
                <div className="metric-value font-mono" style={{ color: '#ef4444' }}>
                  {hugoData.insumos.insumos_stock_critico}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#ef4444', marginTop: 4 }}>
                  Requieren orden de compra
                </div>
              </div>
            </div>
          </div>

          {/* Gráficos de Hugo */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20 }}>
            {/* [H2] Costo por Tipo de Actividad */}
            <div className="card">
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 6 }}>
                [H2] Costo e Intensidad por Tipo de Labor Agrícola
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', marginBottom: 16 }}>
                Distribución de inversión agronómica por cuadrillas y aplicaciones
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {hugoData.actividades_por_tipo.map((a) => (
                  <div key={a.tipo_actividad}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 4 }}>
                      <span style={{ fontWeight: 600 }}>{a.tipo_actividad}</span>
                      <span className="font-mono">
                        S/. {a.costo_total.toLocaleString()} ({a.cantidad} ejecuciones)
                      </span>
                    </div>
                    <div style={{ width: '100%', height: 10, background: '#e2e8f0', borderRadius: 6, overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${Math.min((a.costo_total / 30000) * 100, 100)}%`,
                          height: '100%',
                          background: '#059669',
                          borderRadius: 6,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* [H4] Inventario por Categoría */}
            <div className="card">
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 6 }}>
                [H4] Distribución de Valor por Categoría de Insumo
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', marginBottom: 16 }}>
                Porcentaje de capital inmovilizado en bodega
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {hugoData.insumos_por_tipo.map((cat) => (
                  <div key={cat.tipo_insumo} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: '#f8fafc', borderRadius: 6 }}>
                    <div>
                      <strong style={{ fontSize: '0.85rem', color: '#0f172a' }}>{cat.tipo_insumo}</strong>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{cat.items} variedades • {cat.stock.toLocaleString()} unidades</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="font-mono" style={{ fontWeight: 700, fontSize: '0.9rem' }}>S/. {cat.valor.toLocaleString()}</div>
                      <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>{cat.porcentaje_valor}% del total</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* [H5] Tabla de Stock Crítico */}
          <div className="card">
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={20} color="#ef4444" />
              [H5] Insumos en Alerta de Stock Crítico (&le; 20 unidades)
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', marginBottom: 16 }}>
              Insumos fitosanitarios y fertilizantes que requieren reposición inmediata para no interrumpir el plan de aplicaciones
            </p>

            <table className="data-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nombre Insumo</th>
                  <th>Categoría</th>
                  <th>Stock Actual</th>
                  <th>Proveedor Homologado</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {hugoData.stock_critico.map((crit) => (
                  <tr key={crit.id_insumo}>
                    <td><span className="code-pill font-mono">{crit.id_insumo}</span></td>
                    <td><strong>{crit.nombre}</strong></td>
                    <td><span className="badge badge-info">{crit.tipo_insumo}</span></td>
                    <td>
                      <span className="font-mono" style={{ color: '#ef4444', fontWeight: 700 }}>
                        {crit.stock} {crit.unidad_medida}
                      </span>
                    </td>
                    <td>{crit.proveedor}</td>
                    <td><span className="badge badge-danger">Reabastecer</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: ANA FÉLIX #05 (COSECHAS Y RENDIMIENTO)                  */}
      {/* ============================================================== */}
      {activeTab === 'ANA' && anaData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Métricas Ana */}
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-icon-wrap" style={{ background: '#0284c7' }}>
                <Scale size={24} />
              </div>
              <div className="metric-info">
                <h4>[A1] Kilos Totales Cosechados</h4>
                <div className="metric-value font-mono">
                  {(anaData.resumen.kilos_totales).toLocaleString()} kg
                </div>
                <div style={{ fontSize: '0.78rem', color: '#0284c7', marginTop: 4 }}>
                  {anaData.resumen.total_cosechas} partidas procesadas
                </div>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon-wrap" style={{ background: '#16a34a' }}>
                <CheckCircle2 size={24} />
              </div>
              <div className="metric-info">
                <h4>[A1] Cosecha Calidad Óptima</h4>
                <div className="metric-value font-mono" style={{ color: '#16a34a' }}>
                  {anaData.resumen.kilos_optimos.toLocaleString()} kg
                </div>
                <div style={{ fontSize: '0.78rem', color: '#16a34a', marginTop: 4 }}>
                  Apta para exportación directa
                </div>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon-wrap" style={{ background: '#ef4444' }}>
                <AlertTriangle size={24} />
              </div>
              <div className="metric-info">
                <h4>[A1] Kilos Merma / Descarte</h4>
                <div className="metric-value font-mono" style={{ color: '#ef4444' }}>
                  {anaData.resumen.kilos_merma.toLocaleString()} kg
                </div>
                <div style={{ fontSize: '0.78rem', color: '#ef4444', marginTop: 4 }}>
                  Tasa de merma: {anaData.resumen.tasa_merma_pct}%
                </div>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon-wrap" style={{ background: '#059669' }}>
                <TrendingUp size={24} />
              </div>
              <div className="metric-info">
                <h4>[A1] Eficiencia de Cosecha</h4>
                <div className="metric-value font-mono" style={{ color: '#059669' }}>
                  {anaData.resumen.eficiencia_cosecha_pct}%
                </div>
                <div style={{ fontSize: '0.78rem', color: '#059669', marginTop: 4 }}>
                  Meta anual: &gt; 90%
                </div>
              </div>
            </div>
          </div>

          {/* Gráficos de Ana */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* [A2] Calidad de Cosecha */}
            <div className="card">
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 6 }}>
                [A2] Clasificación de Calidad y Destino Comercial
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', marginBottom: 16 }}>
                Segmentación según calibres y requisitos fitosanitarios internacionales
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {anaData.calidad.map((item, idx) => {
                  const colors = ['#10b981', '#0284c7', '#ef4444'];
                  return (
                    <div key={item.categoria}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 4 }}>
                        <span style={{ fontWeight: 600 }}>{item.categoria}</span>
                        <span className="font-mono">{item.kilos.toLocaleString()} kg ({item.porcentaje}%)</span>
                      </div>
                      <div style={{ width: '100%', height: 10, background: '#e2e8f0', borderRadius: 6, overflow: 'hidden' }}>
                        <div style={{ width: `${item.porcentaje}%`, height: '100%', background: colors[idx % colors.length], borderRadius: 6 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* [A3] Rendimiento por Cultivo */}
            <div className="card">
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 6 }}>
                [A3] Kilos Óptimos por Especie Agrícola
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', marginBottom: 16 }}>
                Volumen neto de exportación por variedad cultivada
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {anaData.por_cultivo.map((c) => (
                  <div key={c.cultivo} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: '#f8fafc', borderRadius: 6 }}>
                    <div>
                      <strong style={{ fontSize: '0.85rem' }}>{c.cultivo}</strong>
                    </div>
                    <div className="font-mono" style={{ fontWeight: 700, color: '#059669' }}>
                      {c.kilos_optimos.toLocaleString()} kg
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 4: AXEL HUAPAYA #10 (PERSONAL Y JORNALES)                  */}
      {/* ============================================================== */}
      {activeTab === 'AXEL' && axelData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Métricas Axel */}
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-icon-wrap" style={{ background: '#4f46e5' }}>
                <Users size={24} />
              </div>
              <div className="metric-info">
                <h4>[X1] Personal Activo en Campo</h4>
                <div className="metric-value font-mono">{axelData.resumen.usuarios_activos}</div>
                <div style={{ fontSize: '0.78rem', color: '#4f46e5', marginTop: 4 }}>
                  De {axelData.resumen.total_usuarios} colaboradores registrados
                </div>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon-wrap" style={{ background: '#0284c7' }}>
                <Layers size={24} />
              </div>
              <div className="metric-info">
                <h4>[X1] Cuadrillas Asignadas</h4>
                <div className="metric-value font-mono">{axelData.resumen.total_asignaciones}</div>
                <div style={{ fontSize: '0.78rem', color: '#0284c7', marginTop: 4 }}>
                  Partes diarios ejecutados
                </div>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon-wrap" style={{ background: '#059669' }}>
                <DollarSign size={24} />
              </div>
              <div className="metric-info">
                <h4>[X1] Costo Mano de Obra</h4>
                <div className="metric-value font-mono">
                  S/. {axelData.resumen.costo_total_mano_obra.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#059669', marginTop: 4 }}>
                  {axelData.resumen.horas_totales_trabajadas.toLocaleString()} horas efectivas
                </div>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon-wrap" style={{ background: '#d97706' }}>
                <TrendingUp size={24} />
              </div>
              <div className="metric-info">
                <h4>[X1] Tarifa Promedio Hora</h4>
                <div className="metric-value font-mono" style={{ color: '#d97706' }}>
                  S/. {axelData.resumen.costo_promedio_hora.toFixed(2)}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#d97706', marginTop: 4 }}>
                  Promedio ponderado cuadrilla
                </div>
              </div>
            </div>
          </div>

          {/* Gráficos de Axel */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* [X2] Distribución por Rol */}
            <div className="card">
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 6 }}>
                [X2] Estructura Organizacional por Rol Agrícola
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', marginBottom: 16 }}>
                Distribución de colaboradores según responsabilidades técnicas
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {axelData.por_rol.map((r) => (
                  <div key={r.rol} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: '#f8fafc', borderRadius: 6 }}>
                    <div>
                      <strong style={{ fontSize: '0.85rem' }}>{r.rol}</strong>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', marginLeft: 8 }}>{r.cantidad} trabajadores</span>
                    </div>
                    <span className="font-mono" style={{ fontWeight: 700, color: '#4f46e5' }}>{r.porcentaje}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* [X3] Mano de Obra por Actividad */}
            <div className="card">
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 6 }}>
                [X3] Costo de Mano de Obra por Tipo de Labor
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', marginBottom: 16 }}>
                Jornales devengados por actividad cultural
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {axelData.mano_obra_por_actividad.map((m) => (
                  <div key={m.tipo_actividad}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 4 }}>
                      <span style={{ fontWeight: 600 }}>{m.tipo_actividad}</span>
                      <span className="font-mono">
                        S/. {m.costo_mano_obra.toLocaleString()} ({m.horas_trabajadas} hrs)
                      </span>
                    </div>
                    <div style={{ width: '100%', height: 10, background: '#e2e8f0', borderRadius: 6, overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${Math.min((m.costo_mano_obra / 35000) * 100, 100)}%`,
                          height: '100%',
                          background: '#4f46e5',
                          borderRadius: 6,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* [X4] Ranking de Trabajadores */}
          <div className="card">
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users size={20} color="#4f46e5" />
              [X4] Ranking de Colaboradores con Mayor Participación y Jornales
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', marginBottom: 16 }}>
              Cruce relacional de SQL Server (asignacion_detalle) con MongoDB (users)
            </p>

            <table className="data-table">
              <thead>
                <tr>
                  <th>Código Usuario</th>
                  <th>Colaborador</th>
                  <th>Rol en Cuadrilla</th>
                  <th style={{ textAlign: 'right' }}>Asignaciones</th>
                  <th style={{ textAlign: 'right' }}>Costo Acumulado</th>
                  <th style={{ textAlign: 'center' }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {axelData.ranking_trabajadores.map((t) => (
                  <tr key={t.id_usuario}>
                    <td><span className="code-pill font-mono">{t.id_usuario}</span></td>
                    <td><strong>{t.nombre_completo}</strong></td>
                    <td><span className="badge badge-info">{t.rol}</span></td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{t.asignaciones} labores</td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: '#0f172a' }}>
                      S/. {t.costo_acumulado.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ textAlign: 'center' }}><span className="badge badge-success">Destacado</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Footer de Topología y Persistencia Políglota */}
      <div style={{ marginTop: 28, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card">
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Server size={18} color="var(--emerald-400)" />
            Topología del Clúster K3s AWS
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#f8fafc', borderRadius: 6 }}>
              <span>Frontend React + Vite</span>
              <span className="badge badge-success">NodePort 30000</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#f8fafc', borderRadius: 6 }}>
              <span>Backend 1 Transaccional (WebFlux)</span>
              <span className="badge badge-info">NodePort 30001</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#f8fafc', borderRadius: 6 }}>
              <span>Backend 2 Analítico (Flask + Pandas)</span>
              <span className="badge badge-warning">NodePort 30002</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Database size={18} color="#0284c7" />
            Persistencia Políglota Integrada
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#f8fafc', borderRadius: 6 }}>
              <span>Amazon RDS SQL Server (Tablas Transaccionales)</span>
              <span className="font-mono" style={{ color: '#16a34a' }}>agropacayales_db:1433</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#f8fafc', borderRadius: 6 }}>
              <span>EC2 MongoDB 8.0 (Colecciones Maestras)</span>
              <span className="font-mono" style={{ color: '#0284c7' }}>agropacayales_db:27017</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#f8fafc', borderRadius: 6 }}>
              <span>Integración Móvil (React Native Expo)</span>
              <span className="badge badge-active">Android & iOS</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
