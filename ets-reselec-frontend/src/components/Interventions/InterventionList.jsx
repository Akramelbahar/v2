import React, { useState, useEffect } from 'react';
import { 
  Wrench, Plus, Search, Filter, Edit, Eye, Play, Pause, 
  CheckCircle, Clock, AlertCircle, X, Calendar, Building,
  RefreshCw, Download, Upload, MoreVertical
} from 'lucide-react';
import { 
  useInterventions, 
  useUpdateInterventionStatus 
} from '../hooks/useInterventions';
import { useEquipment } from '../hooks/useEquipment';
import { useClients } from '../hooks/useClients';
import { useAuth } from '../context/AuthContext';
import SearchInput from '../components/common/SearchInput';
import Pagination from '../components/common/Pagination';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatDate, formatDateTime, isToday, isThisWeek } from '../utils/dateUtils';
import toast from 'react-hot-toast';

const InterventionList = ({ 
  onInterventionSelect, 
  onCreateIntervention, 
  onEditIntervention 
}) => {
  const { hasPermission, user } = useAuth();
  
  // State management
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    statut: '',
    urgence: '',
    equipement_id: '',
    dateFrom: '',
    dateTo: '',
    creerPar_id: ''
  });
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [viewMode, setViewMode] = useState('table');
  const [selectedDateRange, setSelectedDateRange] = useState('all');

  // API hooks
  const { 
    data: interventionsData, 
    isLoading, 
    isError, 
    error, 
    refetch 
  } = useInterventions({
    page: currentPage,
    limit: pageSize,
    search: searchQuery,
    sortBy,
    sortOrder,
    ...filters
  });

  const { data: equipmentData } = useEquipment({ limit: 1000 });
  const { data: clientsData } = useClients({ limit: 1000 });
  const updateStatusMutation = useUpdateInterventionStatus();

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

  const handleDateRangeChange = (range) => {
    setSelectedDateRange(range);
    const today = new Date();
    let dateFrom = '';
    let dateTo = '';

    switch (range) {
      case 'today':
        dateFrom = today.toISOString().split('T')[0];
        dateTo = dateFrom;
        break;
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        dateFrom = weekStart.toISOString().split('T')[0];
        dateTo = weekEnd.toISOString().split('T')[0];
        break;
      case 'month':
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        dateFrom = monthStart.toISOString().split('T')[0];
        dateTo = monthEnd.toISOString().split('T')[0];
        break;
      case 'overdue':
        dateTo = today.toISOString().split('T')[0];
        setFilters(prev => ({
          ...prev,
          dateFrom: '',
          dateTo,
          statut: 'PLANIFIEE,EN_ATTENTE_PDR,EN_COURS,EN_PAUSE'
        }));
        return;
      default:
        dateFrom = '';
        dateTo = '';
    }

    setFilters(prev => ({
      ...prev,
      dateFrom,
      dateTo,
      statut: range === 'overdue' ? 'PLANIFIEE,EN_ATTENTE_PDR,EN_COURS,EN_PAUSE' : prev.statut
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

  const handleStatusUpdate = async (interventionId, newStatus) => {
    try {
      await updateStatusMutation.mutateAsync({
        id: interventionId,
        status: newStatus
      });
      toast.success('Statut mis à jour avec succès');
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du statut');
    }
  };

  const clearFilters = () => {
    setFilters({
      statut: '',
      urgence: '',
      equipement_id: '',
      dateFrom: '',
      dateTo: '',
      creerPar_id: ''
    });
    setSearchQuery('');
    setSelectedDateRange('all');
    setCurrentPage(1);
  };

  // Get filter options
  const statusOptions = [
    { value: 'PLANIFIEE', label: 'Planifiée', color: 'yellow' },
    { value: 'EN_ATTENTE_PDR', label: 'En Attente PDR', color: 'orange' },
    { value: 'EN_COURS', label: 'En Cours', color: 'blue' },
    { value: 'EN_PAUSE', label: 'En Pause', color: 'gray' },
    { value: 'TERMINEE', label: 'Terminée', color: 'green' },
    { value: 'ANNULEE', label: 'Annulée', color: 'red' },
    { value: 'ECHEC', label: 'Échec', color: 'red' }
  ];

  const urgencyOptions = [
    { value: 'true', label: 'Urgentes uniquement' },
    { value: 'false', label: 'Non urgentes' }
  ];

  const dateRangeOptions = [
    { value: 'all', label: 'Toutes les dates' },
    { value: 'today', label: 'Aujourd\'hui' },
    { value: 'week', label: 'Cette semaine' },
    { value: 'month', label: 'Ce mois' },
    { value: 'overdue', label: 'En retard' }
  ];

  // Statistics
  const stats = React.useMemo(() => {
    const interventions = interventionsData?.data || [];
    return {
      total: interventions.length,
      urgent: interventions.filter(i => i.urgence).length,
      enCours: interventions.filter(i => ['EN_COURS', 'EN_ATTENTE_PDR'].includes(i.statut)).length,
      terminees: interventions.filter(i => i.statut === 'TERMINEE').length,
      enRetard: interventions.filter(i => {
        const interventionDate = new Date(i.date);
        const today = new Date();
        return interventionDate < today && ['PLANIFIEE', 'EN_ATTENTE_PDR', 'EN_COURS', 'EN_PAUSE'].includes(i.statut);
      }).length
    };
  }, [interventionsData?.data]);

  if (isError) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Erreur de chargement
          </h3>
          <p className="text-gray-600 mb-4">
            {error?.message || 'Impossible de charger les interventions'}
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
      {/* Header with Statistics */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
              <Wrench className="w-6 h-6 text-blue-600" />
              <span>Gestion des Interventions</span>
            </h2>
            <p className="text-gray-600 mt-1">
              {interventionsData?.total || 0} intervention(s) au total
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Quick Stats */}
            <div className="hidden md:flex items-center space-x-4 mr-4">
              <div className="text-center">
                <div className="text-lg font-semibold text-red-600">{stats.urgent}</div>
                <div className="text-xs text-gray-500">Urgentes</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-blue-600">{stats.enCours}</div>
                <div className="text-xs text-gray-500">En cours</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-orange-600">{stats.enRetard}</div>
                <div className="text-xs text-gray-500">En retard</div>
              </div>
            </div>

            {/* Export Actions */}
            {hasPermission('interventions:export') && (
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

            {hasPermission('interventions:create') && (
              <button
                onClick={onCreateIntervention}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Nouvelle Intervention</span>
              </button>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-4">
          <div className="md:col-span-2">
            <SearchInput
              value={searchQuery}
              onChange={handleSearch}
              placeholder="Rechercher par équipement, client, description..."
              className="w-full"
            />
          </div>
          
          <div>
            <select
              value={selectedDateRange}
              onChange={(e) => handleDateRangeChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {dateRangeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <select
              value={filters.statut || ''}
              onChange={(e) => handleFilterChange('statut', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Tous les statuts</option>
              {statusOptions.map(status => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <select
              value={filters.urgence || ''}
              onChange={(e) => handleFilterChange('urgence', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Toutes urgences</option>
              {urgencyOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <select
              value={filters.equipement_id || ''}
              onChange={(e) => handleFilterChange('equipement_id', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Tous les équipements</option>
              {equipmentData?.data?.map(equipment => (
                <option key={equipment.id} value={equipment.id}>
                  {equipment.nom} - {equipment.proprietaire?.nom_entreprise}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Custom Date Range */}
        {selectedDateRange === 'custom' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date de début
              </label>
              <input
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date de fin
              </label>
              <input
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        )}

        {/* Active Filters */}
        {(searchQuery || Object.values(filters).some(v => v) || selectedDateRange !== 'all') && (
          <div className="flex items-center space-x-2 mb-4">
            <span className="text-sm text-gray-600">Filtres actifs:</span>
            {searchQuery && (
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                Recherche: {searchQuery}
              </span>
            )}
            {selectedDateRange !== 'all' && (
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                Période: {dateRangeOptions.find(d => d.value === selectedDateRange)?.label}
              </span>
            )}
            {filters.statut && (
              <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                Statut: {statusOptions.find(s => s.value === filters.statut)?.label}
              </span>
            )}
            {filters.urgence && (
              <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                {urgencyOptions.find(u => u.value === filters.urgence)?.label}
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
          <LoadingSpinner text="Chargement des interventions..." />
        </div>
      ) : viewMode === 'table' ? (
        <InterventionTable 
          interventions={interventionsData?.data || []}
          onSort={handleSort}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onView={(intervention) => onInterventionSelect?.(intervention)}
          onEdit={onEditIntervention}
          onStatusUpdate={handleStatusUpdate}
          hasEditPermission={hasPermission('interventions:update')}
          hasStatusUpdatePermission={hasPermission('interventions:update')}
        />
      ) : (
        <InterventionCards 
          interventions={interventionsData?.data || []}
          onView={(intervention) => onInterventionSelect?.(intervention)}
          onEdit={onEditIntervention}
          onStatusUpdate={handleStatusUpdate}
          hasEditPermission={hasPermission('interventions:update')}
          hasStatusUpdatePermission={hasPermission('interventions:update')}
        />
      )}

      {/* Pagination */}
      {interventionsData?.total > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(interventionsData.total / pageSize)}
            totalItems={interventionsData.total}
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
    </div>
  );
};