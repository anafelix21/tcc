import React, { useState, useEffect, useMemo } from 'react';
import { Users, Plus, Search, X, FileSpreadsheet, FileText } from 'lucide-react';
import { Usuario, UsuarioFormData } from '../types/usuario.types';
import { usuarioService } from '../services/usuarioService';
import { UsuarioTable } from '../components/UsuarioTable';
import { UsuarioModal } from '../components/UsuarioModal';
import { Pagination } from '../../../components/Pagination';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { StatusFilter } from '../../../types/common.types';

export const UsuariosPage: React.FC = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null);
  const [detalleUsuario, setDetalleUsuario] = useState<Usuario | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    usuario: Usuario | null;
    action: 'delete' | 'restore';
  }>({ isOpen: false, usuario: null, action: 'delete' });

  const loadUsuarios = async () => {
    setLoading(true);
    try {
      const data = await usuarioService.listar();
      setUsuarios(data);
    } catch (err) {
      console.error('Error al listar usuarios:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsuarios();
  }, []);

  // Filtered list based on Search & Status
  const filteredUsuarios = useMemo(() => {
    return usuarios.filter((item) => {
      // Status filter
      if (statusFilter === 'ACTIVE' && !item.estado) return false;
      if (statusFilter === 'INACTIVE' && item.estado) return false;

      // Search term
      if (searchTerm.trim() !== '') {
        const query = searchTerm.toLowerCase();
        const idMatch = (item.id || item.idUsuario || '').toLowerCase().includes(query);
        const nameMatch = `${item.nombre} ${item.apellido}`.toLowerCase().includes(query);
        const mailMatch = (item.correo || '').toLowerCase().includes(query);
        const roleMatch = (item.rol || '').toLowerCase().includes(query);
        return idMatch || nameMatch || mailMatch || roleMatch;
      }
      return true;
    });
  }, [usuarios, searchTerm, statusFilter]);

  // Paginated items
  const totalItems = filteredUsuarios.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  const paginatedUsuarios = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUsuarios.slice(start, start + pageSize);
  }, [filteredUsuarios, currentPage, pageSize]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, pageSize]);

  // Handlers
  const handleSave = async (data: UsuarioFormData) => {
    const id = editingUsuario?.id || editingUsuario?.idUsuario;
    if (editingUsuario && id) {
      await usuarioService.editar(id, data);
    } else {
      await usuarioService.crear(data);
    }
    await loadUsuarios();
  };

  const handleDelete = (usuario: Usuario) => {
    setConfirmDialog({
      isOpen: true,
      usuario,
      action: 'delete',
    });
  };

  const handleRestore = (usuario: Usuario) => {
    setConfirmDialog({
      isOpen: true,
      usuario,
      action: 'restore',
    });
  };

  const handleConfirmAction = async () => {
    const usuario = confirmDialog.usuario;
    if (!usuario) return;
    const id = usuario.id || usuario.idUsuario;
    if (!id) return;

    if (confirmDialog.action === 'delete') {
      await usuarioService.eliminar(id);
    } else {
      await usuarioService.restaurar(id);
    }
    await loadUsuarios();
  };

  return (
    <div className="content-page">
      <div className="page-header">
        <div className="page-title-group">
          <h1>
            <Users size={28} color="var(--emerald-400)" />
            Gestión de Personal & Roles
            <span className="author-chip">Recursos Humanos</span>
          </h1>
          <p className="page-subtitle">
            Administración de cuentas institucionales, credenciales y asignación de roles de campo
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="export-btn-group">
            <button
              type="button"
              className="btn-export btn-export-excel"
              onClick={() => usuarioService.exportarExcel(filteredUsuarios)}
              title="Descargar nómina en formato Excel"
            >
              <FileSpreadsheet size={16} />
              <span>Exportar Excel</span>
            </button>
            <button
              type="button"
              className="btn-export btn-export-pdf"
              onClick={() => usuarioService.exportarPdf(filteredUsuarios)}
              title="Descargar nómina en formato PDF"
            >
              <FileText size={16} />
              <span>Exportar PDF</span>
            </button>
          </div>

          <button
            className="btn btn-primary"
            onClick={() => {
              setEditingUsuario(null);
              setIsModalOpen(true);
            }}
            id="btn-nuevo-usuario"
          >
            <Plus size={18} />
            <span>Nuevo Usuario</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Buscar por código, nombre, apellido, correo o rol..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            id="search-usuarios"
          />
        </div>

        <div className="filter-actions">
          <div className="status-tabs">
            <button
              className={`status-tab ${statusFilter === 'ALL' ? 'active' : ''}`}
              onClick={() => setStatusFilter('ALL')}
            >
              Todos ({usuarios.length})
            </button>
            <button
              className={`status-tab ${statusFilter === 'ACTIVE' ? 'active' : ''}`}
              onClick={() => setStatusFilter('ACTIVE')}
            >
              Activos ({usuarios.filter((u) => u.estado).length})
            </button>
            <button
              className={`status-tab ${statusFilter === 'INACTIVE' ? 'active' : ''}`}
              onClick={() => setStatusFilter('INACTIVE')}
            >
              Inactivos ({usuarios.filter((u) => !u.estado).length})
            </button>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <UsuarioTable
        items={paginatedUsuarios}
        loading={loading}
        onEdit={(usuario) => {
          setEditingUsuario(usuario);
          setIsModalOpen(true);
        }}
        onDelete={handleDelete}
        onRestore={handleRestore}
        onViewDetails={(usuario) => setDetalleUsuario(usuario)}
      />

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />

      {/* Technical Detail Modal */}
      {detalleUsuario && (
        <div className="modal-backdrop" onClick={() => setDetalleUsuario(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                  Ficha Técnica de Personal / Operario
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                  ID: <span className="font-mono" style={{ color: '#0284c7', fontWeight: 600 }}>{detalleUsuario.id || detalleUsuario.idUsuario}</span> • MongoDB Users Collection
                </p>
              </div>
              <button className="btn-icon" onClick={() => setDetalleUsuario(null)} aria-label="Cerrar">
                <X size={18} />
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="modal-meta-item">
                  <span className="modal-meta-label">Rol Asignado</span>
                  <span className="modal-meta-value" style={{ fontWeight: 700, color: '#16a34a' }}>
                    {detalleUsuario.rol}
                  </span>
                </div>
                <div className="modal-meta-item">
                  <span className="modal-meta-label">Estado de Cuenta</span>
                  <span className="modal-meta-value">
                    {detalleUsuario.estado ? 'Activo (Acceso Habilitado)' : 'Inactivo (Suspendido)'}
                  </span>
                </div>
                <div className="modal-meta-item">
                  <span className="modal-meta-label">Fecha de Ingreso / Contrato</span>
                  <span className="modal-meta-value font-mono">{detalleUsuario.fechaContratacion || 'Indefinida'}</span>
                </div>
                <div className="modal-meta-item">
                  <span className="modal-meta-label">Fecha de Nacimiento</span>
                  <span className="modal-meta-value font-mono">{detalleUsuario.fechaNacimiento || 'No registrada'}</span>
                </div>
              </div>

              <div style={{ marginTop: 8 }}>
                <label className="modal-meta-label">Nombres y Apellidos Completos</label>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
                  {detalleUsuario.nombre} {detalleUsuario.apellido}
                </div>

                <label className="modal-meta-label">Correo Corporativo / Usuario de Acceso</label>
                <div style={{ color: '#0284c7', fontFamily: 'var(--font-mono)', fontWeight: 600, marginBottom: 12 }}>
                  {detalleUsuario.correo}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div className="modal-meta-item">
                    <span className="modal-meta-label">Teléfono / Celular de Contacto</span>
                    <span className="modal-meta-value font-mono">{detalleUsuario.telefono || '+51 987 654 321'}</span>
                  </div>
                  <div className="modal-meta-item">
                    <span className="modal-meta-label">Cuadrilla / Módulo Asignado</span>
                    <span className="modal-meta-value">Cuadrilla Operativa AgroPacayales</span>
                  </div>
                </div>

                <label className="modal-meta-label">Permisos y Alcance de Sistema</label>
                <div style={{ color: '#334155', background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.9rem' }}>
                  {detalleUsuario.rol === 'ADMIN'
                    ? 'Acceso total de administración, creación de usuarios, gestión de inventarios y visualización de indicadores financieros.'
                    : detalleUsuario.rol === 'SUPERVISOR'
                    ? 'Supervisión de labores de campo, registro de partes diarios y control de asistencia de cuadrillas.'
                    : detalleUsuario.rol === 'AGRONOMO'
                    ? 'Prescripción fitosanitaria, monitoreo de fenología de cultivos y control de plagas.'
                    : 'Registro de labores culturales asignadas y reportes de campo.'}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setDetalleUsuario(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      <UsuarioModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        initialData={editingUsuario}
      />

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={handleConfirmAction}
        title={confirmDialog.action === 'delete' ? 'Desactivar Cuenta' : 'Restaurar Cuenta'}
        message={
          confirmDialog.action === 'delete'
            ? `¿Deseas revocar el acceso y desactivar al usuario "${confirmDialog.usuario?.nombre} ${confirmDialog.usuario?.apellido}"?`
            : `¿Deseas restaurar el acceso al usuario "${confirmDialog.usuario?.nombre} ${confirmDialog.usuario?.apellido}"?`
        }
        confirmText={confirmDialog.action === 'delete' ? 'Sí, Desactivar' : 'Sí, Restaurar'}
        isDanger={confirmDialog.action === 'delete'}
      />
    </div>
  );
};
