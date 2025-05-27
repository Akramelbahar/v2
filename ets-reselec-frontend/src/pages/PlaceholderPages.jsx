import React from 'react';
import { Settings, Users, Package, Wrench, FileText, BarChart3, UserCheck, Shield } from 'lucide-react';

const PlaceholderPage = ({ icon: Icon = Settings, title, description }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
        <div className="w-16 h-16 mx-auto mb-6 bg-blue-100 rounded-full flex items-center justify-center">
          <Icon className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-600 mb-6">{description}</p>
        <div className="text-sm text-gray-500">ETS RESELEC - Système de gestion d'équipements</div>
      </div>
    </div>
  );
};

// Individual page exports - NO DUPLICATES
export const Register = () => (
  <PlaceholderPage
    icon={UserCheck}
    title="Inscription"
    description="Créez votre compte ETS RESELEC"
  />
);

export const Profile = () => (
  <PlaceholderPage
    icon={UserCheck}
    title="Profil Utilisateur"
    description="Gérez vos informations personnelles"
  />
);

export const NotFound = () => (
  <PlaceholderPage
    icon={Settings}
    title="Page Non Trouvée"
    description="La page que vous cherchez n'existe pas."
  />
);

export const Clients = () => (
  <PlaceholderPage
    icon={Users}
    title="Gestion des Clients"
    description="Gérez vos clients et leurs informations"
  />
);

export const Equipment = () => (
  <PlaceholderPage
    icon={Package}
    title="Gestion des Équipements"
    description="Gérez votre parc d'équipements"
  />
);

export const Interventions = () => (
  <PlaceholderPage
    icon={Wrench}
    title="Gestion des Interventions"
    description="Planifiez et suivez vos interventions"
  />
);

export const Reports = () => (
  <PlaceholderPage
    icon={FileText}
    title="Rapports"
    description="Consultez vos rapports d'activité"
  />
);

export const Analytics = () => (
  <PlaceholderPage
    icon={BarChart3}
    title="Analytiques"
    description="Analysez vos données de performance"
  />
);

export const UsersPage = () => (
  <PlaceholderPage
    icon={UserCheck}
    title="Gestion des Utilisateurs"
    description="Gérez les utilisateurs du système"
  />
);

export const Roles = () => (
  <PlaceholderPage
    icon={Shield}
    title="Gestion des Rôles"
    description="Configurez les permissions et rôles"
  />
);

export default PlaceholderPage;