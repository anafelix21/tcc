import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './features/auth/services/authContext';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { LoginPage } from './features/auth/pages/LoginPage';
import { InicioPage } from './features/inicio/pages/InicioPage';
import { InsumosPage } from './features/insumos/pages/InsumosPage';
import { ParcelasPage } from './features/parcelas/pages/ParcelasPage';
import { UsuariosPage } from './features/usuarios/pages/UsuariosPage';
import { CultivosPage } from './features/cultivos/pages/CultivosPage';
import { CosechasPage } from './features/cosechas/pages/CosechasPage';
import { FichasCampoPage } from './features/fichas-campo/pages/FichasCampoPage';
import { ActividadesPage } from './features/actividades/pages/ActividadesPage';
import { AsignacionesPage } from './features/asignaciones/pages/AsignacionesPage';
import { DashboardPage } from './features/dashboard/pages/DashboardPage';

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-layout">
        <Navbar />
        {children}
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/inicio"
            element={
              <MainLayout>
                <InicioPage />
              </MainLayout>
            }
          />

          <Route
            path="/dashboard"
            element={
              <MainLayout>
                <DashboardPage />
              </MainLayout>
            }
          />

          <Route
            path="/parcelas"
            element={
              <MainLayout>
                <ParcelasPage />
              </MainLayout>
            }
          />

          <Route
            path="/cultivos"
            element={
              <MainLayout>
                <CultivosPage />
              </MainLayout>
            }
          />

          <Route
            path="/fichas-campo"
            element={
              <MainLayout>
                <FichasCampoPage />
              </MainLayout>
            }
          />

          <Route
            path="/cosechas"
            element={
              <MainLayout>
                <CosechasPage />
              </MainLayout>
            }
          />

          <Route
            path="/insumos"
            element={
              <MainLayout>
                <InsumosPage />
              </MainLayout>
            }
          />

          <Route
            path="/actividades"
            element={
              <MainLayout>
                <ActividadesPage />
              </MainLayout>
            }
          />

          <Route
            path="/asignaciones"
            element={
              <MainLayout>
                <AsignacionesPage />
              </MainLayout>
            }
          />

          <Route
            path="/usuarios"
            element={
              <MainLayout>
                <UsuariosPage />
              </MainLayout>
            }
          />

          {/* Redirección por defecto */}
          <Route path="*" element={<Navigate to="/inicio" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;

