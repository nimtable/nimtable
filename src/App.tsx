import React, { Suspense } from 'react';
import { useRoutes } from 'react-router-dom';
import { routes } from './routes';
import { AuthProvider } from './contexts/auth-context';
import Header from './components/header';

// 创建一个更好的加载状态组件
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
  </div>
);

const App: React.FC = () => {
  const element = useRoutes(routes);

  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1">
          <Suspense fallback={<LoadingFallback />}>
            {element}
          </Suspense>
        </div>
      </div>
    </AuthProvider>
  );
};

export default App;