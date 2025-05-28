// ets-reselec-frontend/src/pages/Clients.jsx
import React, { useState } from 'react';
import { 
  Users, Plus, Search, Edit, Trash2, Eye, Building, MapPin, 
  Phone, Mail, User, Filter, Download, Upload
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import SearchInput from '../components/common/SearchInput';
import Pagination from '../components/common/Pagination';
import ConfirmDialog from '../components/common/ConfirmDialog';
import FormField from '../components/forms/FormField';
import LoadingSpinner from '../components/common/LoadingSpinner';

import {
  useClients,
  useCreateClient,
  useUpdateClient,
  useDeleteClient,
  useClientSectors
} from '../hooks/useClients';

import { formatDate, formatNumber } from '../utils/formatUtils';

const Clients = () => {
  const { hasPermission } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
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
  
  const { data: sectors } = useClientSectors();

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

      setErrors(newErrors);
      
      if (Object.keys(newErrors).length === 0) {
        onSubmit(formData);
      }
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
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
            <Building className="w-4 h-4 mr-2" />
            Informations de l'entreprise
          </h4>
          
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
                {sectors?.map(sector => (
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
                <option value="EURL">EURL</option>
                <option value="SNC">SNC</option>
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
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
            <MapPin className="w-4 h-4 mr-2" />
            Adresse
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Adresse"
              name="adresse"
              className="md:col-span-2"
            >
              <input
                type="text"
                className="form-input"
                value={formData.adresse}
                onChange={(e) => handleChange('adresse', e.target.value)}
                placeholder="Adresse complète"
              />
            </FormField>

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
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
            <Phone className="w-4 h-4 mr-2" />
            Contact
          </h4>
          
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
                placeholder="+212 XX XX XX XX"
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
                placeholder="+212 XX XX XX XX"
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
                placeholder="contact@entreprise.com"
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
              label="Poste"
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
              label="Téléphone contact"
              name="telephone_contact"
            >
              <input
                type="tel"
                className="form-input"
                value={formData.telephone_contact}
                onChange={(e) => handleChange('telephone_contact', e.target.value)}
                placeholder="+212 XX XX XX XX"
              />
            </FormField>

            <FormField
              label="Email contact"
              name="email_contact"
              error={errors.email_contact}
            >
              <input
                type="email"
                className="form-input"
                value={formData.email_contact}
                onChange={(e) => handleChange('email_contact', e.target.value)}
                placeholder="contact.direct@entreprise.com"
              />
            </FormField>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button
            type="button"
            onClick={closeModal}
            className="btn-secondary"
            disabled={loading}
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>{client ? 'Modification...' : 'Création...'}</span>
              </div>
            ) : (
              <span>{client ? 'Modifier' : 'Créer'}</span>
            )}
          </button>
        </div>
      </form>
    );
  };

  // Client Detail Modal
  const ClientDetailModal = ({ client }) => (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-6 text-white">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <Building className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold">{client.nom_entreprise}</h2>
            <p className="text-blue-100">{client.secteur_activite || 'Secteur non spécifié'}</p>
            {client.forme_juridique && (
              <p className="text-blue-200 text-sm">{client.forme_juridique}</p>
            )}
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
            <Phone className="w-4 h-4 mr-2" />
            Informations de contact
          </h4>
          <div className="space-y-2 text-sm">
            {client.tel && (
              <p><span className="font-medium">Tél:</span> {client.tel}</p>
            )}
            {client.fax && (
              <p><span className="font-medium">Fax:</span> {client.fax}</p>
            )}
            {client.email && (
              <p><span className="font-medium">Email:</span> {client.email}</p>
            )}
            {client.siteWeb && (
              <p><span className="font-medium">Site web:</span> 
                <a href={client.siteWeb} target="_blank" rel="noopener noreferrer" 
                   className="text-blue-600 hover:underline ml-1">
                  {client.siteWeb}
                </a>
              </p>
            )}
          </div>
        </div>

        {/* Address */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
            <MapPin className="w-4 h-4 mr-2" />
            Adresse
          </h4>
          <div className="text-sm">
            {client.adresse && <p>{client.adresse}</p>}
            {(client.ville || client.codePostal) && (
              <p>{client.ville} {client.codePostal}</p>
            )}
          </div>
        </div>

        {/* Contact Person */}
        {client.contact_principal && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
              <User className="w-4 h-4 mr-2" />
              Contact principal
            </h4>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Nom:</span> {client.contact_principal}</p>
              {client.poste_contact && (
                <p><span className="font-medium">Poste:</span> {client.poste_contact}</p>
              )}
              {client.telephone_contact && (
                <p><span className="font-medium">Tél:</span> {client.telephone_contact}</p>
              )}
              {client.email_contact && (
                <p><span className="font-medium">Email:</span> {client.email_contact}</p>
              )}
            </div>
          </div>
        )}

        {/* Legal Info */}
        {(client.registre_commerce || client.forme_juridique) && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3">
              Informations légales
            </h4>
            <div className="space-y-2 text-sm">
              {client.registre_commerce && (
                <p><span className="font-medium">RC:</span> {client.registre_commerce}</p>
              )}
              {client.forme_juridique && (
                <p><span className="font-medium">Forme:</span> {client.forme_juridique}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        {hasPermission('clients:update') && (
          <button 
            onClick={() => {
              closeModal();
              openModal('edit', client);
            }}
            className="btn-secondary"
          >
            <Edit className="w-4 h-4 mr-2" />
            Modifier
          </button>
        )}
        <button onClick={closeModal} className="btn-primary">
          Fermer
        </button>
      </div>
    </div>
  );

  // Main render
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Users className="w-8 h-8 mr-3 text-blue-600" />
              Gestion des Clients
            </h1>
            <p className="text-gray-600 mt-1">
              Gérez vos clients et leurs informations de contact
            </p>
          </div>
          
          <div className="flex space-x-3">
            <button className="btn-secondary">
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </button>
            {hasPermission('clients:create') && (
              <button 
                onClick={() => openModal('create')}
                className="btn-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nouveau Client
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1">
            <SearchInput
              value={searchQuery}
              onChange={handleSearch}
              placeholder="Rechercher par nom, secteur, ville ou contact..."
              size="default"
            />
          </div>
          
          <div className="flex space-x-3">
            <select 
              className="form-input min-w-48"
              value={filters.secteur_activite || ''}
              onChange={(e) => setFilters(prev => ({ 
                ...prev, 
                secteur_activite: e.target.value || undefined 
              }))}
            >
              <option value="">Tous les secteurs</option>
              {sectors?.map(sector => (
                <option key={sector} value={sector}>{sector}</option>
              ))}
            </select>
            
            <button className="btn-secondary">
              <Filter className="w-4 h-4 mr-2" />
              Filtres
            </button>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        data={clientsData?.data || []}
        loading={isLoading}
        columns={[
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
            header: 'Localisation',
            render: (value, row) => (
              <div className="text-sm">
                {value && <div>{value}</div>}
                {row.adresse && (
                  <div className="text-gray-500 truncate max-w-32" title={row.adresse}>
                    {row.adresse}
                  </div>
                )}
              </div>
            )
          },
          { 
            key: 'contact_principal', 
            header: 'Contact',
            render: (value, row) => (
              <div className="text-sm">
                {value && <div className="font-medium">{value}</div>}
                {row.telephone_contact && (
                  <div className="text-gray-500">{row.telephone_contact}</div>
                )}
                {row.email_contact && (
                  <div className="text-gray-500">{row.email_contact}</div>
                )}
              </div>
            )
          },
          { 
            key: 'equipmentCount', 
            header: 'Équipements',
            render: (value) => (
              <span className="badge badge-primary">
                {formatNumber(value || 0)}
              </span>
            )
          },
          { 
            key: 'creerPar', 
            header: 'Créé par',
            render: (value) => value?.nom || 'N/A'
          }
        ]}
        actions={hasPermission('clients:read') ? [
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
        ] : null}
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

      {/* Modals */}
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
            <ClientDetailModal client={selectedClient} />
          ) : (
            <ClientForm
              client={modalType === 'edit' ? selectedClient : null}
              onSubmit={(data) => {
                if (modalType === 'edit') {
                  updateClientMutation.mutate(
                    { id: selectedClient.id, data },
                    { onSuccess: closeModal }
                  );
                } else {
                  createClientMutation.mutate(data, { onSuccess: closeModal });
                }
              }}
              loading={createClientMutation.isPending || updateClientMutation.isPending}
            />
          )}
        </Modal>
      )}

      {/* Delete Confirmation */}
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