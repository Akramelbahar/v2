import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';

// Context Providers
import { AuthProvider } from './context/AuthContext';
// Components
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import { PageLoadingSpinner } from './components/LoadingSpinner';
import ErrorBoundary from './components/ErrorBoundary';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

// Lazy-loaded pages for better performance
const Clients = React.lazy(() => import('./pages/Clients'));
const Equipment = React.lazy(() => import('./pages/Equipment'));
const Interventions = React.lazy(() => import('./pages/Interventions'));
const Reports = React.lazy(() => import('./pages/Reports'));
const Analytics = React.lazy(() => import('./pages/Analytics'));
const Users = React.lazy(() => import('./pages/Users'));
const Roles = React.lazy(() => import('./pages/Roles'));

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
    mutations: {
      retry: 1,
    },
  },
});

// Public route wrapper
const PublicRoute = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
};

// Lazy loading wrapper with suspense
const LazyLoadWrapper = ({ children }) => (
  <React.Suspense fallback={<PageLoadingSpinner message="Chargement de la page..." />}>
    {children}
  </React.Suspense>
);

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <div className="App">
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                } />
                
                <Route path="/register" element={
                  <PublicRoute>
                    <Register />
                  </PublicRoute>
                } />
                
                {/* Protected routes with layout */}
                <Route path="/" element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }>
                  {/* Dashboard */}
                  <Route index element={<Dashboard />} />
                  
                  {/* Profile */}
                  <Route path="profile" element={<Profile />} />
                  
                  {/* Client management */}
                  <Route path="clients" element={
                    <ProtectedRoute requiredPermission="clients:read">
                      <LazyLoadWrapper>
                        <Clients />
                      </LazyLoadWrapper>
                    </ProtectedRoute>
                  } />
                  
                  {/* Equipment management */}
                  <Route path="equipment" element={
                    <ProtectedRoute requiredPermission="equipment:read">
                      <LazyLoadWrapper>
                        <Equipment />
                      </LazyLoadWrapper>
                    </ProtectedRoute>
                  } />
                  
                  {/* Intervention management */}
                  <Route path="interventions" element={
                    <ProtectedRoute requiredPermission="interventions:read">
                      <LazyLoadWrapper>
                        <Interventions />
                      </LazyLoadWrapper>
                    </ProtectedRoute>
                  } />
                  
                  {/* Reports */}
                  <Route path="reports" element={
                    <ProtectedRoute requiredPermission="reports:read">
                      <LazyLoadWrapper>
                        <Reports />
                      </LazyLoadWrapper>
                    </ProtectedRoute>
                  } />
                  
                  {/* Analytics */}
                  <Route path="analytics" element={
                    <ProtectedRoute requiredPermission="analytics:read">
                      <LazyLoadWrapper>
                        <Analytics />
                      </LazyLoadWrapper>
                    </ProtectedRoute>
                  } />
                  
                  {/* Admin-only routes */}
                  <Route path="users" element={
                    <ProtectedRoute requiredRole="Admin">
                      <LazyLoadWrapper>
                        <Users />
                      </LazyLoadWrapper>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="roles" element={
                    <ProtectedRoute requiredRole="Admin">
                      <LazyLoadWrapper>
                        <Roles />
                      </LazyLoadWrapper>
                    </ProtectedRoute>
                  } />
                </Route>
                
                {/* Catch all route - 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
            
            {/* Toast notifications */}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  duration: 3000,
                  style: {
                    background: '#10B981',
                  },
                },
                error: {
                  duration: 5000,
                  style: {
                    background: '#EF4444',
                  },
                },
              }}
            />
            
            {/* React Query DevTools - Only in development */}
            {process.env.NODE_ENV === 'development' && 
             process.env.REACT_APP_ENABLE_QUERY_DEV_TOOLS === 'true' && (
              <ReactQueryDevtools initialIsOpen={false} />
            )}
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;