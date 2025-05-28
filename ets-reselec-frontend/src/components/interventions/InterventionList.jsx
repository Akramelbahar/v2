// src/components/interventions/InterventionList.jsx
import React, { useState, useMemo } from 'react';
import { 
  Search, Filter, Calendar, Clock, AlertTriangle, Plus, 
  Eye, Edit, Trash2, RefreshCw, Download, FileText, 
  SlidersHorizontal, X
} from 'lucide-react';
import InterventionCard from './InterventionCard';
import StatusBadge from '../common/StatusBadge';
import SearchInput from '../common/SearchInput';
import Pagination from '../common/Pagination';
import LoadingSpinner from '../common/LoadingSpinner';
import { useInterventions } from '../../hooks/useInterventions';
import { useAuth } from '../../context/AuthContext';
import { formatDate, formatDateTime } from '../../utils/dateUtils';

const InterventionList = ({ 
  onCreateNew, 
  onViewDetails, 
  onEdit, 
  onDelete,
  viewMode = 'list' // 'list' or 'cards'
}) => {
  const { hasPermission } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('DESC');
  
  // Filters state
  const [filters, setFilters] = useState({
    statut: '',
    urgence: '',
    type_intervention: '',
    priorite: '',
    dateFrom: '',
    dateTo: '',
    equipement_id: '',
    creerPar_id: ''
  });

  // Build query parameters
  const queryParams = useMemo(() => ({
    page: currentPage,
    limit: pageSize,
    search: searchQuery,
    sortBy,
    sortOrder,
    ...Object.fromEntries(
      Object.entries(filters).filter(([_, value]) => value !== '')
    )
  }), [currentPage, pageSize, searchQuery, sortBy, sortOrder, filters]);

  // Fetch interventions
  const { 
    data: interventionsData, 
    isLoading, 
    error, 
    refetch 
  } = useInterventions(queryParams);

  // Handle search
  const handleSearch = (query) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  // Handle filter change
  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
    setCurrentPage(1);
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      statut: '',
      urgence: '',
      type_intervention: '',
      priorite: '',
      dateFrom: '',
      dateTo: '',
      equipement_id: '',
      creerPar_id: ''
    });
    setSearchQuery('');
    setCurrentPage(1);
  };

  // Handle sort change
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(field);
      setSortOrder('DESC');
    }
    setCurrentPage(1);
  };

  // Get active filter count
  const activeFilterCount = Object.values(filters).filter(value => value !== '').length + 
    (searchQuery ? 1 : 0);

  // Status options for filter
  const statusOptions = [
    { value: '', label: 'Tous les statuts' },
    { value: 'PLANIFIEE', label: 'Planifiée' },
    { value: 'EN_ATTENTE_PDR', label: 'En Attente PDR' },
    { value: 'EN_COURS', label: 'En Cours' },
    { value: 'EN_PAUSE', label: 'En Pause' },
    { value: 'TERMINEE', label: 'Terminée' },
    { value: 'ANNULEE', label: 'Annulée' },
    { value: 'ECHEC', label: 'Échec' }
  ];

  const typeOptions = [
    { value: '', label: 'Tous les types' },
    { value: 'MAINTENANCE', label: 'Maintenance' },
    { value: 'RENOVATION', label: 'Rénovation' },
    { value: 'REPARATION', label: 'Réparation' },
    { value: 'INSTALLATION', label: 'Installation' }
  ];

  const priorityOptions = [
    { value: '', label: 'Toutes priorités' },
    { value: 'BASSE', label: 'Basse' },
    { value: 'NORMALE', label: 'Normale' },
    { value: 'HAUTE', label: 'Haute' },
    { value: 'CRITIQUE', label: 'Critique' }
  ];

  const urgencyOptions = [
    { value: '', label: 'Toutes urgences' },
    { value: 'true', label: 'Urgentes uniquement' },
    { value: 'false', label: 'Non urgentes' }
  ];

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
        <div className="text-red-600 mb-4">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
          <h3 className="text-lg font-semibold">Erreur de chargement</h3>
          <p className="text-sm mt-2">Impossible de charger les interventions</p>
        </div>
        <button 
          onClick={refetch}
          className="btn btn-primary"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
              <FileText className="w-6 h-6 text-blue-600" />
              <span>Gestion des Interventions</span>
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {interventionsData?.total || 0} intervention(s) trouvée(s)
              {activeFilterCount > 0 && ` • ${activeFilterCount} filtre(s) actif(s)`}
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={refetch}
              className="btn btn-secondary"
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
            
            {hasPermission('interventions:create') && (
              <button
                onClick={onCreateNew}
                className="btn btn-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle Intervention
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
          {/* Search */}
          <div className="flex-1">
            <SearchInput
              value={searchQuery}
              onChange={handleSearch}
              placeholder="Rechercher par équipement, client, description..."
              className="w-full"
            />
          </div>
          
          {/* Quick Filters */}
          <div className="flex items-center space-x-3">
            <select
              value={filters.statut}
              onChange={(e) => handleFilterChange('statut', e.target.value)}
              className="form-input text-sm min-w-[140px]"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            
            <select
              value={filters.urgence}
              onChange={(e) => handleFilterChange('urgence', e.target.value)}
              className="form-input text-sm min-w-[120px]"
            >
              {urgencyOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn btn-secondary relative ${activeFilterCount > 0 ? 'bg-blue-50 border-blue-300' : ''}`}
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Filtres
              {activeFilterCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Extended Filters */}
        {showFilters && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type d'intervention
                </label>
                <select
                  value={filters.type_intervention}
                  onChange={(e) => handleFilterChange('type_intervention', e.target.value)}
                  className="form-input text-sm w-full"
                >
                  {typeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priorité
                </label>
                <select
                  value={filters.priorite}
                  onChange={(e) => handleFilterChange('priorite', e.target.value)}
                  className="form-input text-sm w-full"
                >
                  {priorityOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date début
                </label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  className="form-input text-sm w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date fin
                </label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  className="form-input text-sm w-full"
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-600">
                {activeFilterCount} filtre(s) actif(s)
              </p>
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Effacer tous les filtres
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Interventions List/Cards */}
      {isLoading ? (
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <LoadingSpinner text="Chargement des interventions..." />
        </div>
      ) : (
        <>
          {viewMode === 'cards' ? (
            // Cards View
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {interventionsData?.data?.map(intervention => (
                <InterventionCard
                  key={intervention.id}
                  intervention={intervention}
                  onView={() => onViewDetails(intervention)}
                  onEdit={hasPermission('interventions:update') ? () => onEdit(intervention) : null}
                  onDelete={hasPermission('interventions:delete') ? () => onDelete(intervention) : null}
                />
              ))}
            </div>
          ) : (
            // Table View
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th 
                        className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                        onClick={() => handleSort('id')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>ID</span>
                          {sortBy === 'id' && (
                            <span className="text-blue-600">
                              {sortOrder === 'ASC' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Équipement / Client
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th 
                        className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                        onClick={() => handleSort('date')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Date</span>
                          {sortBy === 'date' && (
                            <span className="text-blue-600">
                              {sortOrder === 'ASC' ? '↑' : '↓'}  
                            </span>
                          )}
                        </div>
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {interventionsData?.data?.map(intervention => (
                      <tr key={intervention.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{intervention.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {intervention.equipement?.nom}
                          </div>
                          <div className="text-sm text-gray-500">
                            {intervention.equipement?.proprietaire?.nom_entreprise}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {intervention.description || 'Aucune description'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(intervention.date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge 
                            status={intervention.statut} 
                            urgence={intervention.urgence}
                            size="small"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="capitalize">
                            {intervention.type_intervention?.toLowerCase() || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => onViewDetails(intervention)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Voir les détails"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {hasPermission('interventions:update') && (
                            <button
                              onClick={() => onEdit(intervention)}
                              className="text-yellow-600 hover:text-yellow-800"
                              title="Modifier"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                          {hasPermission('interventions:delete') && (
                            <button
                              onClick={() => onDelete(intervention)}
                              className="text-red-600 hover:text-red-800"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {interventionsData?.data?.length === 0 && (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">Aucune intervention trouvée</h3>
                  <p className="text-gray-600 mt-2">
                    {activeFilterCount > 0 
                      ? 'Essayez de modifier vos filtres de recherche'
                      : 'Créez votre première intervention pour commencer'
                    }
                  </p>
                  {activeFilterCount > 0 && (
                    <button
                      onClick={clearFilters}
                      className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Effacer les filtres
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Pagination */}
          {interventionsData?.data?.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil((interventionsData?.total || 0) / pageSize)}
                totalItems={interventionsData?.total || 0}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setCurrentPage(1);
                }}
                className="justify-center"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default InterventionList;