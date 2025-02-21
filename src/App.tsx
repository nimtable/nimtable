import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import CatalogPage from './pages/catalog/page';
import RootLayout from './pages/layout';
import WelcomePage from './pages/welcome';
import NotFoundPage from './pages/not-found';
import NamespacePage from './pages/catalog/namespace/page';

const App: React.FC = () => {
  return (
    <RootLayout>
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/catalog/:catalog" element={<CatalogPage />} />
        <Route path="/catalog/:catalog/namespace/:namespace" element={<NamespacePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </RootLayout>
  );
};

export default App; 