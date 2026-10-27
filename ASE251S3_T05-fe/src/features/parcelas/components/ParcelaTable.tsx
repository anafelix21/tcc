import React from 'react';
import { Edit2, Trash2, RotateCcw, AlertCircle, Eye } from 'lucide-react';
import { Parcela } from '../types/parcela.types';

interface ParcelaTableProps {
  items: Parcela[];
  onEdit: (parcela: Parcela) => void;
  onDelete: (parcela: Parcela) => void;
  onRestore: (parcela: Parcela) => void;
  onViewDetails?: (parcela: Parcela) => void;
  loading: boolean;
}

export const ParcelaTable: React.FC<ParcelaTableProps> = ({
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
        Cargando parcelas de cultivo desde MongoDB...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-dim)' }}>
        <AlertCircle size={36} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
        <p>No se encontraron parcelas con los criterios seleccionados.</p>
      </div>
    );
  }

  const getRiegoBadge = (estado: string) => {
    switch (estado) {
      case 'Completo':
        return <span className="badge badge-success">Riego Completo</span>;
      case 'En Proceso':
        return <span className="badge badge-warning">En Proceso</span>;
      default:
        return <span className="badge badge-danger">Pendiente</span>;
    }
  };

  return (
    <div className="table-container">
      <table className="data-table" id="tabla-parcelas">
        <thead>
          <tr>
            <th>Código / ID</th>
            <th>Nombre & Ubicación</th>
            <th>Superficie</th>
            <th>Tipo Suelo</th>
            <th>Cultivo Actual</th>
            <th>Riego</th>
            <th>Responsable</th>
            <th>Estado</th>
            <th style={{ textAlign: 'right' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const itemId = item.id || item.idParcela || 'PARC-GEN';
            return (
              <tr key={itemId}>
                <td>
                  <span className="code-pill">{itemId}</span>
                </td>
                <td>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {item.nombre}
                  </div>
                  {item.ubicacion && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                      {item.ubicacion}
                    </div>
                  )}
                </td>
                <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                  {item.areaHectareas} ha
                </td>
                <td>
                  <span className="badge badge-info">{item.tipoSuelo}</span>
                </td>
                <td>
                  {item.cultivoActual ? (
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
                      {item.cultivoActual}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>
                      En barbecho
                    </span>
                  )}
                </td>
                <td>{getRiegoBadge(item.estadoRiego)}</td>
                <td style={{ color: 'var(--text-secondary)' }}>
                  {item.responsable || 'Sin asignar'}
                </td>
                <td>
                  {item.estado ? (
                    <span className="badge badge-success">Activo</span>
                  ) : (
                    <span className="badge badge-danger">Inactivo</span>
                  )}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                    {onViewDetails && (
                      <button
                        className="btn-icon"
                        onClick={() => onViewDetails(item)}
                        title="Ver detalles completos de la parcela"
                        aria-label="Detalles"
                        style={{ color: '#0284c7' }}
                      >
                        <Eye size={16} />
                      </button>
                    )}
                    <button
                      className="btn-icon"
                      onClick={() => onEdit(item)}
                      title="Editar parcela"
                      aria-label="Editar"
                    >
                      <Edit2 size={16} color="var(--emerald-400)" />
                    </button>
                    {item.estado ? (
                      <button
                        className="btn-icon"
                        onClick={() => onDelete(item)}
                        title="Desactivar parcela"
                        aria-label="Eliminar"
                      >
                        <Trash2 size={16} color="var(--accent-rose)" />
                      </button>
                    ) : (
                      <button
                        className="btn-icon"
                        onClick={() => onRestore(item)}
                        title="Restaurar parcela"
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
