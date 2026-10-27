import React, { useState, useEffect, useMemo } from 'react';
import { MapPin, Plus, Search, X, FileSpreadsheet, FileText, Sprout } from 'lucide-react';
import { Parcela, ParcelaFormData } from '../types/parcela.types';
import { parcelaService } from '../services/parcelaService';
import { ParcelaTable } from '../components/ParcelaTable';
import { ParcelaModal } from '../components/ParcelaModal';
import { Pagination } from '../../../components/Pagination';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { StatusFilter } from '../../../types/common.types';
import { CropGrowthVisualizer } from '../../../components/CropGrowthVisualizer';

export const ParcelasPage: React.FC = () => {
  const [parcelas, setParcelas] = useState<Parcela[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingParcela, setEditingParcela] = useState<Parcela | null>(null);
  const [detalleParcela, setDetalleParcela] = useState<Parcela | null>(null);
  const [parcelaVisualizer, setParcelaVisualizer] = useState<Parcela | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    parcela: Parcela | null;
    action: 'delete' | 'restore';
  }>({ isOpen: false, parcela: null, action: 'delete' });

  const [error, setError] = useState<string | null>(null);

  const loadParcelas = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await parcelaService.listar();
      setParcelas(data);
    } catch (err: any) {
      console.error('Error al listar parcelas:', err);
      setError(err?.message || 'Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadParcelas();
  }, []);

  // Filtered list based on Search & Status
  const filteredParcelas = useMemo(() => {
    return parcelas.filter((item) => {
      // Status filter
      if (statusFilter === 'ACTIVE' && !item.estado) return false;
      if (statusFilter === 'INACTIVE' && item.estado) return false;

      // Search term
      if (searchTerm.trim() !== '') {
        const query = searchTerm.toLowerCase();
        const idMatch = (item.id || item.idParcela || '').toLowerCase().includes(query);
        const nameMatch = item.nombre.toLowerCase().includes(query);
        const locationMatch = (item.ubicacion || '').toLowerCase().includes(query);
        const cropMatch = (item.cultivoActual || '').toLowerCase().includes(query);
        const respMatch = (item.responsable || '').toLowerCase().includes(query);
        return idMatch || nameMatch || locationMatch || cropMatch || respMatch;
      }
      return true;
    });
  }, [parcelas, searchTerm, statusFilter]);

  // Paginated items
  const totalItems = filteredParcelas.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  const paginatedParcelas = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredParcelas.slice(start, start + pageSize);
  }, [filteredParcelas, currentPage, pageSize]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, pageSize]);

  // Handlers
  const handleSave = async (data: ParcelaFormData) => {
    const id = editingParcela?.id || editingParcela?.idParcela;
    if (editingParcela && id) {
      await parcelaService.editar(id, data);
    } else {
      await parcelaService.crear(data);
    }
    await loadParcelas();
  };

  const handleDelete = (parcela: Parcela) => {
    setConfirmDialog({
      isOpen: true,
      parcela,
      action: 'delete',
    });
  };

  const handleRestore = (parcela: Parcela) => {
    setConfirmDialog({
      isOpen: true,
      parcela,
      action: 'restore',
    });
  };

  const handleConfirmAction = async () => {
    const parcela = confirmDialog.parcela;
    if (!parcela) return;
    const id = parcela.id || parcela.idParcela;
    if (!id) return;

    if (confirmDialog.action === 'delete') {
      await parcelaService.eliminar(id);
    } else {
      await parcelaService.restaurar(id);
    }
    await loadParcelas();
  };

  return (
    <div className="content-page">
      <div className="page-header">
        <div className="page-title-group">
          <h1>
            <MapPin size={28} color="var(--emerald-400)" />
            Sectores y Parcelas de Cultivo
            <span className="author-chip">Zonificación de Suelos</span>
          </h1>
          <p className="page-subtitle">
            Control de lotes de terreno, riego por goteo, tipos de suelo y zonificación agronómica
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="export-btn-group">
            <button
              type="button"
              className="btn-export btn-export-excel"
              onClick={() => parcelaService.exportarExcel(filteredParcelas)}
              title="Descargar reporte oficial en formato Excel"
            >
              <FileSpreadsheet size={16} />
              <span>Exportar Excel</span>
            </button>
            <button
              type="button"
              className="btn-export btn-export-pdf"
              onClick={() => parcelaService.exportarPdf(filteredParcelas)}
              title="Descargar reporte oficial en formato PDF"
            >
              <FileText size={16} />
              <span>Exportar PDF</span>
            </button>
          </div>

          <button
            className="btn btn-primary"
            onClick={() => {
              setEditingParcela(null);
              setIsModalOpen(true);
            }}
            id="btn-nueva-parcela"
          >
            <Plus size={18} />
            <span>Nueva Parcela</span>
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          padding: '12px 18px',
          background: '#fee2e2',
          border: '1px solid #f87171',
          borderRadius: 8,
          color: '#991b1b',
          fontWeight: 600,
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span>{error}</span>
          <button
            onClick={loadParcelas}
            style={{
              background: '#991b1b',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              padding: '6px 14px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Buscar por código, nombre, ubicación, cultivo o responsable..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            id="search-parcelas"
          />
        </div>

        <div className="filter-actions">
          <div className="status-tabs">
            <button
              className={`status-tab ${statusFilter === 'ALL' ? 'active' : ''}`}
              onClick={() => setStatusFilter('ALL')}
            >
              Todas ({parcelas.length})
            </button>
            <button
              className={`status-tab ${statusFilter === 'ACTIVE' ? 'active' : ''}`}
              onClick={() => setStatusFilter('ACTIVE')}
            >
              Activas ({parcelas.filter((p) => p.estado).length})
            </button>
            <button
              className={`status-tab ${statusFilter === 'INACTIVE' ? 'active' : ''}`}
              onClick={() => setStatusFilter('INACTIVE')}
            >
              Inactivas ({parcelas.filter((p) => !p.estado).length})
            </button>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <ParcelaTable
        items={paginatedParcelas}
        loading={loading}
        onEdit={(parcela) => {
          setEditingParcela(parcela);
          setIsModalOpen(true);
        }}
        onDelete={handleDelete}
        onRestore={handleRestore}
        onViewDetails={(parcela) => setDetalleParcela(parcela)}
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
      {detalleParcela && (
        <div className="modal-backdrop" onClick={() => setDetalleParcela(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                  Ficha Técnica de Parcela Agrícola
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                  ID: <span className="font-mono" style={{ color: '#0284c7', fontWeight: 600 }}>{detalleParcela.id || detalleParcela.idParcela}</span> • MongoDB Plots Collection
                </p>
              </div>
              <button className="btn-icon" onClick={() => setDetalleParcela(null)} aria-label="Cerrar">
                <X size={18} />
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="modal-meta-item">
                  <span className="modal-meta-label">Superficie Total</span>
                  <span className="modal-meta-value font-mono" style={{ fontSize: '1.2rem', color: '#16a34a' }}>
                    {detalleParcela.areaHectareas} ha
                  </span>
                </div>
                <div className="modal-meta-item">
                  <span className="modal-meta-label">Tipo de Suelo</span>
                  <span className="modal-meta-value">{detalleParcela.tipoSuelo}</span>
                </div>
                <div className="modal-meta-item">
                  <span className="modal-meta-label">Estado de Riego</span>
                  <span className="modal-meta-value">{detalleParcela.estadoRiego}</span>
                </div>
                <div className="modal-meta-item">
                  <span className="modal-meta-label">Responsable Técnico</span>
                  <span className="modal-meta-value">{detalleParcela.responsable || 'Ana Félix'}</span>
                </div>
              </div>

              <div style={{ marginTop: 8 }}>
                <label className="modal-meta-label">Nombre del Lote / Sector</label>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
                  {detalleParcela.nombre}
                </div>

                <label className="modal-meta-label">Ubicación Catastral</label>
                <div style={{ color: '#475569', marginBottom: 12 }}>
                  {detalleParcela.ubicacion || 'Fundo Central AgroPacayales S.A.C.'}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div className="modal-meta-item">
                    <span className="modal-meta-label">Cultivo Sembrado</span>
                    <span className="modal-meta-value" style={{ fontWeight: 600 }}>{detalleParcela.cultivoActual || 'En descanso / Barbecho'}</span>
                  </div>
                  <div className="modal-meta-item">
                    <span className="modal-meta-label">Producción Estimada</span>
                    <span className="modal-meta-value font-mono">{detalleParcela.produccionEstimada || 'N/A'}</span>
                  </div>
                </div>

                <label className="modal-meta-label">Observaciones y Estado Fitotécnico</label>
                <div style={{ color: '#334155', background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.9rem' }}>
                  {detalleParcela.observaciones || 'Lote monitoreado mediante fichas técnicas de campo e inspecciones agronómicas.'}
                </div>
              </div>
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {detalleParcela.cultivoActual && (
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  onClick={() => {
                    setParcelaVisualizer(detalleParcela);
                    setDetalleParcela(null);
                  }}
                >
                  <Sprout size={16} />
                  <span>Ver Ciclo Fenológico del Cultivo</span>
                </button>
              )}
              <button className="btn-secondary" onClick={() => setDetalleParcela(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Visualizador 3D para la Parcela */}
      {parcelaVisualizer && (
        <CropGrowthVisualizer
          cultivoNombre={parcelaVisualizer.cultivoActual || 'Palta Hass'}
          variedad={parcelaVisualizer.cultivoActual ? `${parcelaVisualizer.cultivoActual} Comercial` : 'Variedad Certificada'}
          parcelaId={parcelaVisualizer.id || parcelaVisualizer.idParcela || 'PARC-001'}
          fechaSiembra={parcelaVisualizer.fechaUltimaSiembra}
          isModal={true}
          onClose={() => setParcelaVisualizer(null)}
        />
      )}

      {/* Create / Edit Modal */}
      <ParcelaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        initialData={editingParcela}
      />

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={handleConfirmAction}
        title={confirmDialog.action === 'delete' ? 'Desactivar Parcela' : 'Restaurar Parcela'}
        message={
          confirmDialog.action === 'delete'
            ? `¿Deseas dar de baja lógica la parcela "${confirmDialog.parcela?.nombre}"? Quedará inactiva para nuevas siembras.`
            : `¿Deseas reactivar la parcela "${confirmDialog.parcela?.nombre}" en el registro agrícola?`
        }
        confirmText={confirmDialog.action === 'delete' ? 'Sí, Desactivar' : 'Sí, Reactivar'}
        isDanger={confirmDialog.action === 'delete'}
      />
    </div>
  );
};
