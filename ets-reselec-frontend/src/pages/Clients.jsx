// ets-reselec-frontend/src/pages/Clients.jsx
import React, { useState } from 'react';
import { 
  Users, Plus, Search, Edit, Trash2, Eye, Filter, Building, 
  Phone, Mail, MapPin, AlertCircle, Save, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import SearchInput from '../components/common/SearchInput';
import Pagination from '../components/common/Pagination';
import ConfirmDialog from '../components/common/ConfirmDialog';
import LoadingSpinner from '../components/common/LoadingSpinner';

// Import custom hooks
import {
  useClients,
  useCreateClient,
  useUpdateClient,
  useDeleteClient,
  useClientSectors
} from '../hooks/useClients';

import { formatDate, formatDateTime } from '../utils/dateUtils';
import { formatPhoneNumber } from '../utils/formatUtils';

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
  const { data: clientsData, isLoading } = useClients({ 
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
      
      if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Format d\'email invalide';
      }
      
      if (formData.email_contact && !/\S+@\S+\.\S+/.test(formData.email_contact)) {
        newErrors.email_contact = 'Format d\'email de contact invalide';
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
        setErrors(prev => ({ ...prev, [field]: null }));
      }
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Company Name */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom de l'entreprise *
            </label>
            <input
              type="text"
              required
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.nom_entreprise ? 'border-red-300' : 'border-gray-300'
              }`}
              value={formData.nom_entreprise}
              onChange={(e) => handleChange('nom_entreprise', e.target.value)}
              placeholder="Nom de l'entreprise"
            />
            {errors.nom_entreprise && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.nom_entreprise}
              </p>
            )}
          </div>

          {/* Business Sector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Secteur d'activité
            </label>
            <input
              type="text"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
          </div>

          {/* Legal Form */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Forme juridique
            </label>
            <select
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={formData.forme_juridique}
              onChange={(e) => handleChange('forme_juridique', e.target.value)}
            >
              <option value="">Sélectionner</option>
              <option value="SARL">SARL</option>
              <option value="SA">SA</option>
              <option value="SAS">SAS</option>
              <option value="Entreprise individuelle">Entreprise individuelle</option>
              <option value="Association">Association</option>
              <option value="Autre">Autre</option>
            </select>
          </div>

          {/* Address */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Adresse
            </label>
            <input
              type="text"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={formData.adresse}
              onChange={(e) => handleChange('adresse', e.target.value)}
              placeholder="Adresse complète"
            />
          </div>

          {/* City */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ville
            </label>
            <input
              type="text"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={formData.ville}
              onChange={(e) => handleChange('ville', e.target.value)}
              placeholder="Ville"
            />
          </div>

          {/* Postal Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Code postal
            </label>
            <input
              type="text"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={formData.codePostal}
              onChange={(e) => handleChange('codePostal', e.target.value)}
              placeholder="Code postal"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Téléphone
            </label>
            <input
              type="tel"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={formData.tel}
              onChange={(e) => handleChange('tel', e.target.value)}
              placeholder="+212 6XX XX XX XX"
            />
          </div>

          {/* Fax */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fax
            </label>
            <input
              type="tel"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={formData.fax}
              onChange={(e) => handleChange('fax', e.target.value)}
              placeholder="Fax"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.email ? 'border-red-300' : 'border-gray-300'
              }`}
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="email@exemple.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.email}
              </p>
            )}
          </div>

          {/* Website */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Site web
            </label>
            <input
              type="url"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={formData.siteWeb}
              onChange={(e) => handleChange('siteWeb', e.target.value)}
              placeholder="https://www.exemple.com"
            />
          </div>
        </div>

        {/* Contact Information Section */}
        <div className="border-t pt-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Contact Principal</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Main Contact */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom du contact
              </label>
              <input
                type="text"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={formData.contact_principal}
                onChange={(e) => handleChange('contact_principal', e.target.value)}
                placeholder="Nom du contact principal"
              />
            </div>

            {/* Position */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Poste
              </label>
              <input
                type="text"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={formData.poste_contact}
                onChange={(e) => handleChange('poste_contact', e.target.value)}
                placeholder="Poste du contact"
              />
            </div>

            {/* Contact Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Téléphone contact
              </label>
              <input
                type="tel"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={formData.telephone_contact}
                onChange={(e) => handleChange('telephone_contact', e.target.value)}
                placeholder="Téléphone du contact"
              />
            </div>

            {/* Contact Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email contact
              </label>
              <input
                type="email"
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.email_contact ? 'border-red-300' : 'border-gray-300'
                }`}
                value={formData.email_contact}
                onChange={(e) => handleChange('email_contact', e.target.value)}
                placeholder="Email du contact"
              />
              {errors.email_contact && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.email_contact}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="border-t pt-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Informations Légales</h4>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Registre de commerce
            </label>
            <input
              type="text"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={formData.registre_commerce}
              onChange={(e) => handleChange('registre_commerce', e.target.value)}
              placeholder="Numéro du registre de commerce"
            />
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 pt-6 border-t">
          <button
            type="button"
            onClick={closeModal}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
          >
            <X className="w-4 h-4" />
            <span>Annuler</span>
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
          >
            {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
            <Save className="w-4 h-4" />
            <span>{client ? 'Modifier' : 'Créer'}</span>
          </button>
        </div>
      </form>
    );
  };

  // Client Detail Modal
  const ClientDetailModal = ({ client }) => (
    <div className="space-y-6">
      {/* Company Info */}
      <div className="bg-blue-50 rounded-lg p-6">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
            <Building className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900">{client.nom_entreprise}</h3>
            {client.secteur_activite && (
              <p className="text-blue-600 font-medium">{client.secteur_activite}</p>
            )}
            {client.forme_juridique && (
              <p className="text-gray-600">{client.forme_juridique}</p>
            )}
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Address */}
        {(client.adresse || client.ville || client.codePostal) && (
          <div className="bg-white border rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
              <MapPin className="w-4 h-4 mr-2 text-gray-600" />
              Adresse
            </h4>
            <div className="text-sm text-gray-600 space-y-1">
              {client.adresse && <p>{client.adresse}</p>}
              <p>
                {[client.ville, client.codePostal].filter(Boolean).join(', ')}
              </p>
            </div>
          </div>
        )}

        {/* Contact Details */}
        <div className="bg-white border rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
            <Phone className="w-4 h-4 mr-2 text-gray-600" />
            Contact
          </h4>
          <div className="text-sm text-gray-600 space-y-2">
            {client.tel && (
              <p className="flex items-center">
                <Phone className="w-3 h-3 mr-2" />
                {formatPhoneNumber(client.tel)}
              </p>
            )}
            {client.fax && (
              <p className="flex items-center">
                <Phone className="w-3 h-3 mr-2" />
                Fax: {formatPhoneNumber(client.fax)}
              </p>
            )}
            {client.email && (
              <p className="flex items-center">
                <Mail className="w-3 h-3 mr-2" />
                {client.email}
              </p>
            )}
            {client.siteWeb && (
              <p className="flex items-center">
                <Building className="w-3 h-3 mr-2" />
                <a 
                  href={client.siteWeb} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {client.siteWeb}
                </a>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Principal Contact */}
      {(client.contact_principal || client.telephone_contact || client.email_contact) && (
        <div className="bg-white border rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-3">Contact Principal</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {client.contact_principal && (
              <div>
                <p className="font-medium text-gray-700">Nom</p>
                <p className="text-gray-600">{client.contact_principal}</p>
              </div>
            )}
            {client.poste_contact && (
              <div>
                <p className="font-medium text-gray-700">Poste</p>
                <p className="text-gray-600">{client.poste_contact}</p>
              </div>
            )}
            {client.telephone_contact && (
              <div>
                <p className="font-medium text-gray-700">Téléphone</p>
                <p className="text-gray-600">{formatPhoneNumber(client.telephone_contact)}</p>
              </div>
            )}
            {client.email_contact && (
              <div>
                <p className="font-medium text-gray-700">Email</p>
                <p className="text-gray-600">{client.email_contact}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Legal Information */}
      {client.registre_commerce && (
        <div className="bg-white border rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-3">Informations Légales</h4>
          <div className="text-sm">
            <p className="text-gray-600">
              <span className="font-medium">Registre de commerce:</span> {client.registre_commerce}
            </p>
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-3">Statistiques</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{client.equipmentCount || 0}</p>
            <p className="text-gray-600">Équipements</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{client.interventionCount || 0}</p>
            <p className="text-gray-600">Interventions</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Créé le</p>
            <p className="font-medium">{formatDate(client.createdAt)}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        {hasPermission('clients:update') && (
          <button 
            onClick={() => {
              closeModal();
              openModal('client', client);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700"
          >
            <Edit className="w-4 h-4" />
            <span>Modifier</span>
          </button>
        )}
      </div>
    </div>
  );

  // Table columns
  const columns = [
    { 
      key: 'nom_entreprise', 
      header: 'Entreprise',
      render: (value, row) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          {row.secteur_activite && (
            <div className="text-sm text-gray-500">{row.secteur_activite}</div>
          )}
        </div>
      )
    },
    { 
      key: 'ville', 
      header: 'Ville',
      render: (value) => value || '-'
    },
    { 
      key: 'contact_principal', 
      header: 'Contact',
      render: (value, row) => (
        <div>
          {value && <div className="font-medium">{value}</div>}
          {row.telephone_contact && (
            <div className="text-sm text-gray-500 flex items-center">
              <Phone className="w-3 h-3 mr-1" />
              {formatPhoneNumber(row.telephone_contact)}
            </div>
          )}
          {row.email_contact && (
            <div className="text-sm text-gray-500 flex items-center">
              <Mail className="w-3 h-3 mr-1" />
              {row.email_contact}
            </div>
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
  const actions = hasPermission('clients:read') ? [
    {
      icon: Eye,
      label: 'Voir',
      onClick: (row) => openModal('client-detail', row),
      className: 'text-blue-600 hover:text-blue-800'
    },
    ...(hasPermission('clients:update') ? [{
      icon: Edit,
      label: 'Modifier',
      onClick: (row) => openModal('client', row),
      className: 'text-yellow-600 hover:text-yellow-800'
    }] : []),
    ...(hasPermission('clients:delete') ? [{
      icon: Trash2,
      label: 'Supprimer',
      onClick: (row) => openDeleteDialog(row),
      className: 'text-red-600 hover:text-red-800'
    }] : [])
  ] : null;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
              <Users className="w-6 h-6 text-blue-600" />
              <span>Gestion des Clients</span>
            </h1>
            <p className="text-gray-600 mt-1">
              Gérez les informations de vos clients et suivez leurs équipements
            </p>
          </div>
          {hasPermission('clients:create') && (
            <button 
              onClick={() => openModal('client')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              <span>Nouveau Client</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1">
            <SearchInput
              value={searchQuery}
              onChange={handleSearch}
              placeholder="Rechercher par nom d'entreprise, secteur, ville ou contact..."
              size="default"
            />
          </div>
          <div className="flex space-x-3">
            <select 
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={filters.secteur_activite || ''}
              onChange={(e) => setFilters(prev => ({ 
                ...prev, 
                secteur_activite: e.target.value || undefined 
              }))}
            >
              <option value="">Tous les secteurs</option>
              {clientSectors?.map(sector => (
                <option key={sector} value={sector}>{sector}</option>
              ))}
            </select>
            <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center space-x-2">
              <Filter className="w-4 h-4" />
              <span>Filtres</span>
            </button>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        data={clientsData?.data || []}
        loading={isLoading}
        columns={columns}
        actions={actions}
        emptyMessage="Aucun client trouvé"
        pagination={
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil((clientsData?.total || 0) / pageSize)}
            totalItems={clientsData?.total || 0}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            showPageSizeSelect={true}
            showInfo={true}
          />
        }
      />

      {/* Modal */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={closeModal}
          title={
            modalType === 'client-detail' 
              ? 'Détails du Client' 
              : selectedClient 
                ? 'Modifier le Client' 
                : 'Nouveau Client'
          }
          size={modalType === 'client-detail' ? 'xl' : 'lg'}
        >
          {modalType === 'client-detail' ? (
            <ClientDetailModal client={selectedClient} />
          ) : (
            <ClientForm
              client={selectedClient}
              onSubmit={(data) => {
                if (selectedClient) {
                  updateClientMutation.mutate({ id: selectedClient.id, data }, {
                    onSuccess: closeModal
                  });
                } else {
                  createClientMutation.mutate(data, {
                    onSuccess: closeModal
                  });
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
        message={`Êtes-vous sûr de vouloir supprimer le client "${selectedClient?.nom_entreprise}" ? Cette action est irréversible et supprimera également tous les équipements associés.`}
        type="danger"
        confirmText="Supprimer"
        loading={deleteClientMutation.isPending}
      />
    </div>
  );
};

export default Clients;