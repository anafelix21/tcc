import React, { useState, useEffect, useMemo } from 'react';
import { actividadService, ActividadCultivo } from '../services/actividadService';
import { Wrench, Search, Eye, AlertTriangle, CheckCircle2, Clock, PackageCheck, X } from 'lucide-react';
import { Pagination } from '../../../components/Pagination';

export const ActividadesPage: React.FC = () => {
  const [actividades, setActividades] = useState<ActividadCultivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState<string>('TODAS');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [detalleActividad, setDetalleActividad] = useState<ActividadCultivo | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await actividadService.listar();
      setActividades(data);
    } catch (err) {
      console.error('Error al listar labores de campo:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtradas = useMemo(() => {
    return actividades.filter((a) => {
      if (tipoFiltro !== 'TODAS' && a.tipoActividad !== tipoFiltro) {
        return false;
      }
      if (busqueda.trim() !== '') {
        const query = busqueda.toLowerCase();
        const idMatch = String(a.idActividad || a.id).includes(query);
        const tipoMatch = a.tipoActividad.toLowerCase().includes(query);
        const cultMatch = (a.nombreCultivo || '').toLowerCase().includes(query);
        const descMatch = (a.descripcion || '').toLowerCase().includes(query);
        return idMatch || tipoMatch || cultMatch || descMatch;
      }
      return true;
    });
  }, [actividades, busqueda, tipoFiltro]);

  const totalItems = filtradas.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  const paginadas = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtradas.slice(start, start + pageSize);
  }, [filtradas, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [busqueda, tipoFiltro, pageSize]);

  return (
    <div className="content-page">
      <div className="page-header">
        <div className="page-title-group">
          <h1>
            <Wrench size={28} color="var(--emerald-400)" />
            Labores de Campo y Mantenimiento Agrícola
            <span className="author-chip">Hugo Fernández #07</span>
          </h1>
          <p className="page-subtitle">
            Transaccional de actividades agrícolas con consumo detallado de insumos e integración IoT
          </p>
        </div>
      </div>

      <div className="table-controls">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Buscar por tipo de labor, cultivo o descripción técnica..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <div className="estado-tabs">
            {['TODAS', 'Fertirriego Nutricional', 'Control Fitosanitario', 'Poda y Deschuponado', 'Monitoreo Técnico y Foliar'].map((t) => (
              <button
                key={t}
                className={`tab-btn ${tipoFiltro === t ? 'active' : ''}`}
                onClick={() => setTipoFiltro(t)}
              >
                {t === 'TODAS' ? 'Todas las Labores' : t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-dim)' }}>
          <div className="status-dot" style={{ margin: '0 auto 12px', width: 12, height: 12 }}></div>
          Cargando labores de campo desde SQL Server R2DBC...
        </div>
      ) : filtradas.length === 0 ? (
        <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-dim)', background: '#fff', borderRadius: 8 }}>
          No se encontraron labores de campo registradas con los filtros seleccionados.
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table" id="tabla-labores-campo">
            <thead>
              <tr>
                <th>Código / ID</th>
                <th>Tipo de Labor</th>
                <th>Cultivo Asociado</th>
                <th>Fecha Programada</th>
                <th>Costo Total</th>
                <th>Alerta IoT</th>
                <th>Estado</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginadas.map((item) => {
                const idAct = item.idActividad || item.id || 0;
                return (
                  <tr key={idAct}>
                    <td>
                      <span className="code-pill font-mono">#ACT-{String(idAct).padStart(3, '0')}</span>
                    </td>
                    <td>
                      <strong style={{ color: 'var(--text-primary)' }}>{item.tipoActividad}</strong>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                        {item.descripcion ? item.descripcion.substring(0, 45) + '...' : 'Mantenimiento agronómico'}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                        {item.nombreCultivo || `Cultivo #${item.idCultivo}`}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                      {item.fechaProgramada || (item.fechaActividad ? item.fechaActividad.split('T')[0] : 'Hoy')}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                      S/. {Number(item.costoTotal || 0).toFixed(2)}
                    </td>
                    <td>
                      {item.alertaFitosanitariaIot || item.alertaFitosanitaria ? (
                        <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <AlertTriangle size={13} /> Alerta IoT
                        </span>
                      ) : (
                        <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <CheckCircle2 size={13} /> Normal
                        </span>
                      )}
                    </td>
                    <td>
                      {item.completado ? (
                        <span className="badge badge-active">Completada</span>
                      ) : (
                        <span className="badge badge-warning">En Proceso</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        className="btn-icon"
                        onClick={() => setDetalleActividad(item)}
                        title="Ver detalles completos e insumos de la labor"
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

      {/* Modal Técnico de Detalles de la Labor */}
      {detalleActividad && (
        <div className="modal-backdrop" onClick={() => setDetalleActividad(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 700 }}>
            <div className="modal-header">
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                  Ficha Técnica de Labor de Campo
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                  Código: <span className="font-mono" style={{ color: '#0284c7', fontWeight: 600 }}>#ACT-{String(detalleActividad.idActividad || detalleActividad.id).padStart(3, '0')}</span> • SQL Server actividad_cultivo
                </p>
              </div>
              <button className="btn-icon" onClick={() => setDetalleActividad(null)} aria-label="Cerrar">
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="modal-meta-item">
                  <span className="modal-meta-label">Tipo de Labor Cultural</span>
                  <span className="modal-meta-value" style={{ fontWeight: 700, color: '#16a34a' }}>
                    {detalleActividad.tipoActividad}
                  </span>
                </div>
                <div className="modal-meta-item">
                  <span className="modal-meta-label">Costo Total Acumulado</span>
                  <span className="modal-meta-value font-mono" style={{ fontSize: '1.2rem', color: '#0f172a' }}>
                    S/. {Number(detalleActividad.costoTotal || 0).toFixed(2)}
                  </span>
                </div>
                <div className="modal-meta-item">
                  <span className="modal-meta-label">Cultivo Asignado</span>
                  <span className="modal-meta-value">
                    {detalleActividad.nombreCultivo || `Cultivo #${detalleActividad.idCultivo}`}
                  </span>
                </div>
                <div className="modal-meta-item">
                  <span className="modal-meta-label">Estado de Ejecución</span>
                  <span className="modal-meta-value">
                    {detalleActividad.completado ? 'Completada y Validada' : 'En Ejecución / Programada'}
                  </span>
                </div>
              </div>

              <div>
                <label className="modal-meta-label">Descripción Agronómica</label>
                <div style={{ color: '#334155', background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.9rem', marginBottom: 16 }}>
                  {detalleActividad.descripcion || 'Labor cultural aplicada conforme a estándares fitosanitarios de AgroPacayales S.A.C.'}
                </div>
              </div>

              {/* Insumos Consumidos en esta Labor (Detalle Cabecera-Detalle) */}
              <div>
                <label className="modal-meta-label" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <PackageCheck size={16} color="#16a34a" />
                  Insumos Agrícolas Consumidos en esta Labor (SQL detalle_actividad + MongoDB supplies)
                </label>
                {detalleActividad.detalles && detalleActividad.detalles.length > 0 ? (
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                    <table style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
                      <thead style={{ background: '#f1f5f9', color: '#475569', textAlign: 'left' }}>
                        <tr>
                          <th style={{ padding: '8px 12px' }}>Código Insumo</th>
                          <th style={{ padding: '8px 12px' }}>Nombre Insumo</th>
                          <th style={{ padding: '8px 12px', textAlign: 'right' }}>Cantidad</th>
                          <th style={{ padding: '8px 12px', textAlign: 'right' }}>P. Unit.</th>
                          <th style={{ padding: '8px 12px', textAlign: 'right' }}>Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detalleActividad.detalles.map((det, idx) => (
                          <tr key={det.idDetalle || idx} style={{ borderTop: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '8px 12px', fontFamily: 'monospace', color: '#0284c7' }}>{det.idInsumo}</td>
                            <td style={{ padding: '8px 12px', fontWeight: 600 }}>{det.nombreInsumo || 'Insumo Calibrado'}</td>
                            <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'monospace' }}>{det.cantidad}</td>
                            <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'monospace' }}>S/. {Number(det.precioUnitario).toFixed(2)}</td>
                            <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>S/. {Number(det.subtotal).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ fontSize: '0.85rem', color: '#64748b', fontStyle: 'italic', padding: 8 }}>
                    Esta labor no requirió aplicación directa de insumos químicos o biológicos.
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setDetalleActividad(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
