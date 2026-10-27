import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/authContext';
import { Lock, Mail, ArrowRight, ShieldCheck, CheckCircle2, Award, Globe, Leaf } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [correo, setCorreo] = useState('hugo@agro.com');
  const [password, setPassword] = useState('Password123!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleQuickSelect = (email: string, pass: string) => {
    setCorreo(email);
    setPassword(pass);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(correo, password);
      navigate('/inicio');
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      {/* Columna Izquierda: Identidad Corporativa y Fotografía Agrícola de Exportación */}
      <div className="login-hero-side">
        <div className="login-hero-overlay" />
        <div className="login-hero-content">
          <div className="corp-badge">
            <Leaf size={16} />
            <span>AgroPacayales S.A.C. • Cañete / Ica, Perú</span>
          </div>

          <h1 className="hero-heading">
            Gestión Agrícola Inteligente y Analítica de Precisión
          </h1>

          <p className="hero-subheading">
            Plataforma corporativa de monitoreo agroindustrial, trazabilidad de cultivos de exportación y control de presupuestos en alta disponibilidad.
          </p>

          <div className="hero-features-grid">
            <div className="feature-pill">
              <CheckCircle2 size={16} color="#4ade80" />
              <span>Certificación GlobalG.A.P.</span>
            </div>
            <div className="feature-pill">
              <Award size={16} color="#4ade80" />
              <span>SENASA Export Ready</span>
            </div>
            <div className="feature-pill">
              <Globe size={16} color="#4ade80" />
              <span>Kubernetes K3s Multi-Nodo</span>
            </div>
          </div>
        </div>
      </div>

      {/* Columna Derecha: Formulario Ejecutivo de Autenticación */}
      <div className="login-form-side">
        <div className="login-card-container">
          <div className="login-brand-header">
            <div className="login-logo-circle">
              <Leaf size={28} color="#059669" />
            </div>
            <h2 className="login-title">Acceso Institucional</h2>
            <p className="login-subtitle">Ingrese sus credenciales de empleado de AgroPacayales S.A.C.</p>
          </div>

          {error && (
            <div className="login-alert-danger">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group-field">
              <label htmlFor="login-correo">Correo Corporativo</label>
              <div className="input-with-icon">
                <Mail size={18} className="field-icon" />
                <input
                  type="email"
                  id="login-correo"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  placeholder="ejemplo@agro.com"
                  required
                />
              </div>
            </div>

            <div className="form-group-field">
              <label htmlFor="login-password">Contraseña del Sistema</label>
              <div className="input-with-icon">
                <Lock size={18} className="field-icon" />
                <input
                  type="password"
                  id="login-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-login-submit"
              id="btn-login"
            >
              {loading ? (
                <span>Validando sesión...</span>
              ) : (
                <>
                  <span>Ingresar al Sistema</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Accesos Rápidos de Demostración */}
          <div className="quick-roles-section">
            <span className="quick-roles-title">Credenciales de Evaluación:</span>
            <div className="quick-roles-chips">
              <button
                type="button"
                className="role-chip"
                onClick={() => handleQuickSelect('hugo@agro.com', 'Password123!')}
              >
                <strong>Hugo Fernández</strong>
                <small>ADMIN (#07)</small>
              </button>
              <button
                type="button"
                className="role-chip"
                onClick={() => handleQuickSelect('ana@agro.com', 'Password123!')}
              >
                <strong>Ana Félix</strong>
                <small>SUPERVISOR (#05)</small>
              </button>
              <button
                type="button"
                className="role-chip"
                onClick={() => handleQuickSelect('axel@agro.com', 'Password123!')}
              >
                <strong>Axel Huapaya</strong>
                <small>INGENIERO (#10)</small>
              </button>
            </div>
          </div>

          <div className="login-security-footer">
            <ShieldCheck size={16} color="#059669" />
            <span>Conexión segura cifrada con token JWT y R2DBC / MongoDB</span>
          </div>
        </div>
      </div>
    </div>
  );
};
