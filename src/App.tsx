import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import CatalogPage from './pages/catalog/page';
import RootLayout from './pages/layout';
import OverviewPage from './pages/page';

const App: React.FC = () => {
  return (
    <RootLayout>
      <Routes>
        <Route path="/" element={<OverviewPage />} />
        <Route path="/:catalog" element={<CatalogPage />} />
      </Routes>
    </RootLayout>
  );
};

export default App; 