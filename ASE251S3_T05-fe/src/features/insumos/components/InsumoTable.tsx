import React from 'react';
import { Edit2, Trash2, RotateCcw, AlertCircle, Eye } from 'lucide-react';
import { Insumo } from '../types/insumo.types';

interface InsumoTableProps {
  items: Insumo[];
  onEdit: (insumo: Insumo) => void;
  onDelete: (insumo: Insumo) => void;
  onRestore: (insumo: Insumo) => void;
  onViewDetails?: (insumo: Insumo) => void;
  loading: boolean;
}

export const InsumoTable: React.FC<InsumoTableProps> = ({
  items,
  onEdit,
  onDelete,
  onRestore,
  onViewDetails,
  loading,
}) => {
  if (loading) {
    return (
      <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-dim)' }}>
        <div className="status-dot" style={{ margin: '0 auto 12px', width: 12, height: 12 }}></div>
        Cargando insumos agrícolas desde MongoDB...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-dim)' }}>
        <AlertCircle size={36} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
        <p>No se encontraron insumos con los filtros seleccionados.</p>
      </div>
    );
  }

  const getTipoBadgeClass = (tipo: string) => {
    switch (tipo) {
      case 'FERTILIZANTE':
        return 'badge-success';
      case 'PESTICIDA':
      case 'HERBICIDA':
        return 'badge-warning';
      case 'FUNGICIDA':
        return 'badge-danger';
      case 'SEMILLA':
        return 'badge-info';
      default:
        return 'badge-info';
    }
  };

  return (
    <div className="table-container">
      <table className="data-table" id="tabla-insumos">
        <thead>
          <tr>
            <th>Código / ID</th>
            <th>Nombre & Presentación</th>
            <th>Tipo</th>
            <th>Precio Unit.</th>
            <th>Stock Actual</th>
            <th>Proveedor</th>
            <th>Estado</th>
            <th style={{ textAlign: 'center' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const itemId = item.id || item.idInsumo || 'INS-GEN';
            return (
              <tr key={itemId}>
                <td>
                  <span className="code-pill font-mono">{itemId}</span>
                </td>
                <td>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {item.nombre}
                  </div>
                  {item.presentacion && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                      {item.presentacion}
                    </div>
                  )}
                </td>
                <td>
                  <span className={`badge ${getTipoBadgeClass(item.tipoInsumo)}`}>
                    {item.tipoInsumo}
                  </span>
                </td>
                <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                  S/. {Number(item.precio).toFixed(2)}
                </td>
                <td>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 600,
                      color: item.stock < 30 ? 'var(--accent-rose)' : 'var(--emerald-600)',
                    }}
                  >
                    {item.stock} {item.unidadMedida}
                  </span>
                </td>
                <td style={{ color: 'var(--text-secondary)' }}>
                  {item.proveedor || 'AgroPacayales Central'}
                </td>
                <td>
                  {item.estado ? (
                    <span className="badge badge-active">Activo</span>
                  ) : (
                    <span className="badge badge-inactive">Inactivo</span>
                  )}
                </td>
                <td style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                    {onViewDetails && (
                      <button
                        className="btn-icon"
                        onClick={() => onViewDetails(item)}
                        title="Ver detalles completos del insumo"
                        aria-label="Detalles"
                        style={{ color: '#0284c7' }}
                      >
                        <Eye size={17} />
                      </button>
                    )}
                    <button
                      className="btn-icon"
                      onClick={() => onEdit(item)}
                      title="Editar insumo"
                      aria-label="Editar"
                    >
                      <Edit2 size={16} color="var(--primary)" />
                    </button>
                    {item.estado ? (
                      <button
                        className="btn-icon"
                        onClick={() => onDelete(item)}
                        title="Desactivar insumo"
                        aria-label="Eliminar"
                      >
                        <Trash2 size={16} color="var(--accent-rose)" />
                      </button>
                    ) : (
                      <button
                        className="btn-icon"
                        onClick={() => onRestore(item)}
                        title="Restaurar insumo"
                        aria-label="Restaurar"
                      >
                        <RotateCcw size={16} color="var(--accent-cyan)" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
