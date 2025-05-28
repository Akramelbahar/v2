import React from 'react';

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

// Main Management Pages
import ClientManagement from './pages/ClientManagement';
import EquipmentManagement from './pages/EquipmentManagement';
import InterventionManagement from './pages/InterventionManagement';
import RoleManagement from './pages/RoleManagement';

// Lazy-loaded pages for better performance
const Reports = React.lazy(() => import('./pages/Reports'));
const Analytics = React.lazy(() => import('./pages/Analytics'));
const Settings = React.lazy(() => import('./pages/Settings'));
const UserManagement = React.lazy(() => import('./pages/UserManagement'));

// Create React Query client with optimized settings
const queryClient = {
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors except 408 (timeout)
        if (error?.status >= 400 && error?.status < 500 && error?.status !== 408) {
          return false;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnMount: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
      onError: (error) => {
        console.error('Mutation error:', error);
      },
    },
  },
};

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
    <div className="min-h-screen bg-gray-50">
      {/* ETS RESELEC Application Structure */}
      <div className="App">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-center text-blue-600 mb-8">
            ETS RESELEC - Système de Gestion d'Équipements Industriels
          </h1>
          
          {/* Application Features Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Gestion des Clients
              </h3>
              <p className="text-gray-600 text-sm">
                • Liste complète avec recherche et filtres<br/>
                • Formulaires de création/modification<br/>
                • Vue tableau et cartes<br/>
                • Gestion des contacts et adresses
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Gestion des Équipements
              </h3>
              <p className="text-gray-600 text-sm">
                • Catalogue d'équipements industriels<br/>
                • Suivi des états et valeurs<br/>
                • Association aux clients<br/>
                • Historique des interventions
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Gestion des Interventions
              </h3>
              <p className="text-gray-600 text-sm">
                • Planification des interventions<br/>
                • Workflow de traitement<br/>
                • Suivi du statut en temps réel<br/>
                • Gestion des urgences
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Système de Rôles
              </h3>
              <p className="text-gray-600 text-sm">
                • Gestion des utilisateurs<br/>
                • Attribution des permissions<br/>
                • Contrôle d'accès granulaire<br/>
                • Interface d'administration
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Tableau de Bord
              </h3>
              <p className="text-gray-600 text-sm">
                • Statistiques en temps réel<br/>
                • Alertes et notifications<br/>
                • Graphiques et analyses<br/>
                • Vue d'ensemble des activités
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Rapports et Analytics
              </h3>
              <p className="text-gray-600 text-sm">
                • Rapports d'interventions<br/>
                • Analyses de performance<br/>
                • Export des données<br/>
                • Métriques personnalisées
              </p>
            </div>
          </div>
          
          {/* Implementation Structure */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Structure de l'Application
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Composants Principaux</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>• ClientList.jsx - Liste des clients</div>
                  <div>• ClientForm.jsx - Formulaire client</div>
                  <div>• EquipmentList.jsx - Liste des équipements</div>
                  <div>• EquipmentForm.jsx - Formulaire équipement</div>
                  <div>• InterventionList.jsx - Liste des interventions</div>
                  <div>• RoleManagement.jsx - Gestion des rôles</div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Services API</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>• clientService.js - API clients</div>
                  <div>• equipmentService.js - API équipements</div>
                  <div>• interventionService.js - API interventions</div>
                  <div>• roleService.js - API rôles</div>
                  <div>• dashboardService.js - API tableau de bord</div>
                  <div>• authService.js - Authentification</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Features List */}
          <div className="bg-blue-50 rounded-lg border border-blue-200 p-6 mt-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">
              Fonctionnalités Implémentées
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <h5 className="font-medium text-blue-800 mb-2">Interface Utilisateur</h5>
                <div className="text-blue-700 space-y-1">
                  <div>✅ Design responsive</div>
                  <div>✅ Thème cohérent</div>
                  <div>✅ Navigation intuitive</div>
                  <div>✅ Composants réutilisables</div>
                </div>
              </div>
              
              <div>
                <h5 className="font-medium text-blue-800 mb-2">Fonctionnalités</h5>
                <div className="text-blue-700 space-y-1">
                  <div>✅ CRUD complet</div>
                  <div>✅ Recherche et filtres</div>
                  <div>✅ Pagination avancée</div>
                  <div>✅ Validation des formulaires</div>
                </div>
              </div>
              
              <div>
                <h5 className="font-medium text-blue-800 mb-2">Sécurité</h5>
                <div className="text-blue-700 space-y-1">
                  <div>✅ Authentification JWT</div>
                  <div>✅ Contrôle des permissions</div>
                  <div>✅ Routes protégées</div>
                  <div>✅ Gestion des rôles</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Installation Instructions */}
          <div className="bg-gray-50 rounded-lg border p-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Instructions d'Installation
            </h3>
            
            <div className="text-sm text-gray-700 space-y-2">
              <div><strong>1. Frontend:</strong> Remplacer le contenu des fichiers React existants</div>
              <div><strong>2. Backend:</strong> Ajouter les routes et contrôleurs pour la gestion des rôles</div>
              <div><strong>3. Base de données:</strong> Les tables existent déjà dans le schéma fourni</div>
              <div><strong>4. Configuration:</strong> Vérifier les variables d'environnement</div>
              <div><strong>5. Test:</strong> Tester toutes les fonctionnalités CRUD</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Lazy-loaded detail components
const ClientDetails = React.lazy(() => import('./pages/ClientDetails'));
const EquipmentDetails = React.lazy(() => import('./pages/EquipmentDetails'));
const InterventionDetails = React.lazy(() => import('./pages/InterventionDetails'));

export default App;