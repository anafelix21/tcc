import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/Modal';
import { Usuario, UsuarioFormData } from '../types/usuario.types';

interface UsuarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: UsuarioFormData) => Promise<void>;
  initialData?: Usuario | null;
}

const INITIAL_FORM: UsuarioFormData = {
  nombre: '',
  apellido: '',
  correo: '',
  password: 'Password123!',
  rol: 'OPERARIO',
  fechaNacimiento: '1995-01-01',
  fechaContratacion: '2023-01-01',
};

export const UsuarioModal: React.FC<UsuarioModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [formData, setFormData] = useState<UsuarioFormData>(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        nombre: initialData.nombre || '',
        apellido: initialData.apellido || '',
        correo: initialData.correo || '',
        password: initialData.password || 'Password123!',
        rol: initialData.rol || 'OPERARIO',
        fechaNacimiento: initialData.fechaNacimiento || '1995-01-01',
        fechaContratacion: initialData.fechaContratacion || '2023-01-01',
      });
    } else {
      setFormData(INITIAL_FORM);
    }
    setError(null);
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre.trim() || !formData.apellido.trim()) {
      setError('Nombre y apellido son obligatorios');
      return;
    }
    if (!formData.correo.trim() || !formData.correo.includes('@')) {
      setError('Ingrese un correo electrónico válido');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onSave(formData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar el usuario');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Editar Usuario / Personal' : 'Nuevo Usuario / Personal'}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={saving}
            id="btn-save-usuario"
          >
            {saving ? 'Guardando...' : initialData ? 'Actualizar' : 'Crear Usuario'}
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

        <div className="form-row" style={{ marginBottom: 14 }}>
          <div className="form-group">
            <label className="form-label">Nombres *</label>
            <input
              type="text"
              className="form-control"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="Ej: Carlos"
              required
              id="input-usuario-nombre"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Apellidos *</label>
            <input
              type="text"
              className="form-control"
              value={formData.apellido}
              onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
              placeholder="Ej: Mendoza Ramos"
              required
              id="input-usuario-apellido"
            />
          </div>
        </div>

        <div className="form-row" style={{ marginBottom: 14 }}>
          <div className="form-group">
            <label className="form-label">Correo Institucional *</label>
            <input
              type="email"
              className="form-control"
              value={formData.correo}
              onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
              placeholder="carlos.mendoza@agropacayales.com"
              required
              id="input-usuario-correo"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Rol Asignado *</label>
            <select
              className="form-control"
              value={formData.rol}
              onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
              id="select-usuario-rol"
            >
              <option value="ADMIN">ADMIN</option>
              <option value="SUPERVISOR">SUPERVISOR</option>
              <option value="OPERARIO">OPERARIO</option>
              <option value="TECNICO">TECNICO</option>
              <option value="AGRONOMO">AGRONOMO</option>
            </select>
          </div>
        </div>

        {!initialData && (
          <div className="form-group" style={{ marginBottom: 14 }}>
            <label className="form-label">Contraseña de Acceso</label>
            <input
              type="password"
              className="form-control"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Mínimo 6 caracteres"
              id="input-usuario-password"
            />
          </div>
        )}

        <div className="form-row" style={{ marginBottom: 14 }}>
          <div className="form-group">
            <label className="form-label">Fecha de Nacimiento</label>
            <input
              type="date"
              className="form-control"
              value={formData.fechaNacimiento}
              onChange={(e) =>
                setFormData({ ...formData, fechaNacimiento: e.target.value })
              }
              id="input-usuario-nacimiento"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Fecha de Contratación</label>
            <input
              type="date"
              className="form-control"
              value={formData.fechaContratacion}
              onChange={(e) =>
                setFormData({ ...formData, fechaContratacion: e.target.value })
              }
              id="input-usuario-contratacion"
            />
          </div>
        </div>
      </form>
    </Modal>
  );
};
