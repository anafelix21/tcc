import React from 'react';
import { Edit2, Trash2, RotateCcw, AlertCircle, Eye } from 'lucide-react';
import { Usuario } from '../types/usuario.types';

interface UsuarioTableProps {
  items: Usuario[];
  onEdit: (usuario: Usuario) => void;
  onDelete: (usuario: Usuario) => void;
  onRestore: (usuario: Usuario) => void;
  onViewDetails?: (usuario: Usuario) => void;
  loading: boolean;
}

export const UsuarioTable: React.FC<UsuarioTableProps> = ({
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
        Cargando personal y usuarios desde MongoDB...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-dim)' }}>
        <AlertCircle size={36} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
        <p>No se encontraron usuarios con los criterios de búsqueda.</p>
      </div>
    );
  }

  const getRolBadge = (rol: string) => {
    switch (rol) {
      case 'ADMIN':
        return <span className="badge badge-danger">ADMIN</span>;
      case 'SUPERVISOR':
        return <span className="badge badge-warning">SUPERVISOR</span>;
      case 'AGRONOMO':
        return <span className="badge badge-success">AGRÓNOMO</span>;
      case 'TECNICO':
        return <span className="badge badge-info">TÉCNICO</span>;
      default:
        return <span className="badge badge-info">OPERARIO</span>;
    }
  };

  return (
    <div className="table-container">
      <table className="data-table" id="tabla-usuarios">
        <thead>
          <tr>
            <th>Código / ID</th>
            <th>Nombres y Apellidos</th>
            <th>Correo Electrónico</th>
            <th>Rol</th>
            <th>Contratación</th>
            <th>Estado</th>
            <th style={{ textAlign: 'right' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const itemId = item.id || item.idUsuario || 'USR-GEN';
            return (
              <tr key={itemId}>
                <td>
                  <span className="code-pill">{itemId}</span>
                </td>
                <td>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {item.nombre} {item.apellido}
                  </div>
                </td>
                <td style={{ color: 'var(--text-secondary)' }}>{item.correo}</td>
                <td>{getRolBadge(item.rol)}</td>
                <td style={{ color: 'var(--text-dim)' }}>
                  {item.fechaContratacion || 'Indefinida'}
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
                        title="Ver ficha técnica del usuario"
                        aria-label="Detalles"
                        style={{ color: '#0284c7' }}
                      >
                        <Eye size={16} />
                      </button>
                    )}
                    <button
                      className="btn-icon"
                      onClick={() => onEdit(item)}
                      title="Editar usuario"
                      aria-label="Editar"
                    >
                      <Edit2 size={16} color="var(--emerald-400)" />
                    </button>
                    {item.estado ? (
                      <button
                        className="btn-icon"
                        onClick={() => onDelete(item)}
                        title="Desactivar usuario"
                        aria-label="Eliminar"
                      >
                        <Trash2 size={16} color="var(--accent-rose)" />
                      </button>
                    ) : (
                      <button
                        className="btn-icon"
                        onClick={() => onRestore(item)}
                        title="Restaurar usuario"
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
