import { lazy, Suspense } from 'react';
import { RouteObject, Outlet } from 'react-router-dom';
import RootLayout from './pages/layout';
import CatalogLayout from './layouts/catalog-layout';

// loading fallback
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
  </div>
);

// create a wrapper component to handle lazy loading
const withSuspense = (Component: React.LazyExoticComponent<any>) => (
  <Suspense fallback={<LoadingFallback />}>
    <Component />
  </Suspense>
);

// use webpackPrefetch and webpackPreload to optimize lazy loading
const WelcomePage = lazy(() => import(/* webpackPrefetch: true */ './pages/welcome'));
const CatalogPage = lazy(() => import(/* webpackPrefetch: true */ './pages/catalog/catalog'));
const NamespacePage = lazy(() => import(/* webpackPrefetch: true */ './pages/catalog/namespace'));
const TablePage = lazy(() => import(/* webpackPrefetch: true */ './pages/catalog/table'));
const ViewPage = lazy(() => import(/* webpackPrefetch: true */ './pages/catalog/view'));
const OptimizePage = lazy(() => import(/* webpackPrefetch: true */ './pages/catalog/optimize'));
const NotFoundPage = lazy(() => import(/* webpackPrefetch: true */ './pages/not-found'));

// wrapper for RootLayout
const RootLayoutWrapper = () => (
  <RootLayout>
    <Outlet />
  </RootLayout>
);

export const routes: RouteObject[] = [
  {
    element: <RootLayoutWrapper />,
    children: [
      {
        element: <CatalogLayout />,
        children: [
          {
            path: '/',
            element: withSuspense(WelcomePage),
          },
          {
            path: '/catalog/:catalog',
            element: withSuspense(CatalogPage),
          },
          {
            path: '/catalog/:catalog/namespace/:namespace',
            element: withSuspense(NamespacePage),
          },
          {
            path: '/catalog/:catalog/namespace/:namespace/table/:table',
            element: withSuspense(TablePage),
          },
          {
            path: '/catalog/:catalog/namespace/:namespace/view/:view',
            element: withSuspense(ViewPage),
          },
          {
            path: '/catalog/:catalog/namespace/:namespace/table/:table/optimize',
            element: withSuspense(OptimizePage),
          },
        ],
      },
      {
        path: '*',
        element: withSuspense(NotFoundPage),
      },
    ],
  },
]; 