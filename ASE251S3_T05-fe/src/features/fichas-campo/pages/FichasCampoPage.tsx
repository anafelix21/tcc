import React, { useState, useEffect, useMemo } from 'react';
import { fichaCampoService, FichaCampo } from '../services/fichaCampoService';
import { ClipboardList, Search, Eye, Thermometer, Droplets, CloudSun, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { Pagination } from '../../../components/Pagination';

export const FichasCampoPage: React.FC = () => {
  const [fichas, setFichas] = useState<FichaCampo[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [etapaFiltro, setEtapaFiltro] = useState<string>('TODAS');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [detalleFicha, setDetalleFicha] = useState<FichaCampo | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fichaCampoService.listar();
      setFichas(data);
    } catch (err) {
      console.error('Error al listar fichas de campo:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtradas = useMemo(() => {
    return fichas.filter((f) => {
      if (etapaFiltro !== 'TODAS' && f.etapaFenologica !== etapaFiltro) {
        return false;
      }
      if (busqueda.trim() !== '') {
        const query = busqueda.toLowerCase();
        const idMatch = (f.codigoFicha || f.id || '').toLowerCase().includes(query);
        const respMatch = (f.responsableTecnico || '').toLowerCase().includes(query);
        const cultMatch = (f.nombreCultivo || '').toLowerCase().includes(query);
        const diagMatch = (f.diagnostico || '').toLowerCase().includes(query);
        return idMatch || respMatch || cultMatch || diagMatch;
      }
      return true;
    });
  }, [fichas, busqueda, etapaFiltro]);

  const totalItems = filtradas.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  const paginadas = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtradas.slice(start, start + pageSize);
  }, [filtradas, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [busqueda, etapaFiltro, pageSize]);

  return (
    <div className="content-page">
      <div className="page-header">
        <div className="page-title-group">
          <h1>
            <ClipboardList size={28} color="var(--emerald-400)" />
            Fichas Técnicas de Campo y Fenología
            <span className="author-chip">AgroPacayales S.A.C.</span>
          </h1>
          <p className="page-subtitle">
            Diario agronómico, seguimiento de etapas fenológicas, clima y condiciones de cultivo
          </p>
        </div>
      </div>

      <div className="table-controls">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Buscar por código de ficha, agrónomo responsable o cultivo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <div className="estado-tabs">
            {['TODAS', 'Brotación', 'Floración', 'Cuajado', 'Desarrollo de Fruto', 'Maduración'].map((et) => (
              <button
                key={et}
                className={`tab-btn ${etapaFiltro === et ? 'active' : ''}`}
                onClick={() => setEtapaFiltro(et)}
              >
                {et === 'TODAS' ? 'Todas las Etapas' : et}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-dim)' }}>
          <div className="status-dot" style={{ margin: '0 auto 12px', width: 12, height: 12 }}></div>
          Cargando fichas de campo desde MongoDB field_records...
        </div>
      ) : filtradas.length === 0 ? (
        <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-dim)', background: '#fff', borderRadius: 8 }}>
          No se encontraron fichas de campo registradas con los criterios actuales.
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table" id="tabla-fichas-campo">
            <thead>
              <tr>
                <th>Código Ficha</th>
                <th>Fecha</th>
                <th>Cultivo Evaluado</th>
                <th>Etapa Fenológica</th>
                <th>Responsable Técnico</th>
                <th>Condición Clima</th>
                <th>Acción Requerida</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginadas.map((f) => (
                <tr key={f.id || f.codigoFicha || Math.random()}>
                  <td>
                    <span className="code-pill font-mono" style={{ color: '#0284c7' }}>
                      {f.codigoFicha || f.id}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                    {f.fechaRegistro || '2024-06-15'}
                  </td>
                  <td>
                    <strong style={{ color: 'var(--text-primary)' }}>
                      {f.nombreCultivo || `Cultivo #${f.idCultivo}`}
                    </strong>
                  </td>
                  <td>
                    <span className="badge badge-info">{f.etapaFenologica || 'Monitoreo'}</span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>
                    {f.responsableTecnico}
                  </td>
                  <td>
                    <span style={{ fontSize: '0.85rem', color: '#475569' }}>
                      {f.condicionClima || 'Soleado'} ({f.temperaturaAmb || 22}°C)
                    </span>
                  </td>
                  <td>
                    {f.necesitaFumigacion ? (
                      <span className="badge badge-danger">Fumigación</span>
                    ) : f.necesitaRiego ? (
                      <span className="badge badge-warning">Riego</span>
                    ) : (
                      <span className="badge badge-success">Conforme</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      className="btn-icon"
                      onClick={() => setDetalleFicha(f)}
                      title="Ver ficha técnica agronómica completa"
                      aria-label="Detalles"
                      style={{ color: '#0284c7' }}
                    >
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))}
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

      {/* Modal Técnico de Detalles de Ficha de Campo */}
      {detalleFicha && (
        <div className="modal-backdrop" onClick={() => setDetalleFicha(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 660 }}>
            <div className="modal-header">
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                  Ficha Técnica Agronómica de Campo
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                  Código: <span className="font-mono" style={{ color: '#0284c7', fontWeight: 600 }}>{detalleFicha.codigoFicha || detalleFicha.id}</span> • MongoDB field_records
                </p>
              </div>
              <button className="btn-icon" onClick={() => setDetalleFicha(null)} aria-label="Cerrar">
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="modal-meta-item">
                  <span className="modal-meta-label">Cultivo Evaluado</span>
                  <span className="modal-meta-value" style={{ fontWeight: 700, color: '#16a34a' }}>
                    {detalleFicha.nombreCultivo || `Cultivo #${detalleFicha.idCultivo}`}
                  </span>
                </div>
                <div className="modal-meta-item">
                  <span className="modal-meta-label">Etapa Fenológica</span>
                  <span className="modal-meta-value">{detalleFicha.etapaFenologica}</span>
                </div>
                <div className="modal-meta-item">
                  <span className="modal-meta-label">Condiciones Climáticas</span>
                  <span className="modal-meta-value font-mono">
                    {detalleFicha.temperaturaAmb || 22}°C • {detalleFicha.humedadRelativa || 70}% HR
                  </span>
                </div>
                <div className="modal-meta-item">
                  <span className="modal-meta-label">Responsable Técnico</span>
                  <span className="modal-meta-value">{detalleFicha.responsableTecnico}</span>
                </div>
              </div>

              <div style={{ marginTop: 8 }}>
                <label className="modal-meta-label">Diagnóstico Agronómico del Inspector</label>
                <div style={{ color: '#0f172a', background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.9rem', marginBottom: 12 }}>
                  {detalleFicha.diagnostico || 'Evaluación agronómica rutinaria de campo sin anomalías patógenas detectadas.'}
                </div>

                <label className="modal-meta-label">Acción Ejecutada en Campo</label>
                <div style={{ color: '#334155', background: '#f1f5f9', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.9rem', marginBottom: 12 }}>
                  {detalleFicha.accionTomada || 'Muestreo aleatorio foliar y regulación de microaspersores.'}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="modal-meta-item">
                    <span className="modal-meta-label">Riego Requerido</span>
                    <span className="modal-meta-value">{detalleFicha.necesitaRiego ? 'Sí, programado' : 'No requerido'}</span>
                  </div>
                  <div className="modal-meta-item">
                    <span className="modal-meta-label">Fumigación Fitosanitaria</span>
                    <span className="modal-meta-value">{detalleFicha.necesitaFumigacion ? 'Sí, prioritaria' : 'No requerida'}</span>
                  </div>
                </div>

                <label className="modal-meta-label" style={{ marginTop: 12 }}>Observaciones Adicionales</label>
                <div style={{ color: '#475569', fontSize: '0.85rem' }}>
                  {detalleFicha.observaciones || 'Lote conforme a protocolos de buenas prácticas agrícolas GlobalG.A.P.'}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setDetalleFicha(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
