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
const Sections = React.lazy(() => import('./pages/Sections'));

// Create React Query client with optimized settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
    mutations: {
      retry: 1,
    },
  },
});

// Public route wrapper component
const PublicRoute = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
};

// Lazy loading wrapper with suspense and loading state
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
                  {/* Dashboard - Default route */}
                  <Route index element={<Dashboard />} />
                  
                  {/* User Profile */}
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
                  {/* User Management */}
                  <Route path="users" element={
                    <ProtectedRoute requiredRole="Administrateur">
                      <LazyLoadWrapper>
                        <Users />
                      </LazyLoadWrapper>
                    </ProtectedRoute>
                  } />
                  
                  {/* Role Management */}
                  <Route path="roles" element={
                    <ProtectedRoute requiredRole="Administrateur">
                      <LazyLoadWrapper>
                        <Roles />
                      </LazyLoadWrapper>
                    </ProtectedRoute>
                  } />
                  
                  {/* Section Management */}
                  <Route path="sections" element={
                    <ProtectedRoute requiredRole="Administrateur">
                      <LazyLoadWrapper>
                        <Sections />
                      </LazyLoadWrapper>
                    </ProtectedRoute>
                  } />
                </Route>
                
                {/* Redirect root to dashboard if authenticated */}
                <Route path="/" element={<Navigate to="/" replace />} />
                
                {/* 404 - Catch all route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
            
            {/* Toast notifications with custom configuration */}
            <Toaster
              position="top-right"
              reverseOrder={false}
              gutter={8}
              toastOptions={{
                // Default options for all toasts
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                  padding: '16px',
                  borderRadius: '8px',
                  fontSize: '14px',
                },
                // Success toast styling
                success: {
                  duration: 3000,
                  style: {
                    background: '#10B981',
                  },
                  iconTheme: {
                    primary: '#fff',
                    secondary: '#10B981',
                  },
                },
                // Error toast styling
                error: {
                  duration: 5000,
                  style: {
                    background: '#EF4444',
                  },
                  iconTheme: {
                    primary: '#fff',
                    secondary: '#EF4444',
                  },
                },
                // Loading toast styling
                loading: {
                  style: {
                    background: '#6B7280',
                  },
                },
              }}
            />
            
            {/* React Query DevTools - Only in development */}
            {process.env.NODE_ENV === 'development' && 
             process.env.REACT_APP_ENABLE_QUERY_DEV_TOOLS === 'true' && (
              <ReactQueryDevtools 
                initialIsOpen={false} 
                position="bottom-right"
                toggleButtonProps={{
                  style: {
                    position: 'fixed',
                    bottom: '20px',
                    right: '20px',
                    zIndex: 99999,
                  },
                }}
              />
            )}
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;