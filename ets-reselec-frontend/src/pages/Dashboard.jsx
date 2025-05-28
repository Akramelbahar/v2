import React, { useState, useEffect } from 'react';
import { 
  Users, Settings, Wrench, FileText, AlertCircle, CheckCircle, Clock, 
  Pause, X, Plus, Search, Edit, Trash2, Eye, Play, ArrowRight, Upload, 
  Download, FileCheck, Filter, Calendar, Building, Package, TrendingUp,
  Activity, Bell, RefreshCw, MoreVertical, ExternalLink, Save, Loader
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/common/StatusBadge';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import SearchInput from '../components/common/SearchInput';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Pagination from '../components/common/Pagination';
import ConfirmDialog from '../components/common/ConfirmDialog';
import FormField from '../components/forms/FormField';
import Select from '../components/forms/Select';

// Import custom hooks
import {
  useDashboardStats,
  useRecentInterventions,
  useDashboardAlerts
} from '../hooks/useDashboard';
import {
  useClients,
  useCreateClient,
  useUpdateClient,
  useDeleteClient,
  useClientSectors
} from '../hooks/useClients';
import {
  useEquipment,
  useCreateEquipment,
  useUpdateEquipment,
  useDeleteEquipment,
  useEquipmentTypes
} from '../hooks/useEquipment';
import {
  useInterventions,
  useCreateIntervention,
  useUpdateInterventionStatus,
  useInterventionWorkflow,
  useUpdateIntervention // Add this line here at the top
} from '../hooks/useInterventions';

import { formatDate, formatDateTime, formatDateTimeShort, isToday, isThisWeek } from '../utils/dateUtils';
import { formatCurrency, formatNumber, truncateText } from '../utils/formatUtils';
const StatCard = ({ title, value, icon: Icon, color, trend, loading = false }) => (
  <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
    {loading ? (
      <div className="animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 bg-gray-300 rounded w-20"></div>
          <div className="w-8 h-8 bg-gray-300 rounded"></div>
        </div>
        <div className="h-8 bg-gray-300 rounded w-16"></div>
      </div>
    ) : (
      <>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-3xl font-bold text-gray-900">{formatNumber(value)}</p>
            {trend && (
              <div className={`flex items-center mt-1 text-sm ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
                <TrendingUp className={`w-4 h-4 mr-1 ${trend.positive ? '' : 'rotate-180'}`} />
                <span>{trend.value}%</span>
              </div>
            )}
          </div>
          <Icon className={`w-8 h-8 ${color}`} />
        </div>
      </>
    )}
  </div>
);

const Dashboard = () => {
  const { user, hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState({});
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Dashboard data
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: recentInterventions, isLoading: interventionsLoading } = useRecentInterventions();
  const { data: alerts } = useDashboardAlerts();

  // Data queries based on active tab
  // Replace the existing data queries in Dashboard.jsx

// Data queries based on active tab
const clientsQuery = useClients({ 
  page: currentPage, 
  limit: pageSize, 
  search: searchQuery,
  ...filters 
});

const equipmentQuery = useEquipment({ 
  page: currentPage, 
  limit: pageSize, 
  search: searchQuery,
  ...filters 
});

const interventionsQuery = useInterventions({ 
  page: currentPage, 
  limit: pageSize, 
  search: searchQuery,
  ...filters 
});

// ADD THESE NEW QUERIES for dropdown options

// ADD THESE NEW QUERIES for dropdown options
const allClientsQuery = useClients({ page: 1, limit: 1000 }); // Get all clients for dropdowns
const allEquipmentQuery = useEquipment({ page: 1, limit: 1000 }); // Get all equipment for dropdowns

// Extract data for easier access
const allClients = allClientsQuery.data?.data || allClientsQuery.data || [];
const allEquipment = allEquipmentQuery.data?.data || allEquipmentQuery.data || [];
  // Mutations
  const createClientMutation = useCreateClient();
  const updateClientMutation = useUpdateClient();
  const deleteClientMutation = useDeleteClient();
  
  const createEquipmentMutation = useCreateEquipment();
  const updateEquipmentMutation = useUpdateEquipment();
  const deleteEquipmentMutation = useDeleteEquipment();
  
  const createInterventionMutation = useCreateIntervention();
  const updateStatusMutation = useUpdateInterventionStatus();

  // Helper queries
  const { data: equipmentTypes } = useEquipmentTypes();
  const { data: clientSectors } = useClientSectors();

  // Handlers
  const openModal = (type, item = null) => {
    setModalType(type);
    setSelectedItem(item);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedItem(null);
    setModalType('');
  };

  const openDeleteDialog = (item) => {
    setSelectedItem(item);
    setShowDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    
    try {
      if (activeTab === 'clients') {
        await deleteClientMutation.mutateAsync(selectedItem.id);
      } else if (activeTab === 'equipment') {
        await deleteEquipmentMutation.mutateAsync(selectedItem.id);
      }
      setShowDeleteDialog(false);
      setSelectedItem(null);
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

  // Enhanced Form Components with Dynamic Data Loading
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
      
      // Validation
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

      setErrors({});
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
            error={errors.secteur_activite}
          >
            <Select
              value={formData.secteur_activite ? { value: formData.secteur_activite, label: formData.secteur_activite } : null}
              onChange={(option) => handleChange('secteur_activite', option?.value || '')}
              options={[
                ...(clientSectors?.map(sector => ({ value: sector, label: sector })) || []),
                { value: 'Industrie Manufacturière', label: 'Industrie Manufacturière' },
                { value: 'Textile', label: 'Textile' },
                { value: 'Agro-alimentaire', label: 'Agro-alimentaire' },
                { value: 'Automobile', label: 'Automobile' },
                { value: 'Construction', label: 'Construction' },
                { value: 'Énergie', label: 'Énergie' },
                { value: 'Chimie', label: 'Chimie' },
                { value: 'Autres', label: 'Autres' }
              ]}
              placeholder="Sélectionner un secteur"
              searchable
            />
          </FormField>

          <FormField
            label="Adresse"
            name="adresse"
            error={errors.adresse}
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
            error={errors.ville}
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
            error={errors.codePostal}
          >
            <input
              type="text"
              className="form-input"
              value={formData.codePostal}
              onChange={(e) => handleChange('codePostal', e.target.value)}
              placeholder="Code postal"
            />
          </FormField>

          <FormField
            label="Téléphone"
            name="tel"
            error={errors.tel}
          >
            <input
              type="tel"
              className="form-input"
              value={formData.tel}
              onChange={(e) => handleChange('tel', e.target.value)}
              placeholder="+212 5XX XX XX XX"
            />
          </FormField>

          <FormField
            label="Fax"
            name="fax"
            error={errors.fax}
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
            error={errors.siteWeb}
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
            error={errors.contact_principal}
          >
            <input
              type="text"
              className="form-input"
              value={formData.contact_principal}
              onChange={(e) => handleChange('contact_principal', e.target.value)}
              placeholder="Nom du contact principal"
            />
          </FormField>

          <FormField
            label="Poste du contact"
            name="poste_contact"
            error={errors.poste_contact}
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
            error={errors.telephone_contact}
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

          <FormField
            label="Registre de commerce"
            name="registre_commerce"
            error={errors.registre_commerce}
          >
            <input
              type="text"
              className="form-input"
              value={formData.registre_commerce}
              onChange={(e) => handleChange('registre_commerce', e.target.value)}
              placeholder="Numéro RC"
            />
          </FormField>

          <FormField
            label="Forme juridique"
            name="forme_juridique"
            error={errors.forme_juridique}
          >
            <Select
              value={formData.forme_juridique ? { value: formData.forme_juridique, label: formData.forme_juridique } : null}
              onChange={(option) => handleChange('forme_juridique', option?.value || '')}
              options={[
                { value: 'SA', label: 'Société Anonyme (SA)' },
                { value: 'SARL', label: 'Société à Responsabilité Limitée (SARL)' },
                { value: 'SNC', label: 'Société en Nom Collectif (SNC)' },
                { value: 'SCS', label: 'Société en Commandite Simple (SCS)' },
                { value: 'SCA', label: 'Société en Commandite par Actions (SCA)' },
                { value: 'Entreprise Individuelle', label: 'Entreprise Individuelle' },
                { value: 'Autres', label: 'Autres' }
              ]}
              placeholder="Sélectionner une forme juridique"
            />
          </FormField>
        </div>
        
        <div className="flex justify-end space-x-3 pt-6 border-t">
          <button
            type="button"
            onClick={closeModal}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
          >
            {loading && <Loader className="w-4 h-4 animate-spin" />}
            <Save className="w-4 h-4" />
            <span>{client ? 'Modifier' : 'Créer'}</span>
          </button>
        </div>
      </form>
    );
  };

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
  
    const handleSubmit = (e) => {
      e.preventDefault();
      onSubmit(formData);
    };
  
    const handleChange = (field, value) => {
      setFormData(prev => ({ ...prev, [field]: value }));
    };
  
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom de l'équipement *
            </label>
            <input
              type="text"
              required
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              value={formData.nom}
              onChange={(e) => handleChange('nom', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type d'équipement
            </label>
            <select
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              value={formData.type_equipement}
              onChange={(e) => handleChange('type_equipement', e.target.value)}
            >
              <option value="">Sélectionner un type</option>
              {equipmentTypes?.map(type => (
                <option key={type} value={type}>
                  {type.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Marque
            </label>
            <input
              type="text"
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              value={formData.marque}
              onChange={(e) => handleChange('marque', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Modèle
            </label>
            <input
              type="text"
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              value={formData.modele}
              onChange={(e) => handleChange('modele', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Coût
            </label>
            <input
              type="number"
              step="0.01"
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              value={formData.cout}
              onChange={(e) => handleChange('cout', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Propriétaire *
            </label>
            <select
              required
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              value={formData.proprietaire_id}
              onChange={(e) => handleChange('proprietaire_id', e.target.value)}
            >
              <option value="">Sélectionner un client</option>
              {/* FIX: Use allClients data with proper access */}
              {(allClients?.data || allClients)?.map(client => (
                <option key={client.id} value={client.id}>
                  {client.nom_entreprise}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="flex justify-end space-x-2 pt-4">
          <button
            type="button"
            onClick={closeModal}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
          >
            {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
            <span>{equipment ? 'Modifier' : 'Créer'}</span>
          </button>
        </div>
      </form>
    );
  };

  const InterventionForm = ({ intervention, onSubmit, loading }) => {
    const [formData, setFormData] = useState({
      equipement_id: intervention?.equipement_id || '',
      date: intervention?.date || new Date().toISOString().split('T')[0],
      description: intervention?.description || '',
      urgence: intervention?.urgence || false,
      statut: intervention?.statut || 'PLANIFIEE'
    });
  
    // Get equipment data for the dropdown
    const { data: equipmentData } = useEquipment({ limit: 1000 }); // Get all equipment
  
    const handleSubmit = (e) => {
      e.preventDefault();
      onSubmit(formData);
    };
  
    const handleChange = (field, value) => {
      setFormData(prev => ({ ...prev, [field]: value }));
    };
  
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Équipement *
          </label>
          <select
            required
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            value={formData.equipement_id}
            onChange={(e) => handleChange('equipement_id', e.target.value)}
          >
            <option value="">Sélectionner un équipement</option>
            {equipmentData?.data?.map(eq => (
              <option key={eq.id} value={eq.id}>
                {eq.nom} - {eq.proprietaire?.nom_entreprise}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date *
          </label>
          <input
            type="date"
            required
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            value={formData.date}
            onChange={(e) => handleChange('date', e.target.value)}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            rows={3}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Décrivez l'intervention..."
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Statut
          </label>
          <select
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            value={formData.statut}
            onChange={(e) => handleChange('statut', e.target.value)}
          >
            <option value="PLANIFIEE">Planifiée</option>
            <option value="EN_ATTENTE_PDR">En Attente PDR</option>
            <option value="EN_COURS">En Cours</option>
            <option value="TERMINEE">Terminée</option>
          </select>
        </div>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="urgence"
            className="mr-2"
            checked={formData.urgence}
            onChange={(e) => handleChange('urgence', e.target.checked)}
          />
          <label htmlFor="urgence" className="text-sm font-medium text-gray-700">
            Intervention urgente
          </label>
        </div>
        
        <div className="flex justify-end space-x-2 pt-4">
          <button
            type="button"
            onClick={closeModal}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
          >
            {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
            <span>{intervention ? 'Modifier' : 'Créer'}</span>
          </button>
        </div>
      </form>
    );
  };

  // Helper function for status labels
  const getStatusLabel = (status) => {
    const labels = {
      'PLANIFIEE': 'Planifiée',
      'EN_ATTENTE_PDR': 'En Attente PDR',
      'EN_COURS': 'En Cours',
      'EN_PAUSE': 'En Pause',
      'TERMINEE': 'Terminée',
      'ANNULEE': 'Annulée',
      'ECHEC': 'Échec'
    };
    return labels[status] || status;
  };

  // Enhanced Detail Modal Components
  const ClientDetailModal = ({ client }) => {
    if (!client) return <LoadingSpinner />;

    return (
      <div className="space-y-6">
        {/* Client Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-6 text-white">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <Building className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{client.nom_entreprise}</h2>
              <p className="text-blue-100">{client.secteur_activite || 'Secteur non spécifié'}</p>
              <p className="text-blue-200 text-sm">{client.ville || 'Ville non spécifiée'}</p>
            </div>
          </div>
        </div>

        {/* Client Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Contact Information */}
          <div className="bg-white border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Informations de Contact</span>
            </h3>
            <div className="space-y-3">
              {client.contact_principal && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Contact Principal:</label>
                  <p className="text-sm text-gray-900">{client.contact_principal}</p>
                  {client.poste_contact && (
                    <p className="text-xs text-gray-500">{client.poste_contact}</p>
                  )}
                </div>
              )}
              {client.telephone_contact && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Téléphone:</label>
                  <p className="text-sm text-gray-900">{client.telephone_contact}</p>
                </div>
              )}
              {client.email_contact && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Email:</label>
                  <p className="text-sm text-gray-900">
                    <a href={`mailto:${client.email_contact}`} className="text-blue-600 hover:text-blue-800">
                      {client.email_contact}
                    </a>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Company Information */}
          <div className="bg-white border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <Building className="w-5 h-5" />
              <span>Informations Entreprise</span>
            </h3>
            <div className="space-y-3">
              {client.adresse && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Adresse:</label>
                  <p className="text-sm text-gray-900">{client.adresse}</p>
                </div>
              )}
              {client.tel && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Téléphone:</label>
                  <p className="text-sm text-gray-900">{client.tel}</p>
                </div>
              )}
              {client.email && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Email:</label>
                  <p className="text-sm text-gray-900">
                    <a href={`mailto:${client.email}`} className="text-blue-600 hover:text-blue-800">
                      {client.email}
                    </a>
                  </p>
                </div>
              )}
              {client.siteWeb && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Site Web:</label>
                  <p className="text-sm text-gray-900">
                    <a href={client.siteWeb} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 flex items-center space-x-1">
                      <span>{client.siteWeb}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Legal Information */}
        {(client.registre_commerce || client.forme_juridique) && (
          <div className="bg-gray-50 border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations Légales</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {client.registre_commerce && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Registre de Commerce:</label>
                  <p className="text-sm text-gray-900">{client.registre_commerce}</p>
                </div>
              )}
              {client.forme_juridique && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Forme Juridique:</label>
                  <p className="text-sm text-gray-900">{client.forme_juridique}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Statistics */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistiques</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{client.equipmentCount || 0}</div>
              <div className="text-sm text-gray-600">Équipements</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{client.interventionCount || 0}</div>
              <div className="text-sm text-gray-600">Interventions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {client.creerPar ? formatDate(client.createdAt) : 'N/A'}
              </div>
              <div className="text-sm text-gray-600">Créé le</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {client.creerPar?.nom || 'N/A'}
              </div>
              <div className="text-sm text-gray-600">Créé par</div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button 
            onClick={() => {
              closeModal();
              openModal('client', client);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors"
          >
            <Edit className="w-4 h-4" />
            <span>Modifier</span>
          </button>
        </div>
      </div>
    );
  };

  const EquipmentDetailModal = ({ equipment }) => {
    if (!equipment) return <LoadingSpinner />;

    return (
      <div className="space-y-6">
        {/* Equipment Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-800 rounded-lg p-6 text-white">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <Package className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{equipment.nom}</h2>
              <p className="text-green-100">{equipment.type_equipement?.replace('_', ' ') || 'Type non spécifié'}</p>
              <p className="text-green-200 text-sm">
                {equipment.marque && equipment.modele ? `${equipment.marque} ${equipment.modele}` : equipment.marque || equipment.modele || 'Marque/Modèle non spécifié'}
              </p>
            </div>
          </div>
        </div>

        {/* Equipment Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Technical Details */}
          <div className="bg-white border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <Settings className="w-5 h-5" />
              <span>Détails Techniques</span>
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Type d'équipement:</label>
                <p className="text-sm text-gray-900">{equipment.type_equipement?.replace('_', ' ') || 'Non spécifié'}</p>
              </div>
              {equipment.marque && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Marque:</label>
                  <p className="text-sm text-gray-900">{equipment.marque}</p>
                </div>
              )}
              {equipment.modele && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Modèle:</label>
                  <p className="text-sm text-gray-900">{equipment.modele}</p>
                </div>
              )}
              {equipment.etatDeReception && (
                <div>
                  <label className="text-sm font-medium text-gray-700">État de réception:</label>
                  <p className="text-sm text-gray-900">{equipment.etatDeReception}</p>
                </div>
              )}
            </div>
          </div>

          {/* Owner Information */}
          <div className="bg-white border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <Building className="w-5 h-5" />
              <span>Propriétaire</span>
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Entreprise:</label>
                <p className="text-sm text-gray-900">{equipment.proprietaire?.nom_entreprise || 'Non spécifié'}</p>
              </div>
              {equipment.proprietaire?.ville && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Ville:</label>
                  <p className="text-sm text-gray-900">{equipment.proprietaire.ville}</p>
                </div>
              )}
              {equipment.proprietaire?.contact_principal && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Contact:</label>
                  <p className="text-sm text-gray-900">{equipment.proprietaire.contact_principal}</p>
                </div>
              )}
              {equipment.proprietaire?.telephone_contact && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Téléphone:</label>
                  <p className="text-sm text-gray-900">{equipment.proprietaire.telephone_contact}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Financial Information */}
        {(equipment.valeur || equipment.cout) && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations Financières</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {equipment.valeur && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Valeur estimée:</label>
                  <p className="text-sm text-gray-900">{equipment.valeur}</p>
                </div>
              )}
              {equipment.cout && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Coût précis:</label>
                  <p className="text-sm text-gray-900 font-semibold">{formatCurrency(equipment.cout)}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Maintenance Statistics */}
        {equipment.maintenanceStats && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Historique de Maintenance</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {equipment.maintenanceStats.totalInterventions || 0}
                </div>
                <div className="text-sm text-gray-600">Total Interventions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {equipment.maintenanceStats.completedInterventions || 0}
                </div>
                <div className="text-sm text-gray-600">Terminées</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {equipment.maintenanceStats.urgentInterventions || 0}
                </div>
                <div className="text-sm text-gray-600">Urgentes</div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Interventions */}
        {equipment.interventions && equipment.interventions.length > 0 && (
          <div className="bg-white border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Interventions Récentes</h3>
            <div className="space-y-3">
              {equipment.interventions.slice(0, 5).map((intervention) => (
                <div key={intervention.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-sm text-gray-900">
                      {truncateText(intervention.description, 50)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDate(intervention.date)} - {intervention.creerPar?.nom || 'N/A'}
                    </div>
                  </div>
                  <StatusBadge status={intervention.statut} urgence={intervention.urgence} size="small" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button 
            onClick={() => {
              closeModal();
              openModal('equipment', equipment);
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2 transition-colors"
          >
            <Edit className="w-4 h-4" />
            <span>Modifier</span>
          </button>
          <button 
            onClick={() => {
              closeModal();
              openModal('intervention', { equipement_id: equipment.id });
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle Intervention</span>
          </button>
        </div>
      </div>
    );
  };

  // Intervention Detail Modal
  const InterventionDetailModal = ({ intervention }) => {
    const { data: workflow, isLoading: workflowLoading } = useInterventionWorkflow(intervention?.id);

    if (workflowLoading) {
      return <LoadingSpinner />;
    }

    return (
      <div className="space-y-6">
        {/* Intervention Header */}
        <div className={`bg-gradient-to-r rounded-lg p-6 text-white ${
          intervention.urgence 
            ? 'from-red-600 to-red-800' 
            : 'from-blue-600 to-blue-800'
        }`}>
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <Wrench className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{intervention.equipement?.nom || 'Équipement'}</h2>
              <p className={intervention.urgence ? 'text-red-100' : 'text-blue-100'}>
                {intervention.equipement?.proprietaire?.nom_entreprise || 'Client non spécifié'}
              </p>
              <div className="flex items-center space-x-2 mt-2">
                <StatusBadge status={intervention.statut} urgence={intervention.urgence} />
              </div>
            </div>
          </div>
        </div>

        {/* Intervention Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-lg mb-3 flex items-center space-x-2">
            <Wrench className="w-5 h-5" />
            <span>Informations de l'Intervention</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-700">Date d'intervention:</p>
              <p className="text-sm text-gray-900">{formatDate(intervention.date)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Créé par:</p>
              <p className="text-sm text-gray-900">{intervention.creerPar?.nom || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Type d'équipement:</p>
              <p className="text-sm text-gray-900">
                {intervention.equipement?.type_equipement?.replace('_', ' ') || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Marque/Modèle:</p>
              <p className="text-sm text-gray-900">
                {intervention.equipement?.marque && intervention.equipement?.modele 
                  ? `${intervention.equipement.marque} ${intervention.equipement.modele}`
                  : intervention.equipement?.marque || intervention.equipement?.modele || 'N/A'
                }
              </p>
            </div>
            {intervention.description && (
              <div className="md:col-span-2">
                <p className="text-sm font-medium text-gray-700">Description:</p>
                <p className="text-sm text-gray-900 bg-white p-3 rounded border">
                  {intervention.description}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Workflow Progress */}
        {workflow && (
          <div className="bg-white border rounded-lg p-4">
            <h4 className="font-semibold text-lg mb-4">Progression du Workflow</h4>
            <div className="flex items-center justify-between mb-4">
              {Object.entries(workflow.phases || {}).map(([phase, data], index) => {
                const isCompleted = data.completed;
                const isActive = !isCompleted && index === Object.values(workflow.phases).findIndex(p => !p.completed);
                
                return (
                  <React.Fragment key={phase}>
                    <div className="flex flex-col items-center space-y-2">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isCompleted ? 'bg-green-500 text-white' : 
                        isActive ? 'bg-blue-500 text-white' : 
                        'bg-gray-300 text-gray-600'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : (
                          <div className="w-3 h-3 rounded-full bg-current"></div>
                        )}
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-sm capitalize">
                          {phase.replace(/([A-Z])/g, ' $1').trim()}
                        </div>
                        <div className={`text-xs ${
                          isCompleted ? 'text-green-600' : 
                          isActive ? 'text-blue-600' : 
                          'text-gray-500'
                        }`}>
                          {isCompleted ? 'Terminé' : isActive ? 'En cours' : 'En attente'}
                        </div>
                      </div>
                    </div>
                    {index < Object.keys(workflow.phases).length - 1 && (
                      <div className={`flex-1 h-0.5 mx-4 ${
                        isCompleted ? 'bg-green-500' : 'bg-gray-300'
                      }`}></div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Next Actions */}
            {workflow.nextActions && workflow.nextActions.length > 0 && (
              <div className="bg-blue-50 rounded-lg p-4 mt-4">
                <h5 className="font-medium text-blue-900 mb-2">Prochaines Actions:</h5>
                <ul className="space-y-1">
                  {workflow.nextActions.map((action, index) => (
                    <li key={index} className="text-sm text-blue-800 flex items-center space-x-2">
                      <ArrowRight className="w-3 h-3" />
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="font-semibold text-lg mb-3">Actions Disponibles</h4>
          <div className="flex flex-wrap gap-3">
            {hasPermission('interventions:update') && (
              <button 
                onClick={() => {
                  closeModal();
                  openModal('intervention', intervention);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
              >
                <Edit className="w-4 h-4" />
                <span>Modifier</span>
              </button>
            )}
            
            {/* Status update buttons */}
            {intervention.statut !== 'TERMINEE' && intervention.statut !== 'ANNULEE' && (
              <>
                {intervention.statut === 'PLANIFIEE' && (
                  <button 
                    onClick={() => updateStatusMutation.mutate({ id: intervention.id, status: 'EN_COURS' })}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-700 transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    <span>Démarrer</span>
                  </button>
                )}
                
                {intervention.statut === 'EN_COURS' && (
                  <>
                    <button 
                      onClick={() => updateStatusMutation.mutate({ id: intervention.id, status: 'EN_PAUSE' })}
                      className="bg-yellow-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-yellow-700 transition-colors"
                    >
                      <Pause className="w-4 h-4" />
                      <span>Mettre en Pause</span>
                    </button>
                    <button 
                      onClick={() => updateStatusMutation.mutate({ id: intervention.id, status: 'TERMINEE' })}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-700 transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Terminer</span>
                    </button>
                  </>
                )}
                
                {intervention.statut === 'EN_PAUSE' && (
                  <button 
                    onClick={() => updateStatusMutation.mutate({ id: intervention.id, status: 'EN_COURS' })}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    <span>Reprendre</span>
                  </button>
                )}
              </>
            )}

            <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-gray-100 transition-colors">
              <Download className="w-4 h-4" />
              <span>Télécharger Rapport</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Main render function continues...
  // [Content continues in the next part...]
  // Tab content renderers with enhanced functionality
  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Interventions" 
          value={stats?.overview?.totalInterventions || 0} 
          icon={Wrench} 
          color="text-blue-600"
          loading={statsLoading}
          trend={{ positive: true, value: 12 }}
        />
        <StatCard 
          title="En Cours" 
          value={stats?.overview?.activeInterventions || 0} 
          icon={Clock} 
          color="text-orange-600"
          loading={statsLoading}
        />
        <StatCard 
          title="Équipements" 
          value={stats?.overview?.totalEquipment || 0} 
          icon={Settings} 
          color="text-green-600"
          loading={statsLoading}
        />
        <StatCard 
          title="Clients" 
          value={stats?.overview?.totalClients || 0} 
          icon={Users} 
          color="text-purple-600"
          loading={statsLoading}
        />
      </div>

      {/* Alerts Section */}
      {alerts && (alerts.urgent?.length > 0 || alerts.overdue?.length > 0) && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold flex items-center space-x-2">
              <Bell className="w-5 h-5 text-red-600" />
              <span>Alertes Importantes</span>
              <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                {(alerts.urgent?.length || 0) + (alerts.overdue?.length || 0)}
              </span>
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {alerts.urgent?.map(alert => (
                <div key={alert.id} className="bg-red-50 border border-red-200 rounded-lg p-4 hover:bg-red-100 transition-colors cursor-pointer">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-red-900">{alert.title}</h4>
                      <p className="text-sm text-red-700 mt-1">{alert.description}</p>
                      <p className="text-xs text-red-600 mt-2">{alert.date}</p>
                    </div>
                  </div>
                </div>
              ))}
              {alerts.overdue?.map(alert => (
                <div key={alert.id} className="bg-orange-50 border border-orange-200 rounded-lg p-4 hover:bg-orange-100 transition-colors cursor-pointer">
                  <div className="flex items-start space-x-3">
                    <Clock className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-orange-900">{alert.title}</h4>
                      <p className="text-sm text-orange-700 mt-1">{alert.description}</p>
                      <p className="text-xs text-orange-600 mt-2">{alert.date}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recent Interventions */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Interventions Récentes</h2>
            <div className="flex space-x-2">
              <button 
                onClick={() => setActiveTab('interventions')}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center space-x-1"
              >
                <span>Voir tout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              {hasPermission('interventions:create') && (
                <button 
                  onClick={() => openModal('intervention')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nouvelle Intervention</span>
                </button>
              )}
            </div>
          </div>
        </div>
        
        <DataTable
          data={recentInterventions || []}
          loading={interventionsLoading}
          columns={[
            { 
              key: 'equipement', 
              header: 'Équipement',
              render: (value, row) => (
                <div>
                  <div className="font-medium text-gray-900">{value?.nom || 'N/A'}</div>
                  <div className="text-sm text-gray-500">{value?.proprietaire?.nom_entreprise || 'N/A'}</div>
                </div>
              )
            },
            { 
              key: 'description', 
              header: 'Description',
              render: (value) => (
                <div className="max-w-xs">
                  <p className="text-sm text-gray-900 truncate" title={value}>
                    {truncateText(value, 50) || 'Aucune description'}
                  </p>
                </div>
              )
            },
            { 
              key: 'statut', 
              header: 'Statut',
              render: (value, row) => <StatusBadge status={value} urgence={row.urgence} />
            },
            { 
              key: 'date', 
              header: 'Date',
              render: (value) => (
                <div>
                  <div className="text-sm text-gray-900">{formatDate(value)}</div>
                  <div className="text-xs text-gray-500">{formatDateTimeShort(value)}</div>
                </div>
              )
            },
            { 
              key: 'creerPar', 
              header: 'Créé par',
              render: (value) => (
                <div className="text-sm text-gray-900">
                  {value?.nom || 'N/A'}
                </div>
              )
            }
          ]}
          actions={[
            {
              icon: Eye,
              label: 'Voir',
              onClick: (row) => openModal('intervention-detail', row),
              className: 'text-blue-600 hover:text-blue-800'
            },
            ...(hasPermission('interventions:update') ? [{
              icon: Edit,
              label: 'Modifier',
              onClick: (row) => openModal('intervention', row),
              className: 'text-yellow-600 hover:text-yellow-800'
            }] : [])
          ]}
          emptyMessage="Aucune intervention récente"
        />
      </div>

      {/* Quick Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Taux de Completion</h3>
          <div className="flex items-center justify-between">
            <div className="text-3xl font-bold text-green-600">
              {stats?.overview?.completionRate || 0}%
            </div>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            {stats?.overview?.completedInterventions || 0} interventions terminées
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Interventions Urgentes</h3>
          <div className="flex items-center justify-between">
            <div className="text-3xl font-bold text-red-600">
              {stats?.alerts?.urgentInterventions || 0}
            </div>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            Nécessitent une attention immédiate
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">En Retard</h3>
          <div className="flex items-center justify-between">
            <div className="text-3xl font-bold text-orange-600">
              {stats?.alerts?.overdueInterventions || 0}
            </div>
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            Interventions en retard
          </div>
        </div>
      </div>
    </div>
  );

  const renderClients = () => {
    const { data: clientsData, isLoading } = clientsQuery;
    
    // FIX: Handle both paginated and direct data structures
    const clients = clientsData?.data || clientsData || [];
    const total = clientsData?.total || clientsData?.pagination?.total || clients.length;
    
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Gestion des Clients</h2>
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
          
          <div className="flex space-x-4 mb-4">
            <div className="flex-1">
              <SearchInput
                value={searchQuery}
                onChange={handleSearch}
                placeholder="Rechercher un client..."
              />
            </div>
            <select 
              className="px-4 py-2 border rounded-lg"
              value={filters.secteur_activite || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, secteur_activite: e.target.value || undefined }))}
            >
              <option value="">Tous les secteurs</option>
              {clientSectors?.map(sector => (
                <option key={sector} value={sector}>{sector}</option>
              ))}
            </select>
          </div>
        </div>
  
        <DataTable
          data={clients}
          loading={isLoading}
          columns={[
            { key: 'nom_entreprise', header: 'Entreprise' },
            { key: 'secteur_activite', header: 'Secteur' },
            { key: 'ville', header: 'Ville' },
            { 
              key: 'equipmentCount', 
              header: 'Équipements',
              render: (value) => formatNumber(value || 0)
            },
            { key: 'contact_principal', header: 'Contact' }
          ]}
          actions={hasPermission('clients:read') ? [
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
          ] : null}
          pagination={
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(total / pageSize)}
              totalItems={total}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          }
        />
      </div>
    );
  };
  
  const renderEquipment = () => {
    const { data: equipmentData, isLoading } = equipmentQuery;
    
    // FIX: Handle both paginated and direct data structures
    const equipment = equipmentData?.data || equipmentData || [];
    const total = equipmentData?.total || equipmentData?.pagination?.total || equipment.length;
    
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Gestion des Équipements</h2>
            {hasPermission('equipment:create') && (
              <button 
                onClick={() => openModal('equipment')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                <span>Nouvel Équipement</span>
              </button>
            )}
          </div>
          
          <div className="flex space-x-4 mb-4">
            <div className="flex-1">
              <SearchInput
                value={searchQuery}
                onChange={handleSearch}
                placeholder="Rechercher un équipement..."
              />
            </div>
            <select 
              className="px-4 py-2 border rounded-lg"
              value={filters.type_equipement || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, type_equipement: e.target.value || undefined }))}
            >
              <option value="">Tous les types</option>
              {equipmentTypes?.map(type => (
                <option key={type} value={type}>{type.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
        </div>
  
        <DataTable
          data={equipment}
          loading={isLoading}
          columns={[
            { key: 'nom', header: 'Nom' },
            { 
              key: 'type_equipement', 
              header: 'Type',
              render: (value) => value?.replace(/_/g, ' ') || 'N/A'
            },
            { key: 'marque', header: 'Marque' },
            { 
              key: 'proprietaire', 
              header: 'Propriétaire',
              render: (value) => value?.nom_entreprise || 'N/A'
            },
            { 
              key: 'latestInterventionStatus', 
              header: 'Statut',
              render: (value) => value ? <StatusBadge status={value} /> : 'Aucune intervention'
            },
            { 
              key: 'cout', 
              header: 'Coût',
              render: (value) => value ? formatCurrency(value) : '-'
            }
          ]}
          actions={hasPermission('equipment:read') ? [
            {
              icon: Eye,
              label: 'Voir',
              onClick: (row) => openModal('equipment-detail', row),
              className: 'text-blue-600 hover:text-blue-800'
            },
            ...(hasPermission('equipment:update') ? [{
              icon: Edit,
              label: 'Modifier',
              onClick: (row) => openModal('equipment', row),
              className: 'text-yellow-600 hover:text-yellow-800'
            }] : []),
            ...(hasPermission('equipment:delete') ? [{
              icon: Trash2,
              label: 'Supprimer',
              onClick: (row) => openDeleteDialog(row),
              className: 'text-red-600 hover:text-red-800'
            }] : [])
          ] : null}
          pagination={
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(total / pageSize)}
              totalItems={total}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          }
        />
      </div>
    );
  };
  
  const renderInterventions = () => {
    const { data: interventionsData, isLoading } = interventionsQuery;
    
    // FIX: Handle both paginated and direct data structures
    const interventions = interventionsData?.data || interventionsData || [];
    const total = interventionsData?.total || interventionsData?.pagination?.total || interventions.length;
    
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Gestion des Interventions</h2>
            {hasPermission('interventions:create') && (
              <button 
                onClick={() => openModal('intervention')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                <span>Nouvelle Intervention</span>
              </button>
            )}
          </div>
          
          <div className="flex space-x-4 mb-4">
            <div className="flex-1">
              <SearchInput
                value={searchQuery}
                onChange={handleSearch}
                placeholder="Rechercher une intervention..."
              />
            </div>
            <select 
              className="px-4 py-2 border rounded-lg"
              value={filters.statut || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, statut: e.target.value || undefined }))}
            >
              <option value="">Tous les statuts</option>
              <option value="PLANIFIEE">Planifiée</option>
              <option value="EN_COURS">En Cours</option>
              <option value="EN_ATTENTE_PDR">En Attente PDR</option>
              <option value="TERMINEE">Terminée</option>
            </select>
            <select 
              className="px-4 py-2 border rounded-lg"
              value={filters.urgence || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, urgence: e.target.value || undefined }))}
            >
              <option value="">Toutes urgences</option>
              <option value="true">Urgentes uniquement</option>
              <option value="false">Non urgentes</option>
            </select>
          </div>
        </div>
  
        <DataTable
          data={interventions}
          loading={isLoading}
          columns={[
            { 
              key: 'equipement', 
              header: 'Équipement',
              render: (value, row) => (
                <div>
                  <div className="font-medium">{value?.nom || 'N/A'}</div>
                  <div className="text-sm text-gray-500">{value?.proprietaire?.nom_entreprise || 'N/A'}</div>
                </div>
              )
            },
            { 
              key: 'description', 
              header: 'Description',
              render: (value) => truncateText(value, 40)
            },
            { 
              key: 'statut', 
              header: 'Statut',
              render: (value, row) => <StatusBadge status={value} urgence={row.urgence} />
            },
            { 
              key: 'date', 
              header: 'Date',
              render: (value) => formatDate(value)
            },
            { 
              key: 'creerPar', 
              header: 'Créé par',
              render: (value) => value?.nom || 'N/A'
            }
          ]}
          actions={hasPermission('interventions:read') ? [
            {
              icon: Eye,
              label: 'Voir',
              onClick: (row) => openModal('intervention-detail', row),
              className: 'text-blue-600 hover:text-blue-800'
            },
            ...(hasPermission('interventions:update') ? [{
              icon: Edit,
              label: 'Modifier',
              onClick: (row) => openModal('intervention', row),
              className: 'text-yellow-600 hover:text-yellow-800'
            }] : []),
            ...(hasPermission('interventions:update') ? [{
              icon: Play,
              label: 'Changer Statut',
              onClick: (row) => {
                const newStatus = row.statut === 'PLANIFIEE' ? 'EN_COURS' : 
                                 row.statut === 'EN_COURS' ? 'TERMINEE' : 'PLANIFIEE';
                updateStatusMutation.mutate({ id: row.id, status: newStatus });
              },
              className: 'text-green-600 hover:text-green-800'
            }] : [])
          ] : null}
          pagination={
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(total / pageSize)}
              totalItems={total}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          }
        />
      </div>
    );
  };


     
       // Helper function to get next status
       const getNextStatus = (currentStatus) => {
         const statusFlow = {
           'PLANIFIEE': 'EN_COURS',
           'EN_ATTENTE_PDR': 'EN_COURS',
           'EN_COURS': 'TERMINEE',
           'EN_PAUSE': 'EN_COURS'
         };
         return statusFlow[currentStatus];
       };
     
       // Modal Renderer with Enhanced Functionality
       const renderModal = () => {
         if (!showModal) return null;
     
         const modalConfigs = {
           client: {
             title: selectedItem ? 'Modifier le Client' : 'Nouveau Client',
             size: 'xl',
             content: (
               <ClientForm
                 client={selectedItem}
                 onSubmit={async (data) => {
                   try {
                     if (selectedItem) {
                       await updateClientMutation.mutateAsync({ id: selectedItem.id, data });
                     } else {
                       await createClientMutation.mutateAsync(data);
                     }
                     closeModal();
                   } catch (error) {
                     console.error('Client form error:', error);
                   }
                 }}
                 loading={createClientMutation.isPending || updateClientMutation.isPending}
               />
             )
           },
           'client-detail': {
             title: 'Détails du Client',
             size: 'xl',
             content: <ClientDetailModal client={selectedItem} />
           },
           equipment: {
             title: selectedItem ? 'Modifier l\'Équipement' : 'Nouvel Équipement',
             size: 'xl',
             content: (
               <EquipmentForm
                 equipment={selectedItem}
                 onSubmit={async (data) => {
                   try {
                     if (selectedItem) {
                       await updateEquipmentMutation.mutateAsync({ id: selectedItem.id, data });
                     } else {
                       await createEquipmentMutation.mutateAsync(data);
                     }
                     closeModal();
                   } catch (error) {
                     console.error('Equipment form error:', error);
                   }
                 }}
                 loading={createEquipmentMutation.isPending || updateEquipmentMutation.isPending}
               />
             )
           },
           'equipment-detail': {
             title: 'Détails de l\'Équipement',
             size: 'xl',
             content: <EquipmentDetailModal equipment={selectedItem} />
           },
           intervention: {
            title: selectedItem ? 'Modifier l\'Intervention' : 'Nouvelle Intervention',
            size: 'md',
            content: (
              <InterventionForm
                intervention={selectedItem}
                onSubmit={(data) => {
                  if (selectedItem) {
                    // For updates, we'll use the status update mutation for now
                    // You can extend this to have a full update mutation later
                    updateStatusMutation.mutate({ id: selectedItem.id, status: data.statut });
                    closeModal();
                  } else {
                    createInterventionMutation.mutate(data);
                  }
                }}
                loading={createInterventionMutation.isPending || updateStatusMutation.isPending}
              />
            )
          },
           'intervention-detail': {
             title: 'Détails de l\'Intervention',
             size: 'xl',
             content: <InterventionDetailModal intervention={selectedItem} />
           }
         };
     
         const config = modalConfigs[modalType];
         if (!config) return null;
     
         return (
           <Modal
             isOpen={showModal}
             onClose={closeModal}
             title={config.title}
             size={config.size}
             showCloseButton={true}
             closeOnOverlayClick={false}
           >
             {config.content}
           </Modal>
         );
       };
     
       // Main render
       return (
         <div className="space-y-6">
           {/* Page Header with Real-time Updates */}
           <div className="bg-white rounded-lg shadow-sm border p-6">
             <div className="flex justify-between items-start">
               <div>
                 <h1 className="text-2xl font-bold text-gray-900">Tableau de Bord ETS RESELEC</h1>
                 <p className="text-gray-600 mt-1">Système de gestion d'équipements industriels</p>
                 <div className="flex items-center space-x-4 mt-2">
                   <div className="flex items-center space-x-2 text-sm text-gray-500">
                     <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                     <span>Connecté en temps réel</span>
                   </div>
                   {stats && (
                     <div className="text-sm text-gray-500">
                       {stats.overview?.activeInterventions || 0} intervention{(stats.overview?.activeInterventions || 0) !== 1 ? 's' : ''} active{(stats.overview?.activeInterventions || 0) !== 1 ? 's' : ''}
                     </div>
                   )}
                 </div>
               </div>
               <div className="flex items-center space-x-4">
                 <div className="text-right text-sm text-gray-500">
                   <p>Connecté en tant que</p>
                   <p className="font-medium text-gray-900">{user?.nom}</p>
                   <p className="text-xs text-blue-600">
                     {typeof user?.role === 'object' ? user.role?.nom : user?.role}
                   </p>
                 </div>
                 <div className="text-right text-sm text-gray-500">
                   <p>Dernière mise à jour</p>
                   <p className="font-medium text-gray-700">{formatDateTime(new Date())}</p>
                 </div>
                 <button
                   onClick={() => window.location.reload()}
                   className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                   title="Actualiser"
                 >
                   <RefreshCw className="w-5 h-5" />
                 </button>
               </div>
             </div>
           </div>
     
           {/* Enhanced Navigation Tabs */}
           <div className="bg-white rounded-lg shadow-sm border">
             <div className="border-b border-gray-200">
               <nav className="flex space-x-8 px-6" role="tablist">
                 {[
                   { id: 'overview', label: 'Vue d\'ensemble', icon: Activity, count: null },
                   ...(hasPermission('clients:read') ? [{ 
                     id: 'clients', 
                     label: 'Clients', 
                     icon: Users, 
                     count: clientsQuery.data?.total 
                   }] : []),
                   ...(hasPermission('equipment:read') ? [{ 
                     id: 'equipment', 
                     label: 'Équipements', 
                     icon: Package, 
                     count: equipmentQuery.data?.total 
                   }] : []),
                   ...(hasPermission('interventions:read') ? [{ 
                     id: 'interventions', 
                     label: 'Interventions', 
                     icon: Wrench, 
                     count: interventionsQuery.data?.total 
                   }] : [])
                 ].map(tab => {
                   const Icon = tab.icon;
                   const isActive = activeTab === tab.id;
                   return (
                     <button
                       key={tab.id}
                       onClick={() => {
                         setActiveTab(tab.id);
                         setCurrentPage(1);
                         setSearchQuery('');
                         setFilters({});
                       }}
                       className={`flex items-center space-x-2 px-3 py-4 text-sm font-medium border-b-2 transition-colors ${
                         isActive
                           ? 'border-blue-500 text-blue-600'
                           : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                       }`}
                       role="tab"
                       aria-selected={isActive}
                     >
                       <Icon className="w-4 h-4" />
                       <span>{tab.label}</span>
                       {tab.count !== null && tab.count !== undefined && (
                         <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                           isActive 
                             ? 'bg-blue-100 text-blue-800' 
                             : 'bg-gray-100 text-gray-600'
                         }`}>
                           {formatNumber(tab.count)}
                         </span>
                       )}
                     </button>
                   );
                 })}
               </nav>
             </div>
             
             <div className="p-6" role="tabpanel">
               {activeTab === 'overview' && renderOverview()}
               {activeTab === 'clients' && renderClients()}
               {activeTab === 'equipment' && renderEquipment()}
               {activeTab === 'interventions' && renderInterventions()}
             </div>
           </div>
     
           {/* Render Modal */}
           {renderModal()}
     
           {/* Enhanced Delete Confirmation Dialog */}
           <ConfirmDialog
             isOpen={showDeleteDialog}
             onClose={() => {
               setShowDeleteDialog(false);
               setSelectedItem(null);
             }}
             onConfirm={handleDelete}
             title="Confirmer la suppression"
             message={
               selectedItem ? (
                 <div className="space-y-2">
                   <p>Êtes-vous sûr de vouloir supprimer :</p>
                   <div className="bg-gray-50 p-3 rounded-lg">
                     <p className="font-medium text-gray-900">
                       {activeTab === 'clients' 
                         ? selectedItem.nom_entreprise 
                         : selectedItem.nom
                       }
                     </p>
                     {activeTab === 'clients' && selectedItem.ville && (
                       <p className="text-sm text-gray-600">{selectedItem.ville}</p>
                     )}
                     {activeTab === 'equipment' && selectedItem.proprietaire && (
                       <p className="text-sm text-gray-600">{selectedItem.proprietaire.nom_entreprise}</p>
                     )}
                   </div>
                   <p className="text-sm text-red-600 font-medium">
                     Cette action est irréversible !
                   </p>
                 </div>
               ) : (
                 `Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible.`
               )
             }
             type="danger"
             confirmText="Supprimer définitivement"
             cancelText="Annuler"
             loading={deleteClientMutation.isPending || deleteEquipmentMutation.isPending}
           />
     
           {/* Loading Overlay for Mutations */}
           {(createClientMutation.isPending || 
             updateClientMutation.isPending || 
             createEquipmentMutation.isPending || 
             updateEquipmentMutation.isPending || 
             createInterventionMutation.isPending ||
             updateStatusMutation.isPending) && (
             <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
               <div className="bg-white rounded-lg p-6 flex items-center space-x-4">
                 <Loader className="w-6 h-6 animate-spin text-blue-600" />
                 <span className="text-gray-900 font-medium">
                   {createClientMutation.isPending && 'Création du client...'}
                   {updateClientMutation.isPending && 'Modification du client...'}
                   {createEquipmentMutation.isPending && 'Création de l\'équipement...'}
                   {updateEquipmentMutation.isPending && 'Modification de l\'équipement...'}
                   {createInterventionMutation.isPending && 'Création de l\'intervention...'}
                   {updateStatusMutation.isPending && 'Mise à jour du statut...'}
                 </span>
               </div>
             </div>
           )}
         </div>
       );
     };
     
     export default Dashboard;