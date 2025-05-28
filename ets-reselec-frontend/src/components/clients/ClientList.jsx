import React, { useState, useEffect } from 'react';
import { 
  Users, Plus, Search, Filter, Edit, Trash2, Eye, Building, 
  Phone, Mail, MapPin, ChevronRight, AlertCircle, RefreshCw
} from 'lucide-react';
import { useClients, useDeleteClient } from '../hooks/useClients';
import { useAuth } from '../context/AuthContext';
import SearchInput from '../components/common/SearchInput';
import Pagination from '../components/common/Pagination';
import StatusBadge from '../components/common/StatusBadge';
import ConfirmDialog from '../components/common/ConfirmDialog';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatDate, formatPhoneNumber } from '../utils/formatUtils';
import toast from 'react-hot-toast';

const ClientList = ({ onClientSelect, onCreateClient, onEditClient }) => {
  const { hasPermission } = useAuth();
  
  // State management
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    secteur_activite: '',
    ville: ''
  });
  const [sortBy, setSortBy] = useState('nom_entreprise');
  const [sortOrder, setSortOrder] = useState('ASC');
  const [selectedClient, setSelectedClient] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'cards'

  // API hooks
  const { 
    data: clientsData, 
    isLoading, 
    isError, 
    error, 
    refetch 
  } = useClients({
    page: currentPage,
    limit: pageSize,
    search: searchQuery,
    sortBy,
    sortOrder,
    ...filters
  });

  const deleteClientMutation = useDeleteClient();

  // Event handlers
  const handleSearch = (query) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value || undefined
    }));
    setCurrentPage(1);
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(column);
      setSortOrder('ASC');
    }
    setCurrentPage(1);
  };

  const handleDeleteClick = (client) => {
    setSelectedClient(client);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedClient) return;
    
    try {
      await deleteClientMutation.mutateAsync(selectedClient.id);
      setShowDeleteDialog(false);
      setSelectedClient(null);
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const clearFilters = () => {
    setFilters({
      secteur_activite: '',
      ville: ''
    });
    setSearchQuery('');
    setCurrentPage(1);
  };

  // Get unique values for filter dropdowns
  const uniqueSectors = [...new Set(
    clientsData?.data?.map(client => client.secteur_activite).filter(Boolean) || []
  )];

  const uniqueCities = [...new Set(
    clientsData?.data?.map(client => client.ville).filter(Boolean) || []
  )];

  if (isError) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Erreur de chargement
          </h3>
          <p className="text-gray-600 mb-4">
            {error?.message || 'Impossible de charger les clients'}
          </p>
          <button
            onClick={() => refetch()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Réessayer</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
              <Users className="w-6 h-6 text-blue-600" />
              <span>Gestion des Clients</span>
            </h2>
            <p className="text-gray-600 mt-1">
              {clientsData?.total || 0} client(s) au total
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* View Mode Toggle */}
            <div className="flex border rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-2 text-sm font-medium ${
                  viewMode === 'table'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Tableau
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-2 text-sm font-medium ${
                  viewMode === 'cards'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Cartes
              </button>
            </div>

            {hasPermission('clients:create') && (
              <button
                onClick={onCreateClient}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Nouveau Client</span>
              </button>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="md:col-span-2">
            <SearchInput
              value={searchQuery}
              onChange={handleSearch}
              placeholder="Rechercher par nom d'entreprise, secteur, ville..."
              className="w-full"
            />
          </div>
          
          <div>
            <select
              value={filters.secteur_activite || ''}
              onChange={(e) => handleFilterChange('secteur_activite', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Tous les secteurs</option>
              {uniqueSectors.map(sector => (
                <option key={sector} value={sector}>
                  {sector}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <select
              value={filters.ville || ''}
              onChange={(e) => handleFilterChange('ville', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Toutes les villes</option>
              {uniqueCities.map(city => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Filters */}
        {(searchQuery || filters.secteur_activite || filters.ville) && (
          <div className="flex items-center space-x-2 mb-4">
            <span className="text-sm text-gray-600">Filtres actifs:</span>
            {searchQuery && (
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                Recherche: {searchQuery}
              </span>
            )}
            {filters.secteur_activite && (
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                Secteur: {filters.secteur_activite}
              </span>
            )}
            {filters.ville && (
              <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                Ville: {filters.ville}
              </span>
            )}
            <button
              onClick={clearFilters}
              className="text-sm text-red-600 hover:text-red-800 underline"
            >
              Effacer tout
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <LoadingSpinner text="Chargement des clients..." />
        </div>
      ) : viewMode === 'table' ? (
        <ClientTable 
          clients={clientsData?.data || []}
          onSort={handleSort}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onView={(client) => onClientSelect?.(client)}
          onEdit={onEditClient}
          onDelete={handleDeleteClick}
          hasEditPermission={hasPermission('clients:update')}
          hasDeletePermission={hasPermission('clients:delete')}
        />
      ) : (
        <ClientCards 
          clients={clientsData?.data || []}
          onView={(client) => onClientSelect?.(client)}
          onEdit={onEditClient}
          onDelete={handleDeleteClick}
          hasEditPermission={hasPermission('clients:update')}
          hasDeletePermission={hasPermission('clients:delete')}
        />
      )}

      {/* Pagination */}
      {clientsData?.total > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(clientsData.total / pageSize)}
            totalItems={clientsData.total}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
            pageSizeOptions={[10, 25, 50, 100]}
          />
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteConfirm}
        title="Supprimer le client"
        message={
          <div>
            <p>Êtes-vous sûr de vouloir supprimer le client :</p>
            <p className="font-semibold mt-2">{selectedClient?.nom_entreprise}</p>
            <p className="text-sm text-gray-600 mt-2">
              Cette action est irréversible et supprimera également tous les équipements associés.
            </p>
          </div>
        }
        type="danger"
        confirmText="Supprimer"
        loading={deleteClientMutation.isPending}
      />
    </div>
  );
};

export default ClientList;
// Client Table Component
const ClientTable = ({ 
    clients, 
    onSort, 
    sortBy, 
    sortOrder, 
    onView, 
    onEdit, 
    onDelete,
    hasEditPermission,
    hasDeletePermission
  }) => {
    const getSortIcon = (column) => {
      if (sortBy !== column) return null;
      return sortOrder === 'ASC' ? '↑' : '↓';
    };
  
    const SortableHeader = ({ column, children, className = '' }) => (
      <th 
        className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 ${className}`}
        onClick={() => onSort(column)}
      >
        <div className="flex items-center space-x-1">
          <span>{children}</span>
          <span className="text-gray-400">{getSortIcon(column)}</span>
        </div>
      </th>
    );
  
    if (clients.length === 0) {
      return (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Aucun client trouvé
          </h3>
          <p className="text-gray-600">
            Essayez de modifier vos critères de recherche ou créez un nouveau client.
          </p>
        </div>
      );
    }
  
    return (
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <SortableHeader column="nom_entreprise">Entreprise</SortableHeader>
                <SortableHeader column="secteur_activite">Secteur</SortableHeader>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <SortableHeader column="ville">Localisation</SortableHeader>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Équipements
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {clients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {client.nom_entreprise}
                      </div>
                      {client.registre_commerce && (
                        <div className="text-sm text-gray-500">
                          RC: {client.registre_commerce}
                        </div>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    {client.secteur_activite ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {client.secteur_activite}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-sm">Non défini</span>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="space-y-1">
                      {client.contact_principal && (
                        <div className="flex items-center space-x-1">
                          <Phone className="w-3 h-3 text-gray-400" />
                          <span>{client.contact_principal}</span>
                        </div>
                      )}
                      {client.email && (
                        <div className="flex items-center space-x-1">
                          <Mail className="w-3 h-3 text-gray-400" />
                          <span className="truncate max-w-[200px]">{client.email}</span>
                        </div>
                      )}
                      {client.tel && (
                        <div className="flex items-center space-x-1">
                          <Phone className="w-3 h-3 text-gray-400" />
                          <span>{formatPhoneNumber(client.tel)}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <div>
                        {client.ville && <div>{client.ville}</div>}
                        {client.codePostal && (
                          <div className="text-xs text-gray-500">{client.codePostal}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                        {client.equipmentCount || 0} équipement(s)
                      </span>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onView(client)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded"
                        title="Voir les détails"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      {hasEditPermission && (
                        <button
                          onClick={() => onEdit(client)}
                          className="text-yellow-600 hover:text-yellow-900 p-1 rounded"
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                      
                      {hasDeletePermission && (
                        <button
                          onClick={() => onDelete(client)}
                          className="text-red-600 hover:text-red-900 p-1 rounded"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };
  
  // Client Cards Component
  const ClientCards = ({ 
    clients, 
    onView, 
    onEdit, 
    onDelete,
    hasEditPermission,
    hasDeletePermission
  }) => {
    if (clients.length === 0) {
      return (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Aucun client trouvé
          </h3>
          <p className="text-gray-600">
            Essayez de modifier vos critères de recherche ou créez un nouveau client.
          </p>
        </div>
      );
    }
  
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clients.map((client) => (
          <ClientCard
            key={client.id}
            client={client}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
            hasEditPermission={hasEditPermission}
            hasDeletePermission={hasDeletePermission}
          />
        ))}
      </div>
    );
  };
  
  // Individual Client Card Component
  const ClientCard = ({ 
    client, 
    onView, 
    onEdit, 
    onDelete,
    hasEditPermission,
    hasDeletePermission
  }) => {
    return (
      <div className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
        {/* Card Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {client.nom_entreprise}
              </h3>
              {client.secteur_activite && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {client.secteur_activite}
                </span>
              )}
            </div>
            <Building className="w-8 h-8 text-gray-400" />
          </div>
        </div>
  
        {/* Card Body */}
        <div className="p-6 space-y-4">
          {/* Contact Info */}
          <div className="space-y-2">
            {client.contact_principal && (
              <div className="flex items-center text-sm text-gray-600">
                <Phone className="w-4 h-4 mr-2 text-gray-400" />
                <span>{client.contact_principal}</span>
              </div>
            )}
            
            {client.email && (
              <div className="flex items-center text-sm text-gray-600">
                <Mail className="w-4 h-4 mr-2 text-gray-400" />
                <span className="truncate">{client.email}</span>
              </div>
            )}
            
            {(client.ville || client.adresse) && (
              <div className="flex items-start text-sm text-gray-600">
                <MapPin className="w-4 h-4 mr-2 mt-0.5 text-gray-400 flex-shrink-0" />
                <div>
                  {client.adresse && <div>{client.adresse}</div>}
                  {client.ville && (
                    <div>
                      {client.ville}
                      {client.codePostal && ` ${client.codePostal}`}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
  
          {/* Stats */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">
                {client.equipmentCount || 0}
              </div>
              <div className="text-xs text-gray-500">Équipements</div>
            </div>
            
            {client.registre_commerce && (
              <div className="text-right">
                <div className="text-xs text-gray-500">RC</div>
                <div className="text-sm text-gray-900">{client.registre_commerce}</div>
              </div>
            )}
          </div>
        </div>
  
        {/* Card Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <button
            onClick={() => onView(client)}
            className="flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            <span>Voir détails</span>
            <ChevronRight className="w-4 h-4 ml-1" />
          </button>
          
          <div className="flex items-center space-x-2">
            {hasEditPermission && (
              <button
                onClick={() => onEdit(client)}
                className="text-gray-600 hover:text-gray-900 p-1 rounded"
                title="Modifier"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}
            
            {hasDeletePermission && (
              <button
                onClick={() => onDelete(client)}
                className="text-red-600 hover:text-red-900 p-1 rounded"
                title="Supprimer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };