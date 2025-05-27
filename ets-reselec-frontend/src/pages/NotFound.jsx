import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Search, Settings } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();
  
  const handleGoBack = () => {
    navigate(-1);
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Logo/Icon */}
        <div className="mb-8">
          <Settings className="w-16 h-16 text-primary-600 mx-auto mb-4" />
          <h1 className="text-sm font-medium text-primary-600">ETS RESELEC</h1>
        </div>
        
        {/* 404 Error */}
        <div className="mb-8">
          <h2 className="text-6xl font-bold text-gray-900 mb-4">404</h2>
          <h3 className="text-2xl font-semibold text-gray-900 mb-4">
            Page introuvable
          </h3>
          <p className="text-gray-600 leading-relaxed">
            Désolé, la page que vous recherchez n'existe pas. 
            Elle a peut-être été déplacée, supprimée ou l'URL est incorrecte.
          </p>
        </div>
        
        {/* Search suggestion */}
        <div className="bg-white rounded-lg shadow-soft p-6 mb-8">
          <div className="flex items-center justify-center mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h4 className="font-semibold text-gray-900 mb-2">
            Que cherchiez-vous ?
          </h4>
          <p className="text-sm text-gray-600 mb-4">
            Voici quelques suggestions pour vous aider :
          </p>
          <div className="space-y-2 text-left">
            <Link
              to="/"
              className="block p-2 rounded-lg hover:bg-gray-50 text-sm text-primary-600 hover:text-primary-800"
            >
              • Tableau de bord principal
            </Link>
            <Link
              to="/clients"
              className="block p-2 rounded-lg hover:bg-gray-50 text-sm text-primary-600 hover:text-primary-800"
            >
              • Gestion des clients
            </Link>
            <Link
              to="/equipment"
              className="block p-2 rounded-lg hover:bg-gray-50 text-sm text-primary-600 hover:text-primary-800"
            >
              • Gestion des équipements
            </Link>
            <Link
              to="/interventions"
              className="block p-2 rounded-lg hover:bg-gray-50 text-sm text-primary-600 hover:text-primary-800"
            >
              • Suivi des interventions
            </Link>
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="space-y-4">
          <Link
            to="/"
            className="w-full bg-primary-600 text-white py-3 px-6 rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center space-x-2 font-medium"
          >
            <Home className="w-5 h-5" />
            <span>Retour à l'accueil</span>
          </Link>
          
          <button
            onClick={handleGoBack}
            className="w-full bg-white text-gray-700 py-3 px-6 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2 font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Page précédente</span>
          </button>
        </div>
        
        {/* Help section */}
        <div className="mt-12 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-2">
            Besoin d'aide ?
          </h4>
          <p className="text-sm text-blue-800 mb-3">
            Si vous pensez qu'il s'agit d'une erreur ou si vous avez besoin d'assistance, 
            contactez le support technique.
          </p>
          <div className="text-sm text-blue-700">
            <p>Email: support@etsreselec.com</p>
            <p>Tél: +212 5XX XX XX XX</p>
          </div>
        </div>
        
        {/* Footer */}
        <div className="mt-8 text-xs text-gray-500">
          <p>© 2024 ETS RESELEC. Tous droits réservés.</p>
          <p className="mt-1">Code d'erreur: 404-NOT-FOUND</p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;