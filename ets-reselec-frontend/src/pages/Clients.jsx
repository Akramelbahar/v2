// src/pages/Clients.jsx
import React, { useState } from 'react';
import { 
  Users, Plus, Search, Edit, Trash2, Eye, Building, Phone, Mail,
  MapPin, User, Calendar, FileText, Package, MoreVertical,
  Filter, Download, Upload, RefreshCw, AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import SearchInput from '../components/common/SearchInput';
import Pagination from '../components/common/Pagination';
import ConfirmDialog from '../components/common/ConfirmDialog';
import LoadingSpinner from '../components/common/LoadingSpinner';
import FormField from '../components/forms/FormField';

import {
  useClients,
  useClient,
  useCreateClient,
  useUpdateClient,
  useDeleteClient,
  useClientSectors
} from '../hooks/useClients';
import { formatDate, formatDateTime } from '../utils/dateUtils';
import { formatPhoneNumber, truncateText } from '../utils/formatUtils';

const Clients = () => {
  const { hasPermission } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Data queries
  const { 
    data: clientsData, 
    isLoading, 
    isError, 
    refetch 
  } = useClients({ 
    page: currentPage, 
    limit: pageSize, 
    search: searchQuery,
    ...filters 
  });

  const { data: clientSectors } = useClientSectors();

  // Mutations
  const createClientMutation = useCreateClient();
  const updateClientMutation = useUpdateClient();
  const deleteClientMutation = useDeleteClient();

  // Handlers
  const openModal = (type, client = null) => {
    setModalType(type);
    setSelectedClient(client);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedClient(null);
    setModalType('');
  };

  const openDeleteDialog = (client) => {
    setSelectedClient(client);
    setShowDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!selectedClient) return;
    
    try {
      await deleteClientMutation.mutateAsync(selectedClient.id);
      setShowDeleteDialog(false);
      setSelectedClient(null);
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

  // Client Form Component
  const ClientForm = ({ client, onSubmit, loading }) => {
    const [formData, setFormData] = useState({
      nom_entreprise: client?.nom_entreprise || '',
      secteur_activite: client?.secteur_activite || '',
      adresse: client?.adresse || '',
      ville: client?.ville || '',
      codePostal: client?.codePostal || '',
      tel: client?.tel || '',
      fax: client?.fax || '',
      email: client?.email || '',
      siteWeb: client?.siteWeb || '',
      contact_principal: client?.contact_principal || '',
      poste_contact: client?.poste_contact || '',
      telephone_contact: client?.telephone_contact || '',
      email_contact: client?.email_contact || '',
      registre_commerce: client?.registre_commerce || '',
      forme_juridique: client?.forme_juridique || ''
    });

    const [errors, setErrors] = useState({});

    const handleSubmit = (e) => {
      e.preventDefault();
      
      // Basic validation
      const newErrors = {};
      if (!formData.nom_entreprise.trim()) {
        newErrors.nom_entreprise = 'Le nom de l\'entreprise est requis';
      }

      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Email invalide';
      }

      if (formData.email_contact && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email_contact)) {
        newErrors.email_contact = 'Email de contact invalide';
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      onSubmit(formData);
    };

    const handleChange = (field, value) => {
      setFormData(prev => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: '' }));
      }
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Information */}
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-4">Informations de l'entreprise</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Nom de l'entreprise"
              name="nom_entreprise"
              required
              error={errors.nom_entreprise}
            >
              <input
                type="text"
                className="form-input"
                value={formData.nom_entreprise}
                onChange={(e) => handleChange('nom_entreprise', e.target.value)}
                placeholder="Nom de l'entreprise"
              />
            </FormField>
            
            <FormField
              label="Secteur d'activité"
              name="secteur_activite"
            >
              <input
                type="text"
                className="form-input"
                value={formData.secteur_activite}
                onChange={(e) => handleChange('secteur_activite', e.target.value)}
                placeholder="Secteur d'activité"
                list="sectors"
              />
              <datalist id="sectors">
                {clientSectors?.map(sector => (
                  <option key={sector} value={sector} />
                ))}
              </datalist>
            </FormField>

            <FormField
              label="Forme juridique"
              name="forme_juridique"
            >
              <select
                className="form-input"
                value={formData.forme_juridique}
                onChange={(e) => handleChange('forme_juridique', e.target.value)}
              >
                <option value="">Sélectionner</option>
                <option value="SARL">SARL</option>
                <option value="SA">SA</option>
                <option value="SAS">SAS</option>
                <option value="Auto-entrepreneur">Auto-entrepreneur</option>
                <option value="Autre">Autre</option>
              </select>
            </FormField>

            <FormField
              label="Registre de commerce"
              name="registre_commerce"
            >
              <input
                type="text"
                className="form-input"
                value={formData.registre_commerce}
                onChange={(e) => handleChange('registre_commerce', e.target.value)}
                placeholder="Numéro RC"
              />
            </FormField>
          </div>
        </div>

        {/* Address Information */}
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-4">Adresse</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <FormField
                label="Adresse"
                name="adresse"
              >
                <input
                  type="text"
                  className="form-input"
                  value={formData.adresse}
                  onChange={(e) => handleChange('adresse', e.target.value)}
                  placeholder="Adresse complète"
                />
              </FormField>
            </div>

            <FormField
              label="Ville"
              name="ville"
            >
              <input
                type="text"
                className="form-input"
                value={formData.ville}
                onChange={(e) => handleChange('ville', e.target.value)}
                placeholder="Ville"
              />
            </FormField>

            <FormField
              label="Code postal"
              name="codePostal"
            >
              <input
                type="text"
                className="form-input"
                value={formData.codePostal}
                onChange={(e) => handleChange('codePostal', e.target.value)}
                placeholder="Code postal"
              />
            </FormField>
          </div>
        </div>

        {/* Contact Information */}
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-4">Contact</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Téléphone"
              name="tel"
            >
              <input
                type="tel"
                className="form-input"
                value={formData.tel}
                onChange={(e) => handleChange('tel', e.target.value)}
                placeholder="+212 6XX XX XX XX"
              />
            </FormField>

            <FormField
              label="Fax"
              name="fax"
            >
              <input
                type="tel"
                className="form-input"
                value={formData.fax}
                onChange={(e) => handleChange('fax', e.target.value)}
                placeholder="Numéro de fax"
              />
            </FormField>

            <FormField
              label="Email"
              name="email"
              error={errors.email}
            >
              <input
                type="email"
                className="form-input"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="email@entreprise.com"
              />
            </FormField>

            <FormField
              label="Site web"
              name="siteWeb"
            >
              <input
                type="url"
                className="form-input"
                value={formData.siteWeb}
                onChange={(e) => handleChange('siteWeb', e.target.value)}
                placeholder="https://www.entreprise.com"
              />
            </FormField>

            <FormField
              label="Contact principal"
              name="contact_principal"
            >
              <input
                type="text"
                className="form-input"
                value={formData.contact_principal}
                onChange={(e) => handleChange('contact_principal', e.target.value)}
                placeholder="Nom du contact"
              />
            </FormField>

            <FormField
              label="Poste du contact"
              name="poste_contact"
            >
              <input
                type="text"
                className="form-input"
                value={formData.poste_contact}
                onChange={(e) => handleChange('poste_contact', e.target.value)}
                placeholder="Directeur, Manager, etc."
              />
            </FormField>

            <FormField
              label="Téléphone du contact"
              name="telephone_contact"
            >
              <input
                type="tel"
                className="form-input"
                value={formData.telephone_contact}
                onChange={(e) => handleChange('telephone_contact', e.target.value)}
                placeholder="+212 6XX XX XX XX"
              />
            </FormField>

            <FormField
              label="Email du contact"
              name="email_contact"
              error={errors.email_contact}
            >
              <input
                type="email"
                className="form-input"
                value={formData.email_contact}
                onChange={(e) => handleChange('email_contact', e.target.value)}
                placeholder="contact@entreprise.com"
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
            {client ? 'Modifier' : 'Créer'}
          </button>
        </div>
      </form>
    );
  };

  // Client Detail Component
  const ClientDetail = ({ client }) => {
    if (!client) return null;

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-6 text-white">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <Building className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{client.nom_entreprise}</h2>
              <p className="text-blue-100">{client.secteur_activite}</p>
              <p className="text-blue-200 text-sm">{client.ville}</p>
            </div>
          </div>
        </div>

        {/* Details Tabs */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
            {/* Company Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                <Building className="w-5 h-5" />
                <span>Informations générales</span>
              </h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-500">Forme juridique:</span>
                  <p className="text-gray-900">{client.forme_juridique || 'Non spécifiée'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Registre de commerce:</span>
                  <p className="text-gray-900">{client.registre_commerce || 'Non spécifié'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Adresse complète:</span>
                  <p className="text-gray-900">{client.adresse ? `${client.adresse}, ${client.ville} ${client.codePostal}` : 'Non spécifiée'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Site web:</span>
                  {client.siteWeb ? (
                    <a href={client.siteWeb} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                      {client.siteWeb}
                    </a>
                  ) : (
                    <p className="text-gray-900">Non spécifié</p>
                  )}
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Contact</span>
              </h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-500">Contact principal:</span>
                  <p className="text-gray-900">{client.contact_principal || 'Non spécifié'}</p>
                  {client.poste_contact && (
                    <p className="text-sm text-gray-600">{client.poste_contact}</p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900">{formatPhoneNumber(client.tel) || 'Non spécifié'}</span>
                </div>
                {client.telephone_contact && (
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900">{formatPhoneNumber(client.telephone_contact)} (Contact direct)</span>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900">{client.email || 'Non spécifié'}</span>
                </div>
                {client.email_contact && (
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900">{client.email_contact} (Contact direct)</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center space-x-3">
              <Package className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{client.equipmentCount || 0}</p>
                <p className="text-sm text-gray-600">Équipements</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center space-x-3">
              <FileText className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{client.interventionCount || 0}</p>
                <p className="text-sm text-gray-600">Interventions</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center space-x-3">
              <Calendar className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-sm text-gray-900">Créé le</p>
                <p className="text-sm text-gray-600">{formatDate(client.createdAt)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Table columns configuration
  const columns = [
    { 
      key: 'nom_entreprise', 
      header: 'Entreprise',
      render: (value, row) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-sm text-gray-500">{row.secteur_activite}</div>
        </div>
      )
    },
    { 
      key: 'ville', 
      header: 'Localisation',
      render: (value, row) => (
        <div className="flex items-center space-x-1">
          <MapPin className="w-4 h-4 text-gray-400" />
          <span>{value || 'Non spécifiée'}</span>
        </div>
      )
    },
    { 
      key: 'contact_principal', 
      header: 'Contact',
      render: (value, row) => (
        <div>
          <div className="text-gray-900">{value || 'Non spécifié'}</div>
          {row.telephone_contact && (
            <div className="text-sm text-gray-500">{formatPhoneNumber(row.telephone_contact)}</div>
          )}
        </div>
      )
    },
    { 
      key: 'equipmentCount', 
      header: 'Équipements',
      render: (value) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {value || 0}
        </span>
      )
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
    ...(hasPermission('clients:update') ? [{
      icon: Edit,
      label: 'Modifier',
      onClick: (row) => openModal('edit', row),
      className: 'text-yellow-600 hover:text-yellow-800'
    }] : []),
    ...(hasPermission('clients:delete') ? [{
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
          <p className="text-gray-600 mb-4">Impossible de charger les données des clients</p>
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
              <Users className="w-8 h-8 text-blue-600" />
              <span>Gestion des Clients</span>
            </h1>
            <p className="text-gray-600 mt-1">Gérez vos clients et leurs informations</p>
          </div>
          {hasPermission('clients:create') && (
            <button 
              onClick={() => openModal('create')}
              className="btn btn-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nouveau Client
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
              placeholder="Rechercher par nom, secteur, ville..."
              className="w-full"
            />
          </div>
          
          <select 
            className="form-input min-w-[200px]"
            value={filters.secteur_activite || ''}
            onChange={(e) => handleFilterChange('secteur_activite', e.target.value)}
          >
            <option value="">Tous les secteurs</option>
            {clientSectors?.map(sector => (
              <option key={sector} value={sector}>{sector}</option>
            ))}
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
        data={clientsData?.data || []}
        columns={columns}
        loading={isLoading}
        actions={hasPermission('clients:read') ? actions : null}
        emptyMessage="Aucun client trouvé"
        pagination={
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil((clientsData?.total || 0) / pageSize)}
            totalItems={clientsData?.total || 0}
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
            modalType === 'create' ? 'Nouveau Client' :
            modalType === 'edit' ? 'Modifier le Client' :
            modalType === 'detail' ? 'Détails du Client' : ''
          }
          size={modalType === 'detail' ? 'xl' : 'lg'}
        >
          {modalType === 'detail' ? (
            <ClientDetail client={selectedClient} />
          ) : (
            <ClientForm
              client={selectedClient}
              onSubmit={(data) => {
                if (modalType === 'edit') {
                  updateClientMutation.mutate({ id: selectedClient.id, data });
                } else {
                  createClientMutation.mutate(data);
                }
              }}
              loading={createClientMutation.isPending || updateClientMutation.isPending}
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
        message={`Êtes-vous sûr de vouloir supprimer le client "${selectedClient?.nom_entreprise}" ? Cette action est irréversible.`}
        type="danger"
        confirmText="Supprimer"
        loading={deleteClientMutation.isPending}
      />
    </div>
  );
};

export default Clients;