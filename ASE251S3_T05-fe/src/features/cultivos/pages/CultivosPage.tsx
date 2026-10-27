import React, { useState, useEffect, useMemo } from 'react';
import { cultivoService } from '../services/cultivoService';
import { Cultivo } from '../types/cultivo.types';
import { Sprout, Search, Eye, SunMedium, Droplets, Thermometer, X, FileSpreadsheet, FileText, Sparkles } from 'lucide-react';
import { Pagination } from '../../../components/Pagination';
import { CropGrowthVisualizer } from '../../../components/CropGrowthVisualizer';

export const CultivosPage: React.FC = () => {
  const [cultivos, setCultivos] = useState<Cultivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState<'TODOS' | 'ACTIVOS' | 'INACTIVOS'>('TODOS');
  const [busqueda, setBusqueda] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [detalleCultivo, setDetalleCultivo] = useState<Cultivo | null>(null);
  const [cultivoVisualizer, setCultivoVisualizer] = useState<Cultivo | null>(null);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      let data: Cultivo[] = [];
      if (filtroEstado === 'TODOS') {
        data = await cultivoService.listar();
      } else {
        data = await cultivoService.listarPorEstado(filtroEstado === 'ACTIVOS');
      }
      setCultivos(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [filtroEstado]);

  const filtrados = useMemo(() => {
    return cultivos.filter((c) => {
      const q = busqueda.toLowerCase();
      return (
        c.nombre?.toLowerCase().includes(q) ||
        c.variedad?.toLowerCase().includes(q) ||
        c.tipoCultivo?.toLowerCase().includes(q) ||
        (c.idParcela && String(c.idParcela).toLowerCase().includes(q))
      );
    });
  }, [cultivos, busqueda]);

  const totalItems = filtrados.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  const paginados = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtrados.slice(start, start + pageSize);
  }, [filtrados, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [busqueda, filtroEstado, pageSize]);

  return (
    <div className="content-page">
      <div className="page-header">
        <div className="page-title-group">
          <h1>
            <Sprout size={28} color="var(--emerald-400)" />
            Ciclos de Cultivo y Fenología Agronómica
            <span className="author-chip">AgroPacayales S.A.C.</span>
          </h1>
          <p className="page-subtitle">
            Gestión agronómica de ciclos productivos, condiciones de sombra, temperatura y fertirriego
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="export-btn-group">
            <button
              type="button"
              className="btn-export btn-export-excel"
              onClick={() => cultivoService.exportarExcel(filtrados)}
              title="Descargar reporte oficial en formato Excel"
            >
              <FileSpreadsheet size={16} />
              <span>Exportar Excel</span>
            </button>
            <button
              type="button"
              className="btn-export btn-export-pdf"
              onClick={() => cultivoService.exportarPdf(filtrados)}
              title="Descargar o imprimir reporte oficial en formato PDF"
            >
              <FileText size={16} />
              <span>Exportar PDF</span>
            </button>
          </div>
        </div>
      </div>

      <div className="kpi-grid" style={{ marginBottom: 20 }}>
        <div className="kpi-card">
          <span className="kpi-label">Total Ciclos Registrados</span>
          <span className="kpi-value font-mono">{cultivos.length}</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Cultivos en Producción Activa</span>
          <span className="kpi-value font-mono" style={{ color: 'var(--emerald-600)' }}>
            {cultivos.filter((c) => c.estado !== false).length}
          </span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Requieren Malla de Sombra</span>
          <span className="kpi-value font-mono" style={{ color: '#d97706' }}>
            {cultivos.filter((c) => c.requiereSombra).length}
          </span>
        </div>
      </div>

      <div className="table-controls">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Buscar por cultivo, variedad o código de parcela..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <div className="estado-tabs">
            <button
              className={`tab-btn ${filtroEstado === 'TODOS' ? 'active' : ''}`}
              onClick={() => setFiltroEstado('TODOS')}
            >
              Todos ({cultivos.length})
            </button>
            <button
              className={`tab-btn ${filtroEstado === 'ACTIVOS' ? 'active' : ''}`}
              onClick={() => setFiltroEstado('ACTIVOS')}
            >
              Activos ({cultivos.filter((c) => c.estado !== false).length})
            </button>
            <button
              className={`tab-btn ${filtroEstado === 'INACTIVOS' ? 'active' : ''}`}
              onClick={() => setFiltroEstado('INACTIVOS')}
            >
              Inactivos ({cultivos.filter((c) => c.estado === false).length})
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-dim)' }}>
          <div className="status-dot" style={{ margin: '0 auto 12px', width: 12, height: 12 }}></div>
          Cargando ciclos de cultivo desde SQL Server R2DBC...
        </div>
      ) : filtrados.length === 0 ? (
        <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-dim)', background: '#fff', borderRadius: 8 }}>
          No se encontraron ciclos de cultivo registrados.
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table" id="tabla-cultivos">
            <thead>
              <tr>
                <th>Código / ID</th>
                <th>Cultivo & Variedad</th>
                <th>Tipo</th>
                <th>Parcela</th>
                <th>Siembra</th>
                <th>Temp. Ideal</th>
                <th>Sombra</th>
                <th>Estado</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginados.map((c) => {
                const idCult = c.idCultivo || c.id || 0;
                return (
                  <tr key={idCult}>
                    <td>
                      <span className="code-pill font-mono">#CUL-{String(idCult).padStart(3, '0')}</span>
                    </td>
                    <td>
                      <strong style={{ color: 'var(--text-primary)' }}>{c.nombre}</strong>
                      {c.variedad && <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>{c.variedad}</div>}
                    </td>
                    <td>
                      <span className="badge badge-info">{c.tipoCultivo || 'Frutal'}</span>
                    </td>
                    <td>
                      <span className="font-mono" style={{ color: '#0284c7' }}>
                        {c.idParcela || (c.parcela?.nombre ? c.parcela.nombre : 'PARC-NOR-001')}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                      {c.fechaSiembra ? new Date(c.fechaSiembra).toLocaleDateString() : 'Activo'}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>
                      {c.temperaturaIdeal ? `${c.temperaturaIdeal}°C` : '22.0°C'}
                    </td>
                    <td>
                      {c.requiereSombra ? (
                        <span className="badge badge-warning">Requiere Sombra</span>
                      ) : (
                        <span className="badge badge-info">Sol Directo</span>
                      )}
                    </td>
                    <td>
                      {c.estado !== false ? (
                        <span className="badge badge-active">En Producción</span>
                      ) : (
                        <span className="badge badge-inactive">Cerrado</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <button
                        className="btn-icon"
                        onClick={() => setCultivoVisualizer(c)}
                        title="Seguimiento Fenológico & Cuaderno de Campo"
                        aria-label="Ciclo Fenológico"
                        style={{ color: 'var(--emerald-vibrant, #10B981)', marginRight: 6 }}
                      >
                        <Sprout size={18} />
                      </button>
                      <button
                        className="btn-icon"
                        onClick={() => setDetalleCultivo(c)}
                        title="Ver ficha técnica completa del cultivo"
                        aria-label="Detalles"
                        style={{ color: '#0284c7' }}
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />

      {/* Modal Técnico de Detalles del Cultivo */}
      {detalleCultivo && (
        <div className="modal-backdrop" onClick={() => setDetalleCultivo(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                  Ficha Agronómica de Ciclo de Cultivo
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                  ID: <span className="font-mono" style={{ color: '#0284c7', fontWeight: 600 }}>#CUL-{String(detalleCultivo.idCultivo || detalleCultivo.id).padStart(3, '0')}</span> • SQL Server cultivos
                </p>
              </div>
              <button className="btn-icon" onClick={() => setDetalleCultivo(null)} aria-label="Cerrar">
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="modal-meta-item">
                  <span className="modal-meta-label">Parcela Asignada</span>
                  <span className="modal-meta-value font-mono" style={{ color: '#0284c7', fontWeight: 700 }}>
                    {detalleCultivo.idParcela || 'PARC-NOR-001'}
                  </span>
                </div>
                <div className="modal-meta-item">
                  <span className="modal-meta-label">Tipo Agronómico</span>
                  <span className="modal-meta-value">{detalleCultivo.tipoCultivo || 'Frutal Perenne'}</span>
                </div>
                <div className="modal-meta-item">
                  <span className="modal-meta-label">Frecuencia de Riego</span>
                  <span className="modal-meta-value font-mono">
                    Cada {detalleCultivo.frecuenciaRiegoDias || 3} días (Goteo)
                  </span>
                </div>
                <div className="modal-meta-item">
                  <span className="modal-meta-label">Temperatura Óptima</span>
                  <span className="modal-meta-value font-mono">
                    {detalleCultivo.temperaturaIdeal || 22.0}°C
                  </span>
                </div>
              </div>

              <div style={{ marginTop: 8 }}>
                <label className="modal-meta-label">Nombre del Cultivo</label>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
                  {detalleCultivo.nombre}
                </div>
                {detalleCultivo.variedad && (
                  <div style={{ color: '#475569', fontSize: '0.95rem', marginBottom: 12 }}>
                    Variedad Certificada: <strong>{detalleCultivo.variedad}</strong>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div className="modal-meta-item">
                    <span className="modal-meta-label">Fecha de Siembra</span>
                    <span className="modal-meta-value font-mono">
                      {detalleCultivo.fechaSiembra ? new Date(detalleCultivo.fechaSiembra).toLocaleDateString() : 'Registrada'}
                    </span>
                  </div>
                  <div className="modal-meta-item">
                    <span className="modal-meta-label">Requerimiento de Sombra</span>
                    <span className="modal-meta-value">
                      {detalleCultivo.requiereSombra ? 'Sí (Malla raschel 35%)' : 'No (Plena exposición solar)'}
                    </span>
                  </div>
                </div>

                <label className="modal-meta-label">Observaciones de Fenología y Manejo</label>
                <div style={{ color: '#334155', background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.9rem' }}>
                  {detalleCultivo.observaciones || 'Cultivo tecnificado bajo estándares fitosanitarios para exportación internacional.'}
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                onClick={() => {
                  setCultivoVisualizer(detalleCultivo);
                  setDetalleCultivo(null);
                }}
              >
                <Sprout size={16} />
                <span>Visualizar Ciclo Fenológico</span>
              </button>
              <button className="btn-secondary" onClick={() => setDetalleCultivo(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Visualizador 3D / Fenológico Dinámico */}
      {cultivoVisualizer && (
        <CropGrowthVisualizer
          cultivoNombre={cultivoVisualizer.nombre}
          variedad={cultivoVisualizer.variedad}
          parcelaId={String(cultivoVisualizer.idParcela || 'PARC-NOR-001')}
          fechaSiembra={cultivoVisualizer.fechaSiembra}
          isModal={true}
          onClose={() => setCultivoVisualizer(null)}
        />
      )}
    </div>
  );
};
