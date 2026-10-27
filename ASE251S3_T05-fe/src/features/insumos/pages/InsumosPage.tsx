import React, { useState, useEffect, useMemo } from 'react';
import { Package, Plus, Search, X, FileSpreadsheet, FileText } from 'lucide-react';
import { Insumo, InsumoFormData } from '../types/insumo.types';
import { insumoService } from '../services/insumoService';
import { InsumoTable } from '../components/InsumoTable';
import { InsumoModal } from '../components/InsumoModal';
import { Pagination } from '../../../components/Pagination';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { StatusFilter } from '../../../types/common.types';

export const InsumosPage: React.FC = () => {
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInsumo, setEditingInsumo] = useState<Insumo | null>(null);
  const [detalleInsumo, setDetalleInsumo] = useState<Insumo | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    insumo: Insumo | null;
    action: 'delete' | 'restore';
  }>({ isOpen: false, insumo: null, action: 'delete' });

  const loadInsumos = async () => {
    setLoading(true);
    try {
      const data = await insumoService.listar();
      setInsumos(data);
    } catch (err) {
      console.error('Error al listar insumos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInsumos();
  }, []);

  // Filtered list based on Search & Status
  const filteredInsumos = useMemo(() => {
    return insumos.filter((item) => {
      // Status filter
      if (statusFilter === 'ACTIVE' && !item.estado) return false;
      if (statusFilter === 'INACTIVE' && item.estado) return false;

      // Search term
      if (searchTerm.trim() !== '') {
        const query = searchTerm.toLowerCase();
        const idMatch = (item.id || item.idInsumo || '').toLowerCase().includes(query);
        const nameMatch = item.nombre.toLowerCase().includes(query);
        const providerMatch = (item.proveedor || '').toLowerCase().includes(query);
        const typeMatch = (item.tipoInsumo || '').toLowerCase().includes(query);
        return idMatch || nameMatch || providerMatch || typeMatch;
      }
      return true;
    });
  }, [insumos, searchTerm, statusFilter]);

  // Paginated items
  const totalItems = filteredInsumos.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  const paginatedInsumos = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredInsumos.slice(start, start + pageSize);
  }, [filteredInsumos, currentPage, pageSize]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, pageSize]);

  // Handlers
  const handleSave = async (data: InsumoFormData) => {
    const id = editingInsumo?.id || editingInsumo?.idInsumo;
    if (editingInsumo && id) {
      await insumoService.editar(id, data);
    } else {
      await insumoService.crear(data);
    }
    await loadInsumos();
  };

  const handleDelete = (insumo: Insumo) => {
    setConfirmDialog({
      isOpen: true,
      insumo,
      action: 'delete',
    });
  };

  const handleRestore = (insumo: Insumo) => {
    setConfirmDialog({
      isOpen: true,
      insumo,
      action: 'restore',
    });
  };

  const handleConfirmAction = async () => {
    const insumo = confirmDialog.insumo;
    if (!insumo) return;
    const id = insumo.id || insumo.idInsumo;
    if (!id) return;

    if (confirmDialog.action === 'delete') {
      await insumoService.eliminar(id);
    } else {
      await insumoService.restaurar(id);
    }
    await loadInsumos();
  };

  return (
    <div className="content-page">
      <div className="page-header">
        <div className="page-title-group">
          <h1>
            <Package size={28} color="var(--emerald-400)" />
            Almacén y Catálogo de Insumos
            <span className="author-chip">Catálogo GlobalG.A.P.</span>
          </h1>
          <p className="page-subtitle">
            Catálogo y stock de fertilizantes, semillas y pesticidas con persistencia políglota
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="export-btn-group">
            <button
              type="button"
              className="btn-export btn-export-excel"
              onClick={() => insumoService.exportarExcel(filteredInsumos)}
              title="Descargar catálogo en formato Excel"
            >
              <FileSpreadsheet size={16} />
              <span>Exportar Excel</span>
            </button>
            <button
              type="button"
              className="btn-export btn-export-pdf"
              onClick={() => insumoService.exportarPdf(filteredInsumos)}
              title="Descargar catálogo en formato PDF"
            >
              <FileText size={16} />
              <span>Exportar PDF</span>
            </button>
          </div>

          <button
            className="btn btn-primary"
            onClick={() => {
              setEditingInsumo(null);
              setIsModalOpen(true);
            }}
            id="btn-nuevo-insumo"
          >
            <Plus size={18} />
            <span>Nuevo Insumo</span>
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
            placeholder="Buscar por código, nombre, proveedor o categoría..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            id="search-insumos"
          />
        </div>

        <div className="filter-actions">
          <div className="status-tabs">
            <button
              className={`status-tab ${statusFilter === 'ALL' ? 'active' : ''}`}
              onClick={() => setStatusFilter('ALL')}
            >
              Todos ({insumos.length})
            </button>
            <button
              className={`status-tab ${statusFilter === 'ACTIVE' ? 'active' : ''}`}
              onClick={() => setStatusFilter('ACTIVE')}
            >
              Activos ({insumos.filter((i) => i.estado).length})
            </button>
            <button
              className={`status-tab ${statusFilter === 'INACTIVE' ? 'active' : ''}`}
              onClick={() => setStatusFilter('INACTIVE')}
            >
              Inactivos ({insumos.filter((i) => !i.estado).length})
            </button>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <InsumoTable
        items={paginatedInsumos}
        loading={loading}
        onViewDetails={setDetalleInsumo}
        onEdit={(insumo) => {
          setEditingInsumo(insumo);
          setIsModalOpen(true);
        }}
        onDelete={handleDelete}
        onRestore={handleRestore}
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

      {/* Detail Inspection Modal (Ojito) */}
      {detalleInsumo && (
        <div className="modal-overlay" onClick={() => setDetalleInsumo(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 650 }}>
            <div className="modal-header">
              <h2>Detalles Técnicos del Insumo</h2>
              <button className="btn-icon" onClick={() => setDetalleInsumo(null)} aria-label="Cerrar">
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-meta-grid">
                <div className="modal-meta-item">
                  <span className="modal-meta-label">Código del Insumo</span>
                  <span className="modal-meta-value font-mono">{detalleInsumo.id || detalleInsumo.idInsumo}</span>
                </div>
                <div className="modal-meta-item">
                  <span className="modal-meta-label">Categoría Agrícola</span>
                  <span className="modal-meta-value">{detalleInsumo.tipoInsumo}</span>
                </div>
                <div className="modal-meta-item">
                  <span className="modal-meta-label">Stock Disponible</span>
                  <span className="modal-meta-value">{detalleInsumo.stock} {detalleInsumo.unidadMedida}</span>
                </div>
                <div className="modal-meta-item">
                  <span className="modal-meta-label">Precio Unitario</span>
                  <span className="modal-meta-value">S/. {Number(detalleInsumo.precio).toFixed(2)}</span>
                </div>
                <div className="modal-meta-item">
                  <span className="modal-meta-label">Valorización de Inventario</span>
                  <span className="modal-meta-value" style={{ color: '#059669' }}>
                    S/. {(Number(detalleInsumo.precio) * detalleInsumo.stock).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="modal-meta-item">
                  <span className="modal-meta-label">Proveedor Oficial</span>
                  <span className="modal-meta-value">{detalleInsumo.proveedor || 'AgroPacayales S.A.C.'}</span>
                </div>
              </div>

              <div style={{ marginTop: 14 }}>
                <label className="modal-meta-label">Nombre Completo</label>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
                  {detalleInsumo.nombre}
                </div>

                <label className="modal-meta-label">Presentación y Embalaje</label>
                <div style={{ color: '#475569', marginBottom: 12 }}>
                  {detalleInsumo.presentacion || 'Empaque industrial certificado'}
                </div>

                <label className="modal-meta-label">Descripción Agronómica</label>
                <div style={{ color: '#334155', background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.9rem' }}>
                  {detalleInsumo.descripcion || 'Insumo agrícola certificado para exportación según directrices GlobalG.A.P. y SENASA.'}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setDetalleInsumo(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      <InsumoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        initialData={editingInsumo}
      />

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={handleConfirmAction}
        title={confirmDialog.action === 'delete' ? 'Desactivar Insumo' : 'Restaurar Insumo'}
        message={
          confirmDialog.action === 'delete'
            ? `¿Deseas dar de baja lógica el insumo "${confirmDialog.insumo?.nombre}"? El registro se conservará como inactivo.`
            : `¿Deseas reactivar el insumo "${confirmDialog.insumo?.nombre}" para su uso en campo?`
        }
        confirmText={confirmDialog.action === 'delete' ? 'Sí, Desactivar' : 'Sí, Reactivar'}
        isDanger={confirmDialog.action === 'delete'}
      />
    </div>
  );
};
