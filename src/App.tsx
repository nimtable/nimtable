import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import CatalogPage from './pages/catalog/page';
import RootLayout from './pages/layout';
import WelcomePage from './pages/welcome';
import NotFoundPage from './pages/not-found';
import NamespacePage from './pages/catalog/namespace/page';
import CatalogLayout from './layouts/catalog-layout';
import TablePage from './pages/catalog/namespace/table/page';
import ViewPage from './pages/catalog/namespace/view/page';

const App: React.FC = () => {
  return (
    <RootLayout>
      <Routes>
        <Route element={<CatalogLayout />}>
          <Route path="/" element={<WelcomePage />} />
          <Route path="/catalog/:catalog" element={<CatalogPage />} />
          <Route path="/catalog/:catalog/namespace/:namespace" element={<NamespacePage />} />
          <Route path="/catalog/:catalog/namespace/:namespace/table/:table" element={<TablePage />} />
          <Route path="/catalog/:catalog/namespace/:namespace/view/:view" element={<ViewPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </RootLayout>
  );
};

export default App;