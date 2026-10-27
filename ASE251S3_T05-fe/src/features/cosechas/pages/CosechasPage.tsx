import React, { useState, useEffect, useMemo } from 'react';
import { cosechaService } from '../services/cosechaService';
import { Cosecha } from '../types/cosecha.types';
import { Truck, Search, Eye, X } from 'lucide-react';
import { Pagination } from '../../../components/Pagination';

export const CosechasPage: React.FC = () => {
  const [cosechas, setCosechas] = useState<Cosecha[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [seleccionada, setSeleccionada] = useState<Cosecha | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const data = await cosechaService.listar();
      setCosechas(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const filtradas = useMemo(() => {
    return cosechas.filter(c => {
      const q = busqueda.toLowerCase();
      return (
        c.responsable?.toLowerCase().includes(q) ||
        c.fechaCosecha?.toLowerCase().includes(q) ||
        String(c.idHarvest || c.id || '').includes(q)
      );
    });
  }, [cosechas, busqueda]);

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
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Truck className="icon-title" /> Registro de Cosechas
          </h1>
          <p className="page-subtitle">
            Control de rendimientos, kilos óptimos y cálculo de mermas por lote
          </p>
        </div>
      </div>

      <div className="table-controls">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Buscar por responsable o fecha..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
      </div>

      <div className="table-card">
        {loading ? (
          <div className="loading-state">Cargando cosechas registradas...</div>
        ) : filtradas.length === 0 ? (
          <div className="empty-state">No se encontraron registros de cosecha.</div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Fecha de Cosecha</th>
                  <th>Responsable</th>
                  <th>Lotes / Detalles</th>
                  <th>Estado</th>
                  <th style={{ textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginadas.map((c) => (
                  <tr key={c.idHarvest || c.id || Math.random()}>
                    <td className="font-mono">#{c.idHarvest || c.id}</td>
                    <td>{c.fechaCosecha ? new Date(c.fechaCosecha).toLocaleDateString() : '-'}</td>
                    <td><strong>{c.responsable}</strong></td>
                    <td>{c.detalles?.length || 0} lotes producidos</td>
                    <td>
                      {c.estado !== false ? (
                        <span className="badge badge-active">Registrado</span>
                      ) : (
                        <span className="badge badge-inactive">Baja</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        className="btn-icon"
                        onClick={() => setSeleccionada(c)}
                        title="Ver detalles de rendimiento"
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
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />

      {seleccionada && (
        <div className="modal-overlay" onClick={() => setSeleccionada(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 700 }}>
            <div className="modal-header">
              <h2>Detalles de Rendimiento de Cosecha #{seleccionada.idHarvest || seleccionada.id}</h2>
              <button className="modal-close-btn" onClick={() => setSeleccionada(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-meta-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div><strong>Responsable:</strong> {seleccionada.responsable}</div>
                <div><strong>Fecha:</strong> {seleccionada.fechaCosecha}</div>
              </div>

              <h4>Producción de Lotes y Porcentaje de Merma</h4>
              {seleccionada.detalles && seleccionada.detalles.length > 0 ? (
                <table className="data-table" style={{ marginTop: 10 }}>
                  <thead>
                    <tr>
                      <th>Kilos Óptimos</th>
                      <th>Kilos Merma</th>
                      <th>Total Kilos</th>
                      <th>% Merma</th>
                    </tr>
                  </thead>
                  <tbody>
                    {seleccionada.detalles.map((d, i) => {
                      const total = (d.kilosOptimos || 0) + (d.kilosMerma || 0);
                      const pct = total > 0 ? ((d.kilosMerma / total) * 100).toFixed(1) : '0';
                      return (
                        <tr key={i}>
                          <td>{d.kilosOptimos} kg</td>
                          <td style={{ color: '#ef4444' }}>{d.kilosMerma} kg</td>
                          <td><strong>{total} kg</strong></td>
                          <td>
                            <span className={Number(pct) > 20 ? 'badge badge-inactive' : 'badge badge-active'}>
                              {pct}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <p style={{ color: '#94a3b8', marginTop: 8 }}>Sin lotes detallados.</p>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setSeleccionada(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
