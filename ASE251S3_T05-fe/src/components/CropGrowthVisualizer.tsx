import React, { useState, useEffect, useMemo } from 'react';
import {
  Sprout,
  Sun,
  Droplets,
  Sparkles,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  X,
  TrendingUp,
  MapPin,
  FileText,
  Info,
  BookOpen,
  UserCheck,
  ShieldCheck,
  Clock,
  ClipboardList,
  Leaf,
  Layers
} from 'lucide-react';
import { fichaCampoService, FichaCampo } from '../features/fichas-campo/services/fichaCampoService';

export interface CropGrowthVisualizerProps {
  cultivoNombre?: string;
  variedad?: string;
  fechaSiembra?: string;
  parcelaId?: string;
  initialStage?: number; // 1, 2, 3, 4
  onClose?: () => void;
  isModal?: boolean;
  hideTopHeader?: boolean;
}

export const CropGrowthVisualizer: React.FC<CropGrowthVisualizerProps> = ({
  cultivoNombre = 'Cultivo de Campo',
  variedad = '',
  fechaSiembra = '',
  parcelaId = '',
  initialStage = 3,
  onClose,
  isModal = false,
  hideTopHeader = false,
}) => {
  const [stageProgress, setStageProgress] = useState<number>(() => {
    if (initialStage === 1) return 10;
    if (initialStage === 2) return 30;
    if (initialStage === 3) return 60;
    return 90;
  });

  const [mode, setMode] = useState<'REAL' | 'MANUAL'>('REAL');
  const [fichas, setFichas] = useState<FichaCampo[]>([]);
  const [loadingFicha, setLoadingFicha] = useState<boolean>(true);
  const [showHelpBanner, setShowHelpBanner] = useState<boolean>(true);

  // Cargar fichas de campo desde MongoDB
  useEffect(() => {
    let isMounted = true;
    const fetchFichas = async () => {
      try {
        setLoadingFicha(true);
        const data = await fichaCampoService.listar();
        if (isMounted) {
          setFichas(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.warn('No se pudieron cargar fichas de campo para sincronización:', err);
      } finally {
        if (isMounted) setLoadingFicha(false);
      }
    };
    fetchFichas();
    return () => { isMounted = false; };
  }, []);

  // Ficha más relevante para el cultivo o parcela desde la base de datos
  const fichaVinculada = useMemo(() => {
    if (!fichas || fichas.length === 0) return null;
    const norm = (cultivoNombre || '').toLowerCase();
    const found = fichas.find(f => (f.nombreCultivo || '').toLowerCase().includes(norm));
    return found || (fichas.length > 0 ? fichas[0] : null);
  }, [fichas, cultivoNombre]);

  // Si está en modo real, sincronizar el progreso fenológico con la última ficha de MongoDB
  useEffect(() => {
    if (mode === 'REAL' && fichaVinculada) {
      const etapa = (fichaVinculada.etapaFenologica || '').toLowerCase();
      if (etapa.includes('semilla') || etapa.includes('siembra') || etapa.includes('germinación')) {
        setStageProgress(12);
      } else if (etapa.includes('plántula') || etapa.includes('desarrollo') || etapa.includes('brote')) {
        setStageProgress(32);
      } else if (etapa.includes('floración') || etapa.includes('crecimiento') || etapa.includes('vegetativ')) {
        setStageProgress(65);
      } else if (etapa.includes('madurez') || etapa.includes('cosecha') || etapa.includes('fructific')) {
        setStageProgress(92);
      } else {
        setStageProgress(55);
      }
    }
  }, [mode, fichaVinculada]);

  // Calcular la etapa discreta actual (1..4)
  const currentStage = useMemo(() => {
    if (stageProgress <= 15) return 1;
    if (stageProgress <= 40) return 2;
    if (stageProgress <= 75) return 3;
    return 4;
  }, [stageProgress]);

  // Calcular edad del cultivo en días a partir de la fecha de siembra real en SQL Server
  const edadDias = useMemo(() => {
    try {
      if (!fechaSiembra) return 0;
      const siembra = new Date(fechaSiembra);
      const hoy = new Date();
      const diffTime = hoy.getTime() - siembra.getTime();
      const dias = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return isNaN(dias) || dias < 0 ? 0 : dias;
    } catch {
      return 0;
    }
  }, [fechaSiembra]);

  // Duración estimada del ciclo en días según la especie agronómica
  const cicloEstimadoDias = useMemo(() => {
    const norm = (cultivoNombre || '').toLowerCase();
    if (norm.includes('palta') || norm.includes('aguacate')) return 240;
    if (norm.includes('arándano') || norm.includes('blueberry') || norm.includes('biloxi')) return 150;
    if (norm.includes('espárrago') || norm.includes('asparag')) return 120;
    if (norm.includes('uva') || norm.includes('vid')) return 160;
    return 140;
  }, [cultivoNombre]);

  // Días estimados restantes para ventana de cosecha
  const diasParaCosecha = useMemo(() => {
    if (edadDias <= 0) return cicloEstimadoDias;
    return Math.max(0, cicloEstimadoDias - edadDias);
  }, [edadDias, cicloEstimadoDias]);

  // Formato de fecha de siembra
  const fechaSiembraFormateada = useMemo(() => {
    if (!fechaSiembra) return 'Fecha no registrada';
    try {
      const d = new Date(fechaSiembra);
      if (isNaN(d.getTime())) return fechaSiembra;
      return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return fechaSiembra;
    }
  }, [fechaSiembra]);

  // Vigor calculado según estado del cultivo en MongoDB
  const { vigorPct, vigorTexto, vigorColor } = useMemo(() => {
    if (!fichaVinculada) {
      return { vigorPct: 82, vigorTexto: 'En Evaluación', vigorColor: '#10B981' };
    }
    const est = (fichaVinculada.estadoCultivo || '').toLowerCase();
    if (est.includes('excelente') || est.includes('optimo') || est.includes('óptimo')) {
      return { vigorPct: 96, vigorTexto: 'Excelente / Óptimo', vigorColor: '#10B981' };
    }
    if (est.includes('bueno')) {
      return { vigorPct: 85, vigorTexto: 'Buen Desarrollo', vigorColor: '#059669' };
    }
    if (est.includes('regular') || est.includes('alerta')) {
      return { vigorPct: 65, vigorTexto: 'Bajo Monitoreo', vigorColor: '#d97706' };
    }
    if (est.includes('crítico') || est.includes('critico') || est.includes('malo')) {
      return { vigorPct: 40, vigorTexto: 'Atención Prioritaria', vigorColor: '#e11d48' };
    }
    return { vigorPct: 80, vigorTexto: 'Follaje Favorable', vigorColor: '#10B981' };
  }, [fichaVinculada]);

  // Telemetría agronómica de la última ficha de campo registrada en MongoDB
  const telemetry = useMemo(() => {
    return {
      temperatura: fichaVinculada?.temperaturaAmb != null ? `${fichaVinculada.temperaturaAmb.toFixed(1)}°C` : 'N/D',
      humedadSuelo: fichaVinculada?.humedadRelativa != null ? `${fichaVinculada.humedadRelativa}%` : 'N/D',
      clima: fichaVinculada?.condicionClima || 'Soleado en fundo',
      necesitaRiego: Boolean(fichaVinculada?.necesitaRiego),
      necesitaFumigacion: Boolean(fichaVinculada?.necesitaFumigacion),
      diagnostico: fichaVinculada?.diagnostico || 'Monitoreo técnico de rutina: Lote con desarrollo vegetativo uniforme y sin presencia crítica de plagas.',
      codigoFicha: fichaVinculada?.codigoFicha || 'F-CAMPO-EVAL',
      responsable: fichaVinculada?.responsableTecnico || 'Ing. Agrónomo Residente',
      fechaEvaluacion: fichaVinculada?.fechaRegistro
        ? new Date(fichaVinculada.fechaRegistro).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
        : 'Reciente',
    };
  }, [fichaVinculada]);

  // Descripción agronómica de cada una de las 4 etapas
  const stageInfo = [
    {
      num: 1,
      range: '0% - 15%',
      nombre: 'Siembra & Emergencia Radicular',
      faseCorta: 'Germinación',
      dias: 'Día 1 a 15',
      desc: 'La semilla o plántula se establece en el estrato subterráneo. La radícula primaria explora el perfil de suelo fijando el anclaje inicial del cultivo.',
      laboresRecomendadas: 'Riego de asiento para mantener bulbo húmedo, deshierbe manual en camellón y aplicación de bioestimulantes de enraizamiento.',
      nutrientes: 'Fósforo (P) soluble para desarrollo del sistema radicular y micorrizas.',
      alertaManejo: 'Evitar encharcamientos prolongados para prevenir asfixia radicular y hongos de suelo (Phytophthora).'
    },
    {
      num: 2,
      range: '16% - 40%',
      nombre: 'Desarrollo Vegetativo & Macollamiento',
      faseCorta: 'Crecimiento',
      dias: 'Día 16 a 45',
      desc: 'Brotación vigorosa de ramas laterales y emisión de hojas verdaderas. Inicio de alta fotosíntesis y consolidación de masa foliar.',
      laboresRecomendadas: 'Aporque de camellones, entutorado (si aplica), desbrote lateral y monitoreo de plagas masticadoras.',
      nutrientes: 'Nitrógeno (N) balanceado, Magnesio (Mg) y Hierro (Fe) para síntesis de clorofila.',
      alertaManejo: 'Cuidar el estrés por calor; el tejido foliar tierno requiere humedad constante y suelo bien oxigenado.'
    },
    {
      num: 3,
      range: '41% - 75%',
      nombre: 'Floración & Cuajado de Fruto',
      faseCorta: 'Floración',
      dias: 'Día 46 a 110',
      desc: 'Aparición de botones florales, polinización activa y retención de primordios frutales. Período crítico de demanda hídrica.',
      laboresRecomendadas: 'Instalación de colmenas polinizadoras, poda de ventilación y aspersión preventiva contra botrytis.',
      nutrientes: 'Calcio (Ca), Boro (B) y Zinc (Zn) para viabilidad polínica y amarre del fruto.',
      alertaManejo: 'No provocar estrés hídrico; cambios bruscos de humedad causan aborto masivo de flor.'
    },
    {
      num: 4,
      range: '76% - 100%',
      nombre: 'Maduración Productiva & Cosecha Comercial',
      faseCorta: 'Maduración y Cosecha',
      dias: 'Día 111+',
      desc: 'Llenado y maduración final del fruto. Acumulación óptima de azúcares, materia seca y calibre exportable listo para corte.',
      laboresRecomendadas: 'Muestreo de grados Brix y materia seca en campo, desinfección de tijeras de corte y logística de jabas.',
      nutrientes: 'Sulfato de Potasio (K) para coloración, firmeza de cáscara y peso final.',
      alertaManejo: 'Respetar los periodos de carencia fitosanitaria antes del ingreso de cuadrillas de cosecha.'
    },
  ];

  const infoActual = stageInfo[currentStage - 1];

  // Renderizador dinámico de frutos según cultivo
  const renderCropFruits = () => {
    const norm = cultivoNombre.toLowerCase();
    if (norm.includes('palta') || norm.includes('aguacate')) {
      return (
        <g className="fruit-cluster avocado-fruits">
          <ellipse cx="150" cy="130" rx="13" ry="19" fill="#1e3a2b" stroke="#059669" strokeWidth="1.5" />
          <ellipse cx="147" cy="125" rx="4" ry="7" fill="#34d399" opacity="0.4" />
          
          <ellipse cx="250" cy="120" rx="14" ry="21" fill="#1e3a2b" stroke="#059669" strokeWidth="1.5" />
          <ellipse cx="247" cy="114" rx="4" ry="8" fill="#34d399" opacity="0.4" />

          <ellipse cx="195" cy="165" rx="12" ry="18" fill="#1A110B" stroke="#059669" strokeWidth="1.5" />
          <ellipse cx="192" cy="160" rx="3" ry="6" fill="#34d399" opacity="0.4" />
        </g>
      );
    } else if (norm.includes('arándano') || norm.includes('blueberry') || norm.includes('biloxi')) {
      return (
        <g className="fruit-cluster blueberry-fruits">
          <circle cx="145" cy="130" r="8" fill="#1e3a8a" stroke="#60a5fa" strokeWidth="1.5" />
          <circle cx="158" cy="135" r="7.5" fill="#2563eb" stroke="#93c5fd" strokeWidth="1.5" />
          <circle cx="150" cy="144" r="7" fill="#1d4ed8" stroke="#60a5fa" strokeWidth="1.5" />

          <circle cx="245" cy="120" r="8" fill="#1e3a8a" stroke="#60a5fa" strokeWidth="1.5" />
          <circle cx="256" cy="128" r="8" fill="#2563eb" stroke="#93c5fd" strokeWidth="1.5" />
          <circle cx="248" cy="136" r="7.5" fill="#1d4ed8" stroke="#60a5fa" strokeWidth="1.5" />

          <circle cx="205" cy="155" r="7.5" fill="#1e3a8a" stroke="#60a5fa" strokeWidth="1.5" />
          <circle cx="195" cy="160" r="7" fill="#2563eb" stroke="#93c5fd" strokeWidth="1.5" />
        </g>
      );
    } else if (norm.includes('espárrago') || norm.includes('asparag')) {
      return (
        <g className="fruit-cluster asparagus-spears">
          <path d="M 175 220 Q 174 150 178 100 Q 183 95 186 100 Q 189 150 187 220 Z" fill="#10B981" stroke="#059669" strokeWidth="1.5" />
          <path d="M 175 110 L 180 95 L 186 110 Z" fill="#8b5cf6" opacity="0.8" />
          
          <path d="M 215 220 Q 218 140 222 85 Q 227 80 230 85 Q 233 140 227 220 Z" fill="#10B981" stroke="#059669" strokeWidth="1.5" />
          <path d="M 218 95 L 225 80 L 232 95 Z" fill="#8b5cf6" opacity="0.8" />
        </g>
      );
    } else {
      return (
        <g className="fruit-cluster grape-clusters">
          <circle cx="150" cy="125" r="7" fill="#881337" stroke="#f43f5e" strokeWidth="1" />
          <circle cx="160" cy="125" r="7" fill="#9f1239" stroke="#f43f5e" strokeWidth="1" />
          <circle cx="155" cy="136" r="7" fill="#be123c" stroke="#fb7185" strokeWidth="1" />
          <circle cx="165" cy="136" r="6.5" fill="#881337" stroke="#f43f5e" strokeWidth="1" />
          <circle cx="158" cy="146" r="6" fill="#be123c" stroke="#fb7185" strokeWidth="1" />

          <circle cx="240" cy="120" r="7" fill="#881337" stroke="#f43f5e" strokeWidth="1" />
          <circle cx="250" cy="120" r="7" fill="#9f1239" stroke="#f43f5e" strokeWidth="1" />
          <circle cx="245" cy="131" r="7" fill="#be123c" stroke="#fb7185" strokeWidth="1" />
          <circle cx="255" cy="131" r="6.5" fill="#881337" stroke="#f43f5e" strokeWidth="1" />
          <circle cx="248" cy="141" r="6" fill="#be123c" stroke="#fb7185" strokeWidth="1" />
        </g>
      );
    }
  };

  const content = (
    <div className="crop-growth-container">
      {/* Cabecera Principal (Visible en Modal o cuando no está oculta) */}
      {(!hideTopHeader || isModal) && (
        <div className="growth-header">
          <div className="growth-header-title">
            <div className="growth-badge">
              <Sprout size={16} color="var(--emerald-vibrant, #10B981)" />
              <span>SEGUIMIENTO FENOLÓGICO & BITÁCORA DE CAMPO</span>
            </div>
            <h3>
              {cultivoNombre} <span className="growth-variety">{variedad ? `· ${variedad}` : ''}</span>
            </h3>
            <p className="growth-subtitle">
              <MapPin size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              Parcela {parcelaId || 'en Fundo'} · AgroPacayales · {edadDias > 0 ? `Edad: ${edadDias} días en campo` : 'Ciclo agronómico activo'}
            </p>
          </div>

          <div className="growth-header-actions">
            <div className="growth-mode-switch">
              <button
                type="button"
                className={`mode-btn ${mode === 'REAL' ? 'active' : ''}`}
                onClick={() => setMode('REAL')}
                title="Muestra el estado según la última Ficha de Evaluación registrada por el agrónomo"
              >
                <FileText size={14} />
                <span>Evaluación de Campo</span>
              </button>
              <button
                type="button"
                className={`mode-btn ${mode === 'MANUAL' ? 'active' : ''}`}
                onClick={() => setMode('MANUAL')}
                title="Guía didáctica interactiva para explorar las 4 etapas del ciclo de vida"
              >
                <Sliders size={14} />
                <span>Guía de Etapas</span>
              </button>
            </div>

            {isModal && onClose && (
              <button type="button" className="btn-icon-close" onClick={onClose} aria-label="Cerrar ventana">
                <X size={20} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Sub-barra de controles si la cabecera superior está oculta (en Dashboard) */}
      {hideTopHeader && !isModal && (
        <div className="growth-subbar">
          <div className="subbar-info">
            <span className="subbar-crop-tag">
              <Sprout size={15} color="var(--emerald-vibrant, #10B981)" />
              <strong>{cultivoNombre}</strong> {variedad ? `(${variedad})` : ''} · Parcela {parcelaId || 'en Fundo'}
            </span>
            <span className="subbar-days-tag font-mono">
              <Calendar size={13} style={{ marginRight: 4 }} />
              {edadDias > 0 ? `${edadDias} días en campo` : 'Recién sembrado'}
            </span>
          </div>

          <div className="growth-mode-switch">
            <button
              type="button"
              className={`mode-btn ${mode === 'REAL' ? 'active' : ''}`}
              onClick={() => setMode('REAL')}
              title="Muestra el estado según la última Ficha de Evaluación registrada por el agrónomo"
            >
              <FileText size={14} />
              <span>Evaluación de Campo</span>
            </button>
            <button
              type="button"
              className={`mode-btn ${mode === 'MANUAL' ? 'active' : ''}`}
              onClick={() => setMode('MANUAL')}
              title="Guía didáctica interactiva para explorar las 4 etapas del cultivo"
            >
              <Sliders size={14} />
              <span>Guía de Etapas</span>
            </button>
          </div>
        </div>
      )}

      {/* Banner Explicativo: Contexto Didáctico y Humano para el Usuario */}
      {showHelpBanner && (
        <div className="growth-info-banner">
          <div className="banner-icon">
            <BookOpen size={18} />
          </div>
          <div className="banner-text">
            <strong>¿Cómo funciona este monitor?</strong> En AgroPacayales trabajamos con inspecciones agronómicas presenciales de campo (sin necesidad de sensores físicos). Esta herramienta traduce visualmente la <strong>fecha de siembra real ({fechaSiembraFormateada})</strong> y las <strong>evaluaciones registradas por el personal técnico</strong> en una línea de tiempo biológica para anticipar labores de riego, nutrición y cosecha.
          </div>
          <button
            type="button"
            className="banner-close-btn"
            onClick={() => setShowHelpBanner(false)}
            title="Ocultar nota"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Escena Agronómica: 3 Columnas Claras (Cronología -> Ilustración de la Planta -> Ficha de Campo) */}
      <div className="growth-canvas-wrapper">
        {/* Columna Izquierda: Cronología y Ciclo Fenológico Calculado */}
        <div className="growth-biocycle-panel left-panel">
          <div className="panel-title-chip">
            <Clock size={13} />
            <span>CRONOLOGÍA BIOLÓGICA</span>
          </div>

          {/* Días en campo */}
          <div className="agri-card">
            <div className="agri-card-icon time">
              <Calendar size={18} />
            </div>
            <div className="agri-card-details">
              <span className="agri-card-label">Días en Campo</span>
              <span className="agri-card-val font-mono">
                {edadDias > 0 ? `${edadDias} días` : 'Ciclo Inicial'}
              </span>
              <span className="agri-card-sub">Siembra: {fechaSiembraFormateada}</span>
            </div>
          </div>

          {/* Fase Fenológica Actual */}
          <div className="agri-card">
            <div className="agri-card-icon stage">
              <Sprout size={18} />
            </div>
            <div className="agri-card-details">
              <span className="agri-card-label">Etapa Fenológica</span>
              <span className="agri-card-val">{infoActual.faseCorta}</span>
              <span className="agri-card-sub">Fase {currentStage} de 4 · {stageProgress}% del ciclo</span>
            </div>
          </div>

          {/* Días para Cosecha Comercial */}
          <div className="agri-card">
            <div className="agri-card-icon harvest">
              <Sparkles size={18} />
            </div>
            <div className="agri-card-details">
              <span className="agri-card-label">Horizonte de Cosecha</span>
              <span className="agri-card-val font-mono">
                {diasParaCosecha > 0 ? `~${diasParaCosecha} días` : 'En Cosecha'}
              </span>
              <span className="agri-card-sub">Ciclo estimado: ~{cicloEstimadoDias} días</span>
            </div>
          </div>

          {/* Vigor y Salud del Follaje */}
          <div className="agri-card highlight">
            <div className="agri-card-icon health">
              <TrendingUp size={18} />
            </div>
            <div className="agri-card-details">
              <span className="agri-card-label">Vigor del Cultivo</span>
              <span className="agri-card-val font-mono" style={{ color: vigorColor }}>
                {vigorPct}% · {vigorTexto}
              </span>
              <div className="agri-progress-mini">
                <div
                  className="agri-progress-bar"
                  style={{ width: `${vigorPct}%`, backgroundColor: vigorColor }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Centro: Ilustración SVG Dinámica del Cultivo y Perfil de Suelo */}
        <div className="growth-svg-stage">
          {/* Badge superior con fase actual */}
          <div className="stage-overlay-indicator">
            <span className="current-phase-pill">
              Fase {currentStage} de 4 · {infoActual.nombre}
            </span>
          </div>

          <svg
            className="growth-svg"
            viewBox="0 0 400 380"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              {/* Degradados de Estrato Subterráneo Deep Earth Brown */}
              <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1A110B" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#F8F6F3" stopOpacity="1" />
              </linearGradient>

              <linearGradient id="soilStratum" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8C5A3C" />
                <stop offset="40%" stopColor="#2A1E17" />
                <stop offset="100%" stopColor="#1A110B" />
              </linearGradient>

              {/* Halo de Humedad Edáfica en el Bulbo de Riego */}
              <radialGradient id="moistureGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.45" />
                <stop offset="60%" stopColor="#0284c7" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#1A110B" stopOpacity="0" />
              </radialGradient>

              {/* Tallo Vegetal */}
              <linearGradient id="stemGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#059669" />
                <stop offset="50%" stopColor="#10B981" />
                <stop offset="100%" stopColor="#047857" />
              </linearGradient>

              {/* Follaje */}
              <linearGradient id="leafGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="70%" stopColor="#059669" />
                <stop offset="100%" stopColor="#1E3A2B" />
              </linearGradient>
            </defs>

            {/* Cielo / Dosel Aéreo */}
            <rect x="0" y="0" width="400" height="230" fill="url(#skyGrad)" />

            {/* Estrato Subterráneo de Tierra */}
            <rect x="0" y="230" width="400" height="150" fill="url(#soilStratum)" />

            {/* Línea de Superficie Agronómica con textura de camellón */}
            <line x1="0" y1="230" x2="400" y2="230" stroke="#C28D66" strokeWidth="3" />
            <path
              d="M 0 230 Q 50 228 100 230 T 200 230 T 300 229 T 400 230"
              fill="none"
              stroke="#8C5A3C"
              strokeWidth="1.5"
            />

            {/* Bulbo de humedad en perfil de suelo */}
            <circle cx="200" cy="275" r={35 + currentStage * 12} fill="url(#moistureGlow)" />

            {/* Textos sutiles de perfil agronómico */}
            <text x="14" y="222" fill="#8C5A3C" fontSize="10" fontWeight="700" letterSpacing="0.05em">
              SUPERFICIE DEL CAMELLÓN
            </text>
            <text x="14" y="246" fill="#C28D66" fontSize="10" opacity="0.8" fontWeight="600">
              ESTRATO RADICULAR SUBTERRÁNEO
            </text>

            {/* ============================================================== */}
            {/* ETAPA 1: SEMILLA Y RADÍCULA SUBTERRÁNEA                        */}
            {/* ============================================================== */}
            {currentStage === 1 && (
              <g className="stage-element stage-1-seed">
                <ellipse cx="200" cy="265" rx="14" ry="10" fill="#2A1E17" stroke="#C28D66" strokeWidth="2" />
                <ellipse cx="198" cy="263" rx="5" ry="3" fill="#E8D5C4" opacity="0.6" />
                <path
                  d="M 200 275 Q 198 295 194 310 Q 192 318 190 325"
                  fill="none"
                  stroke="#E8D5C4"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
                <path
                  d="M 197 292 Q 186 300 180 305"
                  fill="none"
                  stroke="#E8D5C4"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M 200 255 Q 201 245 200 238"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="2.5"
                  strokeDasharray="2 2"
                />
              </g>
            )}

            {/* ============================================================== */}
            {/* ETAPA 2: GERMINACIÓN & PLÁNTULA JOVEN                          */}
            {/* ============================================================== */}
            {currentStage === 2 && (
              <g className="stage-element stage-2-sprout">
                <path
                  d="M 200 230 Q 198 270 200 330"
                  fill="none"
                  stroke="#E8D5C4"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <path d="M 199 260 Q 180 280 170 300" fill="none" stroke="#E8D5C4" strokeWidth="2" />
                <path d="M 200 270 Q 220 290 235 310" fill="none" stroke="#E8D5C4" strokeWidth="2" />

                <path
                  d="M 200 230 Q 199 190 200 160"
                  fill="none"
                  stroke="url(#stemGrad)"
                  strokeWidth="5"
                  strokeLinecap="round"
                />

                <path
                  d="M 200 160 C 180 150 165 165 175 180 C 188 178 196 168 200 160 Z"
                  fill="url(#leafGrad)"
                  stroke="#059669"
                  strokeWidth="1"
                />
                <path
                  d="M 200 160 C 220 150 235 165 225 180 C 212 178 204 168 200 160 Z"
                  fill="url(#leafGrad)"
                  stroke="#059669"
                  strokeWidth="1"
                />
              </g>
            )}

            {/* ============================================================== */}
            {/* ETAPA 3: CRECIMIENTO VEGETATIVO & FLORACIÓN                   */}
            {/* ============================================================== */}
            {currentStage === 3 && (
              <g className="stage-element stage-3-vegetative">
                <path d="M 200 230 Q 198 280 200 350" fill="none" stroke="#E8D5C4" strokeWidth="4" />
                <path d="M 199 250 Q 170 270 150 310" fill="none" stroke="#E8D5C4" strokeWidth="2.5" />
                <path d="M 200 260 Q 230 280 255 320" fill="none" stroke="#E8D5C4" strokeWidth="2.5" />
                <path d="M 175 285 Q 155 310 145 340" fill="none" stroke="#E8D5C4" strokeWidth="1.5" />
                <path d="M 225 295 Q 245 320 260 350" fill="none" stroke="#E8D5C4" strokeWidth="1.5" />

                <path d="M 200 230 Q 198 160 200 95" fill="none" stroke="url(#stemGrad)" strokeWidth="7" strokeLinecap="round" />
                <path d="M 199 170 Q 160 150 140 135" fill="none" stroke="url(#stemGrad)" strokeWidth="4" strokeLinecap="round" />
                <path d="M 200 150 Q 240 135 260 120" fill="none" stroke="url(#stemGrad)" strokeWidth="4" strokeLinecap="round" />
                <path d="M 199 125 Q 175 105 160 90" fill="none" stroke="url(#stemGrad)" strokeWidth="3" strokeLinecap="round" />

                <ellipse cx="140" cy="130" rx="20" ry="12" transform="rotate(-25 140 130)" fill="url(#leafGrad)" stroke="#059669" />
                <ellipse cx="260" cy="115" rx="20" ry="12" transform="rotate(25 260 115)" fill="url(#leafGrad)" stroke="#059669" />
                <ellipse cx="160" cy="85" rx="18" ry="11" transform="rotate(-35 160 85)" fill="url(#leafGrad)" stroke="#059669" />
                <ellipse cx="200" cy="90" rx="18" ry="11" transform="rotate(0 200 90)" fill="url(#leafGrad)" stroke="#059669" />
                <ellipse cx="230" cy="95" rx="17" ry="10" transform="rotate(30 230 95)" fill="url(#leafGrad)" stroke="#059669" />

                <circle cx="165" cy="110" r="5.5" fill="#fef08a" stroke="#ca8a04" strokeWidth="1.5" />
                <circle cx="235" cy="95" r="5.5" fill="#fef08a" stroke="#ca8a04" strokeWidth="1.5" />
                <circle cx="195" cy="78" r="6" fill="#fef08a" stroke="#ca8a04" strokeWidth="1.5" />
              </g>
            )}

            {/* ============================================================== */}
            {/* ETAPA 4: PLANTA FRONDOSA MADURA CON FRUTOS DE COSECHA          */}
            {/* ============================================================== */}
            {currentStage === 4 && (
              <g className="stage-element stage-4-mature">
                <path d="M 200 230 Q 198 280 200 360" fill="none" stroke="#E8D5C4" strokeWidth="5" />
                <path d="M 199 245 Q 160 270 135 320" fill="none" stroke="#E8D5C4" strokeWidth="3" />
                <path d="M 200 255 Q 240 275 270 330" fill="none" stroke="#E8D5C4" strokeWidth="3" />
                <path d="M 155 285 Q 130 320 110 355" fill="none" stroke="#E8D5C4" strokeWidth="2" />
                <path d="M 245 290 Q 275 325 295 360" fill="none" stroke="#E8D5C4" strokeWidth="2" />

                <path d="M 200 230 Q 198 150 200 75" fill="none" stroke="url(#stemGrad)" strokeWidth="9" strokeLinecap="round" />
                <path d="M 199 175 Q 145 155 120 130" fill="none" stroke="url(#stemGrad)" strokeWidth="5" strokeLinecap="round" />
                <path d="M 200 155 Q 255 135 280 115" fill="none" stroke="url(#stemGrad)" strokeWidth="5" strokeLinecap="round" />
                <path d="M 199 120 Q 155 95 130 75" fill="none" stroke="url(#stemGrad)" strokeWidth="4" strokeLinecap="round" />
                <path d="M 200 110 Q 245 90 270 70" fill="none" stroke="url(#stemGrad)" strokeWidth="4" strokeLinecap="round" />

                <ellipse cx="120" cy="125" rx="26" ry="16" transform="rotate(-25 120 125)" fill="url(#leafGrad)" stroke="#059669" />
                <ellipse cx="280" cy="110" rx="26" ry="16" transform="rotate(25 280 110)" fill="url(#leafGrad)" stroke="#059669" />
                <ellipse cx="130" cy="70" rx="24" ry="15" transform="rotate(-30 130 70)" fill="url(#leafGrad)" stroke="#059669" />
                <ellipse cx="270" cy="65" rx="24" ry="15" transform="rotate(30 270 65)" fill="url(#leafGrad)" stroke="#059669" />
                <ellipse cx="200" cy="60" rx="28" ry="18" fill="url(#leafGrad)" stroke="#059669" />
                <ellipse cx="170" cy="85" rx="22" ry="14" transform="rotate(-15 170 85)" fill="url(#leafGrad)" stroke="#059669" />
                <ellipse cx="230" cy="85" rx="22" ry="14" transform="rotate(15 230 85)" fill="url(#leafGrad)" stroke="#059669" />

                {/* Frutos comerciales */}
                {renderCropFruits()}
              </g>
            )}

            {/* Efecto visual de fotosíntesis y brisa */}
            <circle cx="90" cy="80" r="1.5" fill="#38bdf8" opacity="0.6" />
            <circle cx="310" cy="95" r="2" fill="#4ade80" opacity="0.7" />
            <circle cx="210" cy="40" r="1.8" fill="#fbbf24" opacity="0.6" />
            <circle cx="180" cy="310" r="1.5" fill="#38bdf8" opacity="0.4" />
          </svg>
        </div>

        {/* Columna Derecha: Cuaderno de Inspección Técnica Presencial */}
        <div className="growth-inspection-panel right-panel">
          <div className="panel-title-chip">
            <ClipboardList size={13} />
            <span>ÚLTIMA INSPECCIÓN EN CAMPO</span>
          </div>

          {/* Evaluador Agronómico Responsable */}
          <div className="agri-card">
            <div className="agri-card-icon tech">
              <UserCheck size={18} />
            </div>
            <div className="agri-card-details">
              <span className="agri-card-label">Responsable Técnico</span>
              <span className="agri-card-val" style={{ fontSize: '0.9rem' }}>
                {telemetry.responsable}
              </span>
              <span className="agri-card-sub">
                Ficha: <strong>{telemetry.codigoFicha}</strong> · {telemetry.fechaEvaluacion}
              </span>
            </div>
          </div>

          {/* Clima observado en la visita */}
          <div className="agri-card">
            <div className="agri-card-icon weather">
              <Sun size={18} />
            </div>
            <div className="agri-card-details">
              <span className="agri-card-label">Entorno & Clima de Visita</span>
              <span className="agri-card-val">{telemetry.clima}</span>
              <span className="agri-card-sub">
                {telemetry.temperatura !== 'N/D' ? `${telemetry.temperatura} ambiental` : 'Observación directa'}
              </span>
            </div>
          </div>

          {/* Diagnóstico Hídrico */}
          <div className="agri-card">
            <div className="agri-card-icon water">
              <Droplets size={18} />
            </div>
            <div className="agri-card-details">
              <span className="agri-card-label">Prescripción de Riego</span>
              <span className="agri-card-val" style={{ fontSize: '0.88rem' }}>
                {telemetry.necesitaRiego ? 'Turno de Riego Recomendado' : 'Humedad de Suelo Adecuada'}
              </span>
              <span className={`agri-status-badge ${telemetry.necesitaRiego ? 'warn' : 'ok'}`}>
                {telemetry.necesitaRiego ? 'Humedad baja en lote' : 'Capacidad de campo óptima'}
              </span>
            </div>
          </div>

          {/* Sanidad Fitosanitaria */}
          <div className="agri-card">
            <div className="agri-card-icon phyto">
              <ShieldCheck size={18} />
            </div>
            <div className="agri-card-details">
              <span className="agri-card-label">Sanidad Fitosanitaria</span>
              <span className="agri-card-val" style={{ fontSize: '0.88rem' }}>
                {telemetry.necesitaFumigacion ? 'Tratamiento Recomendado' : 'Cultivo Sano / Sin Plagas'}
              </span>
              <span className={`agri-status-badge ${telemetry.necesitaFumigacion ? 'warn' : 'ok'}`}>
                {telemetry.necesitaFumigacion ? 'Fumigación requerida' : 'Baja incidencia fitosanitaria'}
              </span>
            </div>
          </div>

          {/* Cita textual del diagnóstico */}
          <div className="agri-quote-card">
            <div className="quote-header">
              <FileText size={13} />
              <span>Dictamen del Agrónomo:</span>
            </div>
            <p className="quote-body">"{telemetry.diagnostico}"</p>
          </div>
        </div>
      </div>

      {/* Control Inferior: Slider y Guía de Manejo Agronómico por Etapa */}
      <div className="growth-controls-footer">
        <div className="growth-slider-bar">
          <div className="slider-meta">
            <span className="slider-label">
              <Sliders size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
              Progreso del Ciclo Biológico:
            </span>
            <span className="slider-pct font-mono">{stageProgress}%</span>
          </div>

          <input
            type="range"
            min="1"
            max="100"
            value={stageProgress}
            onChange={(e) => {
              setMode('MANUAL');
              setStageProgress(Number(e.target.value));
            }}
            className="growth-range-slider"
            id="growth-slider-input"
            aria-label="Avance del ciclo fenológico"
          />
        </div>

        {/* Selector de las 4 Etapas */}
        <div className="growth-stage-tabs">
          {stageInfo.map((s) => (
            <button
              key={s.num}
              type="button"
              className={`stage-tab-btn ${currentStage === s.num ? 'active' : ''}`}
              onClick={() => {
                setMode('MANUAL');
                if (s.num === 1) setStageProgress(10);
                if (s.num === 2) setStageProgress(30);
                if (s.num === 3) setStageProgress(60);
                if (s.num === 4) setStageProgress(90);
              }}
            >
              <div className="tab-stage-num">Etapa {s.num}</div>
              <div className="tab-stage-name">{s.faseCorta}</div>
              <div className="tab-stage-days">{s.dias}</div>
            </button>
          ))}
        </div>

        {/* Guía Técnica Detallada de Manejo para la Etapa Seleccionada */}
        <div className="stage-technical-guide">
          <div className="guide-header">
            <div className="guide-title">
              <Leaf size={16} color="var(--emerald-vibrant, #10B981)" />
              <strong>{infoActual.nombre} ({infoActual.range})</strong>
            </div>
            <span className="guide-badge">Guía de Prácticas Agronómicas</span>
          </div>

          <div className="guide-grid">
            <div className="guide-col">
              <span className="guide-label">📖 Desarrollo Biológico en Campo</span>
              <p className="guide-text">{infoActual.desc}</p>

              <span className="guide-label" style={{ marginTop: 8 }}>⚠️ Punto Crítico de Manejo</span>
              <p className="guide-text alert">{infoActual.alertaManejo}</p>
            </div>

            <div className="guide-col">
              <span className="guide-label">💧 Demanda Nutricional & Hídrica</span>
              <p className="guide-text nutrition">{infoActual.nutrientes}</p>

              <span className="guide-label" style={{ marginTop: 8 }}>🚜 Labores de Campo Recomendadas</span>
              <p className="guide-text labors">{infoActual.laboresRecomendadas}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="modal-backdrop" onClick={onClose}>
        <div className="growth-modal-window" onClick={(e) => e.stopPropagation()}>
          {content}
        </div>
      </div>
    );
  }

  return content;
};
export default CropGrowthVisualizer;
