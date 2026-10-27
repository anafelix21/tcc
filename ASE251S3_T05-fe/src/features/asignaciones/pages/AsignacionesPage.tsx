import React, { useState, useEffect, useMemo } from 'react';
import { asignacionService, AsignacionCabecera } from '../services/asignacionService';
import { UserCheck, Search, Eye, Users, Clock, DollarSign, X } from 'lucide-react';
import { Pagination } from '../../../components/Pagination';

export const AsignacionesPage: React.FC = () => {
  const [asignaciones, setAsignaciones] = useState<AsignacionCabecera[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [detalleAsignacion, setDetalleAsignacion] = useState<AsignacionCabecera | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await asignacionService.listar();
      setAsignaciones(data);
    } catch (err) {
      console.error('Error al listar asignaciones:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtradas = useMemo(() => {
    return asignaciones.filter((a) => {
      if (busqueda.trim() !== '') {
        const query = busqueda.toLowerCase();
        const idMatch = String(a.idAsignacion || a.id).includes(query);
        const supMatch = (a.supervisorResponsable || '').toLowerCase().includes(query);
        const laborMatch = (a.tipoActividad || '').toLowerCase().includes(query);
        const obsMatch = (a.observacion || '').toLowerCase().includes(query);
        return idMatch || supMatch || laborMatch || obsMatch;
      }
      return true;
    });
  }, [asignaciones, busqueda]);

  const totalItems = filtradas.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  const paginadas = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtradas.slice(start, start + pageSize);
  }, [filtradas, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [busqueda, pageSize]);

  return (
    <div className="content-page">
      <div className="page-header">
        <div className="page-title-group">
          <h1>
            <UserCheck size={28} color="var(--emerald-400)" />
            Asignación de Personal y Cuadrillas
            <span className="author-chip">Axel Huapaya #10</span>
          </h1>
          <p className="page-subtitle">
            Transaccional de cuadrillas de campo, horas laboradas y costos de mano de obra
          </p>
        </div>
      </div>

      <div className="table-controls">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Buscar por supervisor, labor de campo o ID de asignación..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-dim)' }}>
          <div className="status-dot" style={{ margin: '0 auto 12px', width: 12, height: 12 }}></div>
          Cargando asignaciones de personal desde SQL Server R2DBC...
        </div>
      ) : filtradas.length === 0 ? (
        <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-dim)', background: '#fff', borderRadius: 8 }}>
          No se encontraron asignaciones de personal registradas.
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table" id="tabla-asignaciones">
            <thead>
              <tr>
                <th>Código / ID</th>
                <th>Fecha Asignación</th>
                <th>Labor de Campo</th>
                <th>Supervisor a Cargo</th>
                <th>Jornal (Horas)</th>
                <th>Costo Mano de Obra</th>
                <th>Tamaño Cuadrilla</th>
                <th>Estado</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginadas.map((a) => {
                const idAsig = a.idAsignacion || a.id || 0;
                return (
                  <tr key={idAsig}>
                    <td>
                      <span className="code-pill font-mono">#ASIG-{String(idAsig).padStart(3, '0')}</span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                      {a.fechaAsignacion}
                    </td>
                    <td>
                      <strong style={{ color: 'var(--text-primary)' }}>
                        {a.tipoActividad || `Actividad #${a.idActividad}`}
                      </strong>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {a.supervisorResponsable || 'Supervisor General'}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>
                      {a.horasTrabajadas} hrs
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                      S/. {Number(a.costoTotalManoObra || 0).toFixed(2)}
                    </td>
                    <td>
                      <span className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <Users size={13} /> {a.detalles?.length || 2} operarios
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-active">Ejecutado</span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        className="btn-icon"
                        onClick={() => setDetalleAsignacion(a)}
                        title="Ver detalles completos de la cuadrilla y operarios"
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

      {/* Modal Técnico de Detalles de la Asignación */}
      {detalleAsignacion && (
        <div className="modal-backdrop" onClick={() => setDetalleAsignacion(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 700 }}>
            <div className="modal-header">
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                  Detalle de Asignación de Cuadrilla
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                  ID: <span className="font-mono" style={{ color: '#0284c7', fontWeight: 600 }}>#ASIG-{String(detalleAsignacion.idAsignacion || detalleAsignacion.id).padStart(3, '0')}</span> • SQL Server asignacion_cabecera
                </p>
              </div>
              <button className="btn-icon" onClick={() => setDetalleAsignacion(null)} aria-label="Cerrar">
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="modal-meta-item">
                  <span className="modal-meta-label">Labor de Campo</span>
                  <span className="modal-meta-value" style={{ fontWeight: 700, color: '#16a34a' }}>
                    {detalleAsignacion.tipoActividad || `Actividad #${detalleAsignacion.idActividad}`}
                  </span>
                </div>
                <div className="modal-meta-item">
                  <span className="modal-meta-label">Costo Total Mano de Obra</span>
                  <span className="modal-meta-value font-mono" style={{ fontSize: '1.2rem', color: '#0f172a' }}>
                    S/. {Number(detalleAsignacion.costoTotalManoObra || 0).toFixed(2)}
                  </span>
                </div>
                <div className="modal-meta-item">
                  <span className="modal-meta-label">Supervisor a Cargo</span>
                  <span className="modal-meta-value">{detalleAsignacion.supervisorResponsable}</span>
                </div>
                <div className="modal-meta-item">
                  <span className="modal-meta-label">Jornal Laborado</span>
                  <span className="modal-meta-value font-mono">{detalleAsignacion.horasTrabajadas} Horas</span>
                </div>
              </div>

              <div>
                <label className="modal-meta-label">Observaciones y Directivas de Cuadrilla</label>
                <div style={{ color: '#334155', background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.9rem', marginBottom: 16 }}>
                  {detalleAsignacion.observacion || 'Personal instruido en protocolos de seguridad y rendimientos de trabajo en campo.'}
                </div>
              </div>

              {/* Personal Asignado en Detalle */}
              <div>
                <label className="modal-meta-label" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <Users size={16} color="#16a34a" />
                  Operarios Asignados (SQL asignacion_detalle + MongoDB users)
                </label>
                {detalleAsignacion.detalles && detalleAsignacion.detalles.length > 0 ? (
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                    <table style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
                      <thead style={{ background: '#f1f5f9', color: '#475569', textAlign: 'left' }}>
                        <tr>
                          <th style={{ padding: '8px 12px' }}>Código Usuario</th>
                          <th style={{ padding: '8px 12px' }}>Operario</th>
                          <th style={{ padding: '8px 12px' }}>Rol en Cuadrilla</th>
                          <th style={{ padding: '8px 12px', textAlign: 'right' }}>Costo/Hora</th>
                          <th style={{ padding: '8px 12px', textAlign: 'right' }}>Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detalleAsignacion.detalles.map((det, idx) => (
                          <tr key={det.idDetalle || idx} style={{ borderTop: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '8px 12px', fontFamily: 'monospace', color: '#0284c7' }}>{det.idUsuario}</td>
                            <td style={{ padding: '8px 12px', fontWeight: 600 }}>{det.nombreOperario || 'Operario Calificado'}</td>
                            <td style={{ padding: '8px 12px' }}><span className="badge badge-info">{det.rolEnCuadrilla}</span></td>
                            <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'monospace' }}>S/. {Number(det.costoHora).toFixed(2)}</td>
                            <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>S/. {Number(det.subtotal).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ fontSize: '0.85rem', color: '#64748b', fontStyle: 'italic', padding: 8 }}>
                    Sin personal individualizado en este registro.
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setDetalleAsignacion(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
