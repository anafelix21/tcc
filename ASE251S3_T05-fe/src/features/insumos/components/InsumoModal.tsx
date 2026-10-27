import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/Modal';
import { Insumo, InsumoFormData } from '../types/insumo.types';

interface InsumoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: InsumoFormData) => Promise<void>;
  initialData?: Insumo | null;
}

const INITIAL_FORM: InsumoFormData = {
  nombre: '',
  descripcion: '',
  precio: 0,
  stock: 0,
  unidadMedida: 'kg',
  tipoInsumo: 'FERTILIZANTE',
  proveedor: '',
  presentacion: '',
};

export const InsumoModal: React.FC<InsumoModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [formData, setFormData] = useState<InsumoFormData>(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        nombre: initialData.nombre || '',
        descripcion: initialData.descripcion || '',
        precio: initialData.precio || 0,
        stock: initialData.stock || 0,
        unidadMedida: initialData.unidadMedida || 'kg',
        tipoInsumo: initialData.tipoInsumo || 'FERTILIZANTE',
        proveedor: initialData.proveedor || '',
        presentacion: initialData.presentacion || '',
      });
    } else {
      setFormData(INITIAL_FORM);
    }
    setError(null);
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre.trim()) {
      setError('El nombre del insumo es obligatorio');
      return;
    }
    if (formData.precio <= 0) {
      setError('El precio debe ser mayor a 0');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onSave(formData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar el insumo');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Editar Insumo Agrícola' : 'Nuevo Insumo Agrícola'}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={saving}
            id="btn-save-insumo"
          >
            {saving ? 'Guardando...' : initialData ? 'Actualizar' : 'Crear Insumo'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        {error && (
          <div
            style={{
              padding: '8px 12px',
              borderRadius: 6,
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              color: '#fca5a5',
              fontSize: '0.85rem',
              marginBottom: 14,
            }}
          >
            {error}
          </div>
        )}

        <div className="form-group" style={{ marginBottom: 14 }}>
          <label className="form-label">Nombre del Insumo *</label>
          <input
            type="text"
            className="form-control"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            placeholder="Ej: Urea Granulada 46% N"
            required
            id="input-insumo-nombre"
          />
        </div>

        <div className="form-row" style={{ marginBottom: 14 }}>
          <div className="form-group">
            <label className="form-label">Tipo de Insumo *</label>
            <select
              className="form-control"
              value={formData.tipoInsumo}
              onChange={(e) => setFormData({ ...formData, tipoInsumo: e.target.value })}
              id="select-insumo-tipo"
            >
              <option value="FERTILIZANTE">FERTILIZANTE</option>
              <option value="PESTICIDA">PESTICIDA</option>
              <option value="HERBICIDA">HERBICIDA</option>
              <option value="FUNGICIDA">FUNGICIDA</option>
              <option value="SEMILLA">SEMILLA</option>
              <option value="OTRO">OTRO</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Unidad de Medida *</label>
            <select
              className="form-control"
              value={formData.unidadMedida}
              onChange={(e) => setFormData({ ...formData, unidadMedida: e.target.value })}
              id="select-insumo-unidad"
            >
              <option value="kg">kg (Kilogramo)</option>
              <option value="g">g (Gramo)</option>
              <option value="L">L (Litro)</option>
              <option value="ml">ml (Mililitro)</option>
              <option value="unidad">unidad</option>
              <option value="bolsa">bolsa</option>
              <option value="saco">saco</option>
              <option value="bidon">bidon</option>
              <option value="tonelada">tonelada</option>
            </select>
          </div>
        </div>

        <div className="form-row" style={{ marginBottom: 14 }}>
          <div className="form-group">
            <label className="form-label">Precio Unitario (S/.) *</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              className="form-control"
              value={formData.precio}
              onChange={(e) =>
                setFormData({ ...formData, precio: parseFloat(e.target.value) || 0 })
              }
              required
              id="input-insumo-precio"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Stock Disponible *</label>
            <input
              type="number"
              min="0"
              className="form-control"
              value={formData.stock}
              onChange={(e) =>
                setFormData({ ...formData, stock: parseInt(e.target.value, 10) || 0 })
              }
              required
              id="input-insumo-stock"
            />
          </div>
        </div>

        <div className="form-row" style={{ marginBottom: 14 }}>
          <div className="form-group">
            <label className="form-label">Proveedor</label>
            <input
              type="text"
              className="form-control"
              value={formData.proveedor}
              onChange={(e) => setFormData({ ...formData, proveedor: e.target.value })}
              placeholder="Ej: Fertisur S.A.C."
              id="input-insumo-proveedor"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Presentación</label>
            <input
              type="text"
              className="form-control"
              value={formData.presentacion}
              onChange={(e) => setFormData({ ...formData, presentacion: e.target.value })}
              placeholder="Ej: Saco 50kg"
              id="input-insumo-presentacion"
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Descripción Técnica</label>
          <textarea
            className="form-control"
            rows={2}
            value={formData.descripcion}
            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
            placeholder="Detalles sobre uso, concentración, lote..."
            id="input-insumo-descripcion"
          />
        </div>
      </form>
    </Modal>
  );
};
