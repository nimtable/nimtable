import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import CatalogPage from './pages/catalog/catalog';
import RootLayout from './pages/layout';
import WelcomePage from './pages/welcome';
import NotFoundPage from './pages/not-found';
import NamespacePage from './pages/catalog/namespace';
import CatalogLayout from './layouts/catalog-layout';
import TablePage from './pages/catalog/table';
import ViewPage from './pages/catalog/view';
import OptimizePage from './pages/catalog/optimize';
import LoginPage from './pages/login';
import { AuthProvider } from './contexts/auth-context';
import RequireAuth from './components/require-auth';
import RedirectIfAuthenticated from './components/redirect-if-authenticated';
import Header from './components/header';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={
              <RedirectIfAuthenticated>
                <LoginPage />
              </RedirectIfAuthenticated>
            } />
            
            {/* Redirect root to welcome if authenticated, otherwise to login */}
            <Route path="/" element={<Navigate to="/welcome" replace />} />
            
            {/* All protected routes (welcome and catalog pages) */}
            <Route element={
              <RequireAuth>
                <RootLayout>
                  <CatalogLayout />
                </RootLayout>
              </RequireAuth>
            }>
              {/* Welcome page */}
              <Route path="/welcome" element={<WelcomePage />} />
              
              {/* Catalog routes */}
              <Route path="/catalog/:catalog" element={<CatalogPage />} />
              <Route path="/catalog/:catalog/namespace/:namespace" element={<NamespacePage />} />
              <Route path="/catalog/:catalog/namespace/:namespace/table/:table" element={<TablePage />} />
              <Route path="/catalog/:catalog/namespace/:namespace/view/:view" element={<ViewPage />} />
              <Route path="/catalog/:catalog/namespace/:namespace/table/:table/optimize" element={<OptimizePage />} />
            </Route>
            
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </div>
      </div>
    </AuthProvider>
  );
};

export default App;