import React from 'react';
import { UserCheck } from 'lucide-react';

const Users = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
        <div className="w-16 h-16 mx-auto mb-6 bg-blue-100 rounded-full flex items-center justify-center">
          <UserCheck className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Gestion des Utilisateurs</h2>
        <p className="text-gray-600 mb-6">Gérez les utilisateurs du système</p>
        <div className="text-sm text-gray-500">ETS RESELEC - Page en construction</div>
      </div>
    </div>
  );
};

export default Users;