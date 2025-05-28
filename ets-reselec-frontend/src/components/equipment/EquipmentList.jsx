import React, { useState, useEffect } from 'react';
import { 
  Package, Plus, Search, Filter, Edit, Trash2, Eye, Settings, 
  Wrench, Building, AlertTriangle, CheckCircle, Clock,
  RefreshCw, Download, Upload
} from 'lucide-react';
import { useEquipment, useDeleteEquipment, useEquipmentTypes } from '../hooks/useEquipment';
import { useClients } from '../hooks/useClients';
import { useAuth } from '../context/AuthContext';
import SearchInput from '../components/common/SearchInput';
import Pagination from '../components/common/Pagination';
import StatusBadge from '../components/common/StatusBadge';
import ConfirmDialog from '../components/common/ConfirmDialog';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '../utils/formatUtils';
import toast from 'react-hot-toast';

const EquipmentList = ({ onEquipmentSelect, onCreateEquipment, onEditEquipment }) => {
  const { hasPermission } = useAuth();
  
  // State management
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    type_equipement: '',
    proprietaire_id: '',
    status: ''
  });
  const [sortBy, setSortBy] = useState('nom');
  const [sortOrder, setSortOrder] = useState('ASC');
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [viewMode, setViewMode] = useState('table');

  // API hooks
  const { 
    data: equipmentData, 
    isLoading, 
    isError, 
    error, 
    refetch 
  } = useEquipment({
    page: currentPage,
    limit: pageSize,
    search: searchQuery,
    sortBy,
    sortOrder,
    ...filters
  });

  const { data: equipmentTypes = [] } = useEquipmentTypes();
  const { data: clientsData } = useClients({ limit: 1000 }); // Get all clients for filter
  const deleteEquipmentMutation = useDeleteEquipment();

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

  const handleDeleteClick = (equipment) => {
    setSelectedEquipment(equipment);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedEquipment) return;
    
    try {
      await deleteEquipmentMutation.mutateAsync(selectedEquipment.id);
      setShowDeleteDialog(false);
      setSelectedEquipment(null);
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const clearFilters = () => {
    setFilters({
      type_equipement: '',
      proprietaire_id: '',
      status: ''
    });
    setSearchQuery('');
    setCurrentPage(1);
  };

  // Get unique values for filters
  const uniqueStatuses = [...new Set(
    equipmentData?.data?.map(eq => eq.latestInterventionStatus).filter(Boolean) || []
  )];

  if (isError) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Erreur de chargement
          </h3>
          <p className="text-gray-600 mb-4">
            {error?.message || 'Impossible de charger les équipements'}
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
              <Package className="w-6 h-6 text-green-600" />
              <span>Gestion des Équipements</span>
            </h2>
            <p className="text-gray-600 mt-1">
              {equipmentData?.total || 0} équipement(s) au total
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Export/Import Actions */}
            {hasPermission('equipment:export') && (
              <button className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center space-x-2">
                <Download className="w-4 h-4" />
                <span>Exporter</span>
              </button>
            )}
            
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

            {hasPermission('equipment:create') && (
              <button
                onClick={onCreateEquipment}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Nouvel Équipement</span>
              </button>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
          <div className="md:col-span-2">
            <SearchInput
              value={searchQuery}
              onChange={handleSearch}
              placeholder="Rechercher par nom, marque, modèle..."
              className="w-full"
            />
          </div>
          
          <div>
            <select
              value={filters.type_equipement || ''}
              onChange={(e) => handleFilterChange('type_equipement', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Tous les types</option>
              {equipmentTypes.map(type => (
                <option key={type} value={type}>
                  {type.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <select
              value={filters.proprietaire_id || ''}
              onChange={(e) => handleFilterChange('proprietaire_id', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Tous les clients</option>
              {clientsData?.data?.map(client => (
                <option key={client.id} value={client.id}>
                  {client.nom_entreprise}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <select
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Tous les statuts</option>
              {uniqueStatuses.map(status => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Filters */}
        {(searchQuery || filters.type_equipement || filters.proprietaire_id || filters.status) && (
          <div className="flex items-center space-x-2 mb-4">
            <span className="text-sm text-gray-600">Filtres actifs:</span>
            {searchQuery && (
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                Recherche: {searchQuery}
              </span>
            )}
            {filters.type_equipement && (
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                Type: {filters.type_equipement.replace(/_/g, ' ')}
              </span>
            )}
            {filters.proprietaire_id && (
              <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                Client: {clientsData?.data?.find(c => c.id === parseInt(filters.proprietaire_id))?.nom_entreprise}
              </span>
            )}
            {filters.status && (
              <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                Statut: {filters.status}
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
          <LoadingSpinner text="Chargement des équipements..." />
        </div>
      ) : viewMode === 'table' ? (
        <EquipmentTable 
          equipment={equipmentData?.data || []}
          onSort={handleSort}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onView={(equipment) => onEquipmentSelect?.(equipment)}
          onEdit={onEditEquipment}
          onDelete={handleDeleteClick}
          hasEditPermission={hasPermission('equipment:update')}
          hasDeletePermission={hasPermission('equipment:delete')}
        />
      ) : (
        <EquipmentCards 
          equipment={equipmentData?.data || []}
          onView={(equipment) => onEquipmentSelect?.(equipment)}
          onEdit={onEditEquipment}
          onDelete={handleDeleteClick}
          hasEditPermission={hasPermission('equipment:update')}
          hasDeletePermission={hasPermission('equipment:delete')}
        />
      )}

      {/* Pagination */}
      {equipmentData?.total > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(equipmentData.total / pageSize)}
            totalItems={equipmentData.total}
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
        title="Supprimer l'équipement"
        message={
          <div>
            <p>Êtes-vous sûr de vouloir supprimer l'équipement :</p>
            <p className="font-semibold mt-2">{selectedEquipment?.nom}</p>
            <p className="text-sm text-gray-600 mt-2">
              Cette action est irréversible et supprimera également toutes les interventions associées.
            </p>
          </div>
        }
        type="danger"
        confirmText="Supprimer"
        loading={deleteEquipmentMutation.isPending}
      />
    </div>
  );
};

// Equipment Table Component
const EquipmentTable = ({ 
  equipment, 
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

  if (equipment.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Aucun équipement trouvé
        </h3>
        <p className="text-gray-600">
          Essayez de modifier vos critères de recherche ou créez un nouvel équipement.
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
              <SortableHeader column="nom">Équipement</SortableHeader>
              <SortableHeader column="type_equipement">Type</SortableHeader>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Propriétaire
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statut
              </th>
              <SortableHeader column="cout">Coût</SortableHeader>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {equipment.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Settings className="w-8 h-8 text-gray-400 mr-3" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {item.nom}
                      </div>
                      <div className="text-sm text-gray-500">
                        {item.marque} {item.modele}
                      </div>
                    </div>
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  {item.type_equipement ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {item.type_equipement.replace(/_/g, ' ')}
                    </span>
                  ) : (
                    <span className="text-gray-400 text-sm">Non défini</span>
                  )}
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Building className="w-4 h-4 text-gray-400 mr-2" />
                    <div className="text-sm text-gray-900">
                      {item.proprietaire?.nom_entreprise || 'N/A'}
                    </div>
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  {item.latestInterventionStatus ? (
                    <StatusBadge status={item.latestInterventionStatus} />
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      Aucune intervention
                    </span>
                  )}
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {item.cout ? formatCurrency(item.cout) : '-'}
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onView(item)}
                      className="text-blue-600 hover:text-blue-900 p-1 rounded"
                      title="Voir les détails"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    
                    {hasEditPermission && (
                      <button
                        onClick={() => onEdit(item)}
                        className="text-yellow-600 hover:text-yellow-900 p-1 rounded"
                        title="Modifier"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                    
                    {hasDeletePermission && (
                      <button
                        onClick={() => onDelete(item)}
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

// Equipment Cards Component
const EquipmentCards = ({ 
  equipment, 
  onView, 
  onEdit, 
  onDelete,
  hasEditPermission,
  hasDeletePermission
}) => {
  if (equipment.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Aucun équipement trouvé
        </h3>
        <p className="text-gray-600">
          Essayez de modifier vos critères de recherche ou créez un nouvel équipement.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {equipment.map((item) => (
        <EquipmentCard
          key={item.id}
          equipment={item}
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

// Individual Equipment Card Component
const EquipmentCard = ({ 
  equipment, 
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
              {equipment.nom}
            </h3>
            <p className="text-sm text-gray-500">
              {equipment.marque} {equipment.modele}
            </p>
            {equipment.type_equipement && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-2">
                {equipment.type_equipement.replace(/_/g, ' ')}
              </span>
            )}
          </div>
          <Settings className="w-8 h-8 text-gray-400" />
        </div>
      </div>

      {/* Card Body */}
      <div className="p-6 space-y-4">
        {/* Owner Info */}
        <div className="flex items-center text-sm text-gray-600">
          <Building className="w-4 h-4 mr-2 text-gray-400" />
          <span>{equipment.proprietaire?.nom_entreprise || 'N/A'}</span>
        </div>

        {/* Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Statut:</span>
          {equipment.latestInterventionStatus ? (
            <StatusBadge status={equipment.latestInterventionStatus} size="small" />
          ) : (
            <span className="text-xs text-gray-500">Aucune intervention</span>
          )}
        </div>

        {/* Cost */}
        {equipment.cout && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Coût:</span>
            <span className="text-sm font-semibold text-green-600">
              {formatCurrency(equipment.cout)}
            </span>
          </div>
        )}

        {/* Interventions Count */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">
              {equipment.interventionCount || 0}
            </div>
            <div className="text-xs text-gray-500">Interventions</div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onView(equipment)}
              className="text-blue-600 hover:text-blue-800 p-1 rounded"
              title="Voir les détails"
            >
              <Eye className="w-4 h-4" />
            </button>
            
            {hasEditPermission && (
              <button
                onClick={() => onEdit(equipment)}
                className="text-yellow-600 hover:text-yellow-800 p-1 rounded"
                title="Modifier"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}
            
            {hasDeletePermission && (
              <button
                onClick={() => onDelete(equipment)}
                className="text-red-600 hover:text-red-800 p-1 rounded"
                title="Supprimer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EquipmentList;