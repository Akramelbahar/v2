// src/pages/Equipment.jsx
import React, { useState } from 'react';
import { 
  Package, Plus, Search, Edit, Trash2, Eye, Settings, 
  Building, Calendar, DollarSign, Wrench, AlertCircle,
  Filter, Download, RefreshCw, Tag, User
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import SearchInput from '../components/common/SearchInput';
import Pagination from '../components/common/Pagination';
import ConfirmDialog from '../components/common/ConfirmDialog';
import StatusBadge from '../components/common/StatusBadge';
import FormField from '../components/forms/FormField';
import Select from '../components/forms/Select';

import {
  useEquipment,
  useEquipmentTypes,
  useCreateEquipment,
  useUpdateEquipment,
  useDeleteEquipment
} from '../hooks/useEquipment';
import { useClients } from '../hooks/useClients';
import { formatDate, formatDateTime } from '../utils/dateUtils';
import { formatCurrency, formatNumber } from '../utils/formatUtils';

const Equipment = () => {
  const { hasPermission } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Data queries
  const { 
    data: equipmentData, 
    isLoading, 
    isError, 
    refetch 
  } = useEquipment({ 
    page: currentPage, 
    limit: pageSize, 
    search: searchQuery,
    ...filters 
  });

  const { data: equipmentTypes } = useEquipmentTypes();
  const { data: clientsData } = useClients({ limit: 1000 }); // Get all clients for form

  // Mutations
  const createEquipmentMutation = useCreateEquipment();
  const updateEquipmentMutation = useUpdateEquipment();
  const deleteEquipmentMutation = useDeleteEquipment();

  // Handlers
  const openModal = (type, equipment = null) => {
    setModalType(type);
    setSelectedEquipment(equipment);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedEquipment(null);
    setModalType('');
  };

  const openDeleteDialog = (equipment) => {
    setSelectedEquipment(equipment);
    setShowDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!selectedEquipment) return;
    
    try {
      await deleteEquipmentMutation.mutateAsync(selectedEquipment.id);
      setShowDeleteDialog(false);
      setSelectedEquipment(null);
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }));
    setCurrentPage(1);
  };

  // Equipment Form Component
  const EquipmentForm = ({ equipment, onSubmit, loading }) => {
    const [formData, setFormData] = useState({
      nom: equipment?.nom || '',
      marque: equipment?.marque || '',
      modele: equipment?.modele || '',
      type_equipement: equipment?.type_equipement || '',
      etatDeReception: equipment?.etatDeReception || '',
      valeur: equipment?.valeur || '',
      cout: equipment?.cout || '',
      proprietaire_id: equipment?.proprietaire_id || ''
    });

    const [errors, setErrors] = useState({});

    const handleSubmit = (e) => {
      e.preventDefault();
      
      // Basic validation
      const newErrors = {};
      if (!formData.nom.trim()) {
        newErrors.nom = 'Le nom de l\'équipement est requis';
      }
      if (!formData.proprietaire_id) {
        newErrors.proprietaire_id = 'Le propriétaire est requis';
      }
      if (formData.cout && isNaN(parseFloat(formData.cout))) {
        newErrors.cout = 'Le coût doit être un nombre valide';
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      // Convert numeric fields
      const submitData = {
        ...formData,
        cout: formData.cout ? parseFloat(formData.cout) : null
      };

      onSubmit(submitData);
    };

    const handleChange = (field, value) => {
      setFormData(prev => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: '' }));
      }
    };

    // Prepare client options for select
    const clientOptions = clientsData?.data?.map(client => ({
      value: client.id,
      label: client.nom_entreprise
    })) || [];

    const typeOptions = equipmentTypes?.map(type => ({
      value: type,
      label: type.replace(/_/g, ' ')
    })) || [];

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-4">Informations générales</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Nom de l'équipement"
              name="nom"
              required
              error={errors.nom}
            >
              <input
                type="text"
                className="form-input"
                value={formData.nom}
                onChange={(e) => handleChange('nom', e.target.value)}
                placeholder="Nom de l'équipement"
              />
            </FormField>
            
            <FormField
              label="Type d'équipement"
              name="type_equipement"
            >
              <Select
                value={typeOptions.find(opt => opt.value === formData.type_equipement)}
                onChange={(option) => handleChange('type_equipement', option?.value || '')}
                options={typeOptions}
                placeholder="Sélectionner un type"
                searchable
              />
            </FormField>

            <FormField
              label="Marque"
              name="marque"
            >
              <input
                type="text"
                className="form-input"
                value={formData.marque}
                onChange={(e) => handleChange('marque', e.target.value)}
                placeholder="Marque de l'équipement"
              />
            </FormField>

            <FormField
              label="Modèle"
              name="modele"
            >
              <input
                type="text"
                className="form-input"
                value={formData.modele}
                onChange={(e) => handleChange('modele', e.target.value)}
                placeholder="Modèle de l'équipement"
              />
            </FormField>
          </div>
        </div>

        {/* Owner Information */}
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-4">Propriétaire</h4>
          <FormField
            label="Client propriétaire"
            name="proprietaire_id"
            required
            error={errors.proprietaire_id}
          >
            <Select
              value={clientOptions.find(opt => opt.value === parseInt(formData.proprietaire_id))}
              onChange={(option) => handleChange('proprietaire_id', option?.value?.toString() || '')}
              options={clientOptions}
              placeholder="Sélectionner un client"
              searchable
            />
          </FormField>
        </div>

        {/* Technical Information */}
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-4">Informations techniques</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="État de réception"
              name="etatDeReception"
            >
              <select
                className="form-input"
                value={formData.etatDeReception}
                onChange={(e) => handleChange('etatDeReception', e.target.value)}
              >
                <option value="">Sélectionner l'état</option>
                <option value="Excellent">Excellent</option>
                <option value="Bon">Bon</option>
                <option value="Correct">Correct</option>
                <option value="Mauvais">Mauvais</option>
                <option value="Hors service">Hors service</option>
              </select>
            </FormField>

            <FormField
              label="Valeur / Référence"
              name="valeur"
            >
              <input
                type="text"
                className="form-input"
                value={formData.valeur}
                onChange={(e) => handleChange('valeur', e.target.value)}
                placeholder="Référence ou valeur technique"
              />
            </FormField>

            <FormField
              label="Coût (MAD)"
              name="cout"
              error={errors.cout}
            >
              <input
                type="number"
                step="0.01"
                min="0"
                className="form-input"
                value={formData.cout}
                onChange={(e) => handleChange('cout', e.target.value)}
                placeholder="0.00"
              />
            </FormField>
          </div>
        </div>
        
        <div className="flex justify-end space-x-2 pt-4 border-t">
          <button
            type="button"
            onClick={closeModal}
            className="btn btn-secondary"
            disabled={loading}
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
          >
            {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>}
            {equipment ? 'Modifier' : 'Créer'}
          </button>
        </div>
      </form>
    );
  };

  // Equipment Detail Component
  const EquipmentDetail = ({ equipment }) => {
    if (!equipment) return null;

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-800 rounded-lg p-6 text-white">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <Package className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{equipment.nom}</h2>
              <p className="text-green-100">{equipment.type_equipement?.replace(/_/g, ' ')}</p>
              <p className="text-green-200 text-sm">{equipment.marque} {equipment.modele}</p>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Technical Information */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
              <Settings className="w-5 h-5" />
              <span>Informations techniques</span>
            </h3>
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-500">Type:</span>
                <p className="text-gray-900">{equipment.type_equipement?.replace(/_/g, ' ') || 'Non spécifié'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Marque:</span>
                <p className="text-gray-900">{equipment.marque || 'Non spécifiée'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Modèle:</span>
                <p className="text-gray-900">{equipment.modele || 'Non spécifié'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">État de réception:</span>
                <p className="text-gray-900">{equipment.etatDeReception || 'Non spécifié'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Valeur/Référence:</span>
                <p className="text-gray-900">{equipment.valeur || 'Non spécifiée'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Coût:</span>
                <p className="text-gray-900">{equipment.cout ? formatCurrency(equipment.cout) : 'Non spécifié'}</p>
              </div>
            </div>
          </div>

          {/* Owner Information */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
              <Building className="w-5 h-5" />
              <span>Propriétaire</span>
            </h3>
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-500">Entreprise:</span>
                <p className="text-gray-900">{equipment.proprietaire?.nom_entreprise || 'Non spécifiée'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Contact:</span>
                <p className="text-gray-900">{equipment.proprietaire?.contact_principal || 'Non spécifié'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Téléphone:</span>
                <p className="text-gray-900">{equipment.proprietaire?.telephone_contact || 'Non spécifié'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Email:</span>
                <p className="text-gray-900">{equipment.proprietaire?.email_contact || 'Non spécifié'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center space-x-3">
              <Wrench className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{equipment.interventionCount || 0}</p>
                <p className="text-sm text-gray-600">Interventions</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center space-x-3">
              <User className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-900">Ajouté par</p>
                <p className="text-sm text-gray-600">{equipment.ajouterPar?.nom || 'Non spécifié'}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center space-x-3">
              <Calendar className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-sm text-gray-900">Dernière intervention</p>
                <p className="text-sm text-gray-600">
                  {equipment.latestInterventionStatus ? (
                    <StatusBadge status={equipment.latestInterventionStatus} size="small" />
                  ) : (
                    'Aucune'
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Maintenance History */}
        {equipment.maintenanceStats && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4">Historique de maintenance</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{equipment.maintenanceStats.totalInterventions}</p>
                <p className="text-sm text-blue-800">Total interventions</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{equipment.maintenanceStats.completedInterventions}</p>
                <p className="text-sm text-green-800">Terminées</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{equipment.maintenanceStats.urgentInterventions}</p>
                <p className="text-sm text-red-800">Urgentes</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Table columns configuration
  const columns = [
    { 
      key: 'nom', 
      header: 'Équipement',
      render: (value, row) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-sm text-gray-500">{row.type_equipement?.replace(/_/g, ' ')}</div>
        </div>
      )
    },
    { 
      key: 'marque', 
      header: 'Marque/Modèle',
      render: (value, row) => (
        <div>
          <div className="text-gray-900">{value || 'Non spécifiée'}</div>
          <div className="text-sm text-gray-500">{row.modele || ''}</div>
        </div>
      )
    },
    { 
      key: 'proprietaire', 
      header: 'Propriétaire',
      render: (value) => (
        <div className="flex items-center space-x-1">
          <Building className="w-4 h-4 text-gray-400" />
          <span>{value?.nom_entreprise || 'Non spécifié'}</span>
        </div>
      )
    },
    { 
      key: 'latestInterventionStatus', 
      header: 'Statut',
      render: (value) => value ? (
        <StatusBadge status={value} size="small" />
      ) : (
        <span className="text-gray-500 text-sm">Aucune intervention</span>
      )
    },
    { 
      key: 'cout', 
      header: 'Coût',
      render: (value) => value ? formatCurrency(value) : '-'
    }
  ];

  // Table actions
  const actions = [
    {
      icon: Eye,
      label: 'Voir',
      onClick: (row) => openModal('detail', row),
      className: 'text-blue-600 hover:text-blue-800'
    },
    ...(hasPermission('equipment:update') ? [{
      icon: Edit,
      label: 'Modifier',
      onClick: (row) => openModal('edit', row),
      className: 'text-yellow-600 hover:text-yellow-800'
    }] : []),
    ...(hasPermission('equipment:delete') ? [{
      icon: Trash2,
      label: 'Supprimer',
      onClick: (row) => openDeleteDialog(row),
      className: 'text-red-600 hover:text-red-800'
    }] : [])
  ];

  if (isError) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
          <div className="text-red-600 mb-4">
            <AlertCircle className="w-12 h-12 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Erreur de chargement</h2>
          <p className="text-gray-600 mb-4">Impossible de charger les données des équipements</p>
          <button 
            onClick={() => refetch()}
            className="btn btn-primary"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
              <Package className="w-8 h-8 text-green-600" />
              <span>Gestion des Équipements</span>
            </h1>
            <p className="text-gray-600 mt-1">Gérez votre parc d'équipements</p>
          </div>
          {hasPermission('equipment:create') && (
            <button 
              onClick={() => openModal('create')}
              className="btn btn-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nouvel Équipement
            </button>
          )}
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex-1">
            <SearchInput
              value={searchQuery}
              onChange={handleSearch}
              placeholder="Rechercher par nom, marque, modèle..."
              className="w-full"
            />
          </div>
          
          <select 
            className="form-input min-w-[200px]"
            value={filters.type_equipement || ''}
            onChange={(e) => handleFilterChange('type_equipement', e.target.value)}
          >
            <option value="">Tous les types</option>
            {equipmentTypes?.map(type => (
              <option key={type} value={type}>{type.replace(/_/g, ' ')}</option>
            ))}
          </select>

          <select 
            className="form-input min-w-[200px]"
            value={filters.status || ''}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="">Tous les statuts</option>
            <option value="PLANIFIEE">Planifiée</option>
            <option value="EN_COURS">En cours</option>
            <option value="TERMINEE">Terminée</option>
            <option value="EN_ATTENTE_PDR">En attente PDR</option>
          </select>

          <div className="flex space-x-2">
            <button className="btn btn-secondary">
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </button>
            <button 
              onClick={() => refetch()}
              className="btn btn-secondary"
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        data={equipmentData?.data || []}
        columns={columns}
        loading={isLoading}
        actions={hasPermission('equipment:read') ? actions : null}
        emptyMessage="Aucun équipement trouvé"
        pagination={
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil((equipmentData?.total || 0) / pageSize)}
            totalItems={equipmentData?.total || 0}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        }
      />

      {/* Modal */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={closeModal}
          title={
            modalType === 'create' ? 'Nouvel Équipement' :
            modalType === 'edit' ? 'Modifier l\'Équipement' :
            modalType === 'detail' ? 'Détails de l\'Équipement' : ''
          }
          size={modalType === 'detail' ? 'xl' : 'lg'}
        >
          {modalType === 'detail' ? (
            <EquipmentDetail equipment={selectedEquipment} />
          ) : (
            <EquipmentForm
              equipment={selectedEquipment}
              onSubmit={(data) => {
                if (modalType === 'edit') {
                  updateEquipmentMutation.mutate({ id: selectedEquipment.id, data });
                } else {
                  createEquipmentMutation.mutate(data);
                }
              }}
              loading={createEquipmentMutation.isPending || updateEquipmentMutation.isPending}
            />
          )}
        </Modal>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Confirmer la suppression"
        message={`Êtes-vous sûr de vouloir supprimer l'équipement "${selectedEquipment?.nom}" ? Cette action est irréversible.`}
        type="danger"
        confirmText="Supprimer"
        loading={deleteEquipmentMutation.isPending}
      />
    </div>
  );
};

export default Equipment;