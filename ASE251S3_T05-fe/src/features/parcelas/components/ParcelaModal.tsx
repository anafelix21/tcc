import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/Modal';
import { Parcela, ParcelaFormData } from '../types/parcela.types';

interface ParcelaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ParcelaFormData) => Promise<void>;
  initialData?: Parcela | null;
}

const INITIAL_FORM: ParcelaFormData = {
  nombre: '',
  ubicacion: '',
  areaHectareas: 1.0,
  tipoSuelo: 'Franco',
  responsable: 'Ing. Supervisor Agrícola',
  estadoRiego: 'Completo',
  cultivoActual: '',
  produccionEstimada: '',
  observaciones: '',
};

export const ParcelaModal: React.FC<ParcelaModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [formData, setFormData] = useState<ParcelaFormData>(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        nombre: initialData.nombre || '',
        ubicacion: initialData.ubicacion || '',
        areaHectareas: initialData.areaHectareas || 1.0,
        tipoSuelo: initialData.tipoSuelo || 'Franco',
        responsable: initialData.responsable || 'Ing. Supervisor Agrícola',
        estadoRiego: initialData.estadoRiego || 'Completo',
        cultivoActual: initialData.cultivoActual || '',
        produccionEstimada: initialData.produccionEstimada || '',
        observaciones: initialData.observaciones || '',
      });
    } else {
      setFormData(INITIAL_FORM);
    }
    setError(null);
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre.trim()) {
      setError('El nombre de la parcela es obligatorio');
      return;
    }
    if (formData.areaHectareas <= 0) {
      setError('El área en hectáreas debe ser mayor a 0');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onSave(formData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar la parcela');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Editar Parcela de Cultivo' : 'Nueva Parcela de Cultivo'}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={saving}
            id="btn-save-parcela"
          >
            {saving ? 'Guardando...' : initialData ? 'Actualizar' : 'Crear Parcela'}
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
          <label className="form-label">Nombre de la Parcela *</label>
          <input
            type="text"
            className="form-control"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            placeholder="Ej: Parcela Norte A - Sector 1"
            required
            id="input-parcela-nombre"
          />
        </div>

        <div className="form-row" style={{ marginBottom: 14 }}>
          <div className="form-group">
            <label className="form-label">Superficie (Hectáreas) *</label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              className="form-control"
              value={formData.areaHectareas}
              onChange={(e) =>
                setFormData({ ...formData, areaHectareas: parseFloat(e.target.value) || 0 })
              }
              required
              id="input-parcela-area"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Tipo de Suelo *</label>
            <select
              className="form-control"
              value={formData.tipoSuelo}
              onChange={(e) => setFormData({ ...formData, tipoSuelo: e.target.value })}
              id="select-parcela-suelo"
            >
              <option value="Franco">Franco</option>
              <option value="Franco Arenoso">Franco Arenoso</option>
              <option value="Arenoso">Arenoso</option>
              <option value="Franco Limoso">Franco Limoso</option>
              <option value="Arcilloso">Arcilloso</option>
            </select>
          </div>
        </div>

        <div className="form-row" style={{ marginBottom: 14 }}>
          <div className="form-group">
            <label className="form-label">Estado de Riego *</label>
            <select
              className="form-control"
              value={formData.estadoRiego}
              onChange={(e) => setFormData({ ...formData, estadoRiego: e.target.value })}
              id="select-parcela-riego"
            >
              <option value="Completo">Completo (Goteo/Aspersión)</option>
              <option value="En Proceso">En Proceso</option>
              <option value="Pendiente">Pendiente</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Responsable Técnico</label>
            <input
              type="text"
              className="form-control"
              value={formData.responsable}
              onChange={(e) => setFormData({ ...formData, responsable: e.target.value })}
              placeholder="Ej: Ing. Supervisor de Lote"
              id="input-parcela-responsable"
            />
          </div>
        </div>

        <div className="form-row" style={{ marginBottom: 14 }}>
          <div className="form-group">
            <label className="form-label">Cultivo Actual</label>
            <input
              type="text"
              className="form-control"
              value={formData.cultivoActual}
              onChange={(e) => setFormData({ ...formData, cultivoActual: e.target.value })}
              placeholder="Ej: Palto Hass"
              id="input-parcela-cultivo"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Producción Estimada</label>
            <input
              type="text"
              className="form-control"
              value={formData.produccionEstimada}
              onChange={(e) =>
                setFormData({ ...formData, produccionEstimada: e.target.value })
              }
              placeholder="Ej: 25 Toneladas"
              id="input-parcela-produccion"
            />
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: 14 }}>
          <label className="form-label">Ubicación Geográfica / Sector</label>
          <input
            type="text"
            className="form-control"
            value={formData.ubicacion}
            onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
            placeholder="Ej: Sector Norte Km 14, Valle Cañete"
            id="input-parcela-ubicacion"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Observaciones Agronómicas</label>
          <textarea
            className="form-control"
            rows={2}
            value={formData.observaciones}
            onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
            placeholder="Detalles sobre historial de plagas, drenaje o análisis de suelo..."
            id="input-parcela-observaciones"
          />
        </div>
      </form>
    </Modal>
  );
};
