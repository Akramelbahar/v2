import React, { useState } from 'react';
import { 
  Users, Settings, Wrench, FileText, AlertCircle, CheckCircle, Clock, 
  Pause, X, Plus, Search, Edit, Trash2, Eye, Play, ArrowRight, Upload, 
  Download, FileCheck, Filter, Calendar, Building, Package, TrendingUp,
  Activity, Bell, RefreshCw, MoreVertical, ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/common/StatusBadge';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import SearchInput from '../components/common/SearchInput';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Pagination from '../components/common/Pagination';
import ConfirmDialog from '../components/common/ConfirmDialog';

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
  useInterventionWorkflow
} from '../hooks/useInterventions';

import { formatDate, formatDateTime } from '../utils/dateUtils';
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
    setCurrentPage(1); // Reset to first page
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  // Form Components
  
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

  const validateForm = () => {
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

    if (formData.siteWeb && !/^https?:\/\/.+/.test(formData.siteWeb)) {
      newErrors.siteWeb = 'Format d\'URL invalide (doit commencer par http:// ou https://)';
    }

    if (formData.tel && !/^[\d\s\-\+\(\)\.]{8,20}$/.test(formData.tel)) {
      newErrors.tel = 'Format de téléphone invalide';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Company Information */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-md font-semibold text-gray-900 mb-4">Informations de l'entreprise</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom de l'entreprise *
            </label>
            <input
              type="text"
              required
              className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.nom_entreprise ? 'border-red-300' : 'border-gray-300'
              }`}
              value={formData.nom_entreprise}
              onChange={(e) => handleChange('nom_entreprise', e.target.value)}
            />
            {errors.nom_entreprise && (
              <p className="text-red-500 text-sm mt-1">{errors.nom_entreprise}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Secteur d'activité
            </label>
            <input
              type="text"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={formData.secteur_activite}
              onChange={(e) => handleChange('secteur_activite', e.target.value)}
              list="sectors"
            />
            <datalist id="sectors">
              {clientSectors?.map(sector => (
                <option key={sector} value={sector} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Forme juridique
            </label>
            <select
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={formData.forme_juridique}
              onChange={(e) => handleChange('forme_juridique', e.target.value)}
            >
              <option value="">Sélectionner</option>
              <option value="SARL">SARL</option>
              <option value="SA">SA</option>
              <option value="SNC">SNC</option>
              <option value="SCS">SCS</option>
              <option value="SCA">SCA</option>
              <option value="Entreprise_Individuelle">Entreprise Individuelle</option>
              <option value="EURL">EURL</option>
              <option value="Autre">Autre</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Registre de commerce
            </label>
            <input
              type="text"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={formData.registre_commerce}
              onChange={(e) => handleChange('registre_commerce', e.target.value)}
              placeholder="Ex: RC123456"
            />
          </div>
        </div>
      </div>

      {/* Address Information */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-md font-semibold text-gray-900 mb-4">Adresse</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Adresse
            </label>
            <input
              type="text"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={formData.adresse}
              onChange={(e) => handleChange('adresse', e.target.value)}
              placeholder="Rue, avenue, numéro..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ville
            </label>
            <input
              type="text"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={formData.ville}
              onChange={(e) => handleChange('ville', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Code postal
            </label>
            <input
              type="text"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={formData.codePostal}
              onChange={(e) => handleChange('codePostal', e.target.value)}
              placeholder="Ex: 20000"
            />
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-md font-semibold text-gray-900 mb-4">Coordonnées</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Téléphone
            </label>
            <input
              type="tel"
              className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.tel ? 'border-red-300' : 'border-gray-300'
              }`}
              value={formData.tel}
              onChange={(e) => handleChange('tel', e.target.value)}
              placeholder="Ex: +212 5XX XX XX XX"
            />
            {errors.tel && (
              <p className="text-red-500 text-sm mt-1">{errors.tel}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fax
            </label>
            <input
              type="tel"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={formData.fax}
              onChange={(e) => handleChange('fax', e.target.value)}
              placeholder="Ex: +212 5XX XX XX XX"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.email ? 'border-red-300' : 'border-gray-300'
              }`}
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="contact@entreprise.com"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Site web
            </label>
            <input
              type="url"
              className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.siteWeb ? 'border-red-300' : 'border-gray-300'
              }`}
              value={formData.siteWeb}
              onChange={(e) => handleChange('siteWeb', e.target.value)}
              placeholder="https://www.entreprise.com"
            />
            {errors.siteWeb && (
              <p className="text-red-500 text-sm mt-1">{errors.siteWeb}</p>
            )}
          </div>
        </div>
      </div>

      {/* Contact Person Information */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-md font-semibold text-gray-900 mb-4">Personne de contact</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact principal
            </label>
            <input
              type="text"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={formData.contact_principal}
              onChange={(e) => handleChange('contact_principal', e.target.value)}
              placeholder="Nom du responsable"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Poste / Fonction
            </label>
            <input
              type="text"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={formData.poste_contact}
              onChange={(e) => handleChange('poste_contact', e.target.value)}
              placeholder="Ex: Directeur technique"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Téléphone contact
            </label>
            <input
              type="tel"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={formData.telephone_contact}
              onChange={(e) => handleChange('telephone_contact', e.target.value)}
              placeholder="Ex: +212 6XX XX XX XX"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email contact
            </label>
            <input
              type="email"
              className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.email_contact ? 'border-red-300' : 'border-gray-300'
              }`}
              value={formData.email_contact}
              onChange={(e) => handleChange('email_contact', e.target.value)}
              placeholder="contact@entreprise.com"
            />
            {errors.email_contact && (
              <p className="text-red-500 text-sm mt-1">{errors.email_contact}</p>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex justify-end space-x-2 pt-4">
        <button
          type="button"
          onClick={closeModal}
          disabled={loading}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
        >
          {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
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

  const [errors, setErrors] = useState({});

  const validateForm = () => {
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

    if (formData.cout && parseFloat(formData.cout) < 0) {
      newErrors.cout = 'Le coût ne peut pas être négatif';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      // Convert numeric fields
      const processedData = {
        ...formData,
        cout: formData.cout ? parseFloat(formData.cout) : null,
        proprietaire_id: parseInt(formData.proprietaire_id)
      };
      onSubmit(processedData);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-md font-semibold text-gray-900 mb-4">Informations de base</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom de l'équipement *
            </label>
            <input
              type="text"
              required
              className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.nom ? 'border-red-300' : 'border-gray-300'
              }`}
              value={formData.nom}
              onChange={(e) => handleChange('nom', e.target.value)}
              placeholder="Ex: Moteur pompe principale"
            />
            {errors.nom && (
              <p className="text-red-500 text-sm mt-1">{errors.nom}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type d'équipement
            </label>
            <select
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={formData.type_equipement}
              onChange={(e) => handleChange('type_equipement', e.target.value)}
            >
              <option value="">Sélectionner un type</option>
              {equipmentTypes?.map(type => (
                <option key={type} value={type}>
                  {type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
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
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={formData.marque}
              onChange={(e) => handleChange('marque', e.target.value)}
              placeholder="Ex: Siemens, ABB, Schneider"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Modèle
            </label>
            <input
              type="text"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={formData.modele}
              onChange={(e) => handleChange('modele', e.target.value)}
              placeholder="Référence du modèle"
            />
          </div>
        </div>
      </div>

      {/* Technical Information */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-md font-semibold text-gray-900 mb-4">Informations techniques</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              État de réception
            </label>
            <select
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={formData.etatDeReception}
              onChange={(e) => handleChange('etatDeReception', e.target.value)}
            >
              <option value="">Sélectionner l'état</option>
              <option value="Neuf">Neuf</option>
              <option value="Bon_état">Bon état</option>
              <option value="État_moyen">État moyen</option>
              <option value="Mauvais_état">Mauvais état</option>
              <option value="Hors_service">Hors service</option>
              <option value="En_réparation">En réparation</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Valeur / Spécifications
            </label>
            <input
              type="text"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={formData.valeur}
              onChange={(e) => handleChange('valeur', e.target.value)}
              placeholder="Ex: 220V, 50Hz, 15kW"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Coût (MAD)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.cout ? 'border-red-300' : 'border-gray-300'
              }`}
              value={formData.cout}
              onChange={(e) => handleChange('cout', e.target.value)}
              placeholder="Prix d'achat ou valeur"
            />
            {errors.cout && (
              <p className="text-red-500 text-sm mt-1">{errors.cout}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Propriétaire *
            </label>
            <select
              required
              className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.proprietaire_id ? 'border-red-300' : 'border-gray-300'
              }`}
              value={formData.proprietaire_id}
              onChange={(e) => handleChange('proprietaire_id', e.target.value)}
            >
              <option value="">Sélectionner un client</option>
              {clientsQuery.data?.data?.map(client => (
                <option key={client.id} value={client.id}>
                  {client.nom_entreprise}
                </option>
              ))}
            </select>
            {errors.proprietaire_id && (
              <p className="text-red-500 text-sm mt-1">{errors.proprietaire_id}</p>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex justify-end space-x-2 pt-4">
        <button
          type="button"
          onClick={closeModal}
          disabled={loading}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
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

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.equipement_id) {
      newErrors.equipement_id = 'L\'équipement est requis';
    }

    if (!formData.date) {
      newErrors.date = 'La date est requise';
    }

    // Check if date is not in the past (except for today)
    const selectedDate = new Date(formData.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      newErrors.date = 'La date ne peut pas être antérieure à aujourd\'hui';
    }

    if (formData.description && formData.description.length > 1000) {
      newErrors.description = 'La description ne peut pas dépasser 1000 caractères';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      const processedData = {
        ...formData,
        equipement_id: parseInt(formData.equipement_id)
      };
      onSubmit(processedData);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-md font-semibold text-gray-900 mb-4">Informations de l'intervention</h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Équipement *
            </label>
            <select
              required
              className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.equipement_id ? 'border-red-300' : 'border-gray-300'
              }`}
              value={formData.equipement_id}
              onChange={(e) => handleChange('equipement_id', e.target.value)}
            >
              <option value="">Sélectionner un équipement</option>
              {equipmentQuery.data?.data?.map(eq => (
                <option key={eq.id} value={eq.id}>
                  {eq.nom} - {eq.proprietaire?.nom_entreprise}
                </option>
              ))}
            </select>
            {errors.equipement_id && (
              <p className="text-red-500 text-sm mt-1">{errors.equipement_id}</p>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date d'intervention *
              </label>
              <input
                type="date"
                required
                className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.date ? 'border-red-300' : 'border-gray-300'
                }`}
                value={formData.date}
                onChange={(e) => handleChange('date', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
              {errors.date && (
                <p className="text-red-500 text-sm mt-1">{errors.date}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Statut initial
              </label>
              <select
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={formData.statut}
                onChange={(e) => handleChange('statut', e.target.value)}
              >
                <option value="PLANIFIEE">Planifiée</option>
                <option value="EN_ATTENTE_PDR">En Attente PDR</option>
                <option value="EN_COURS">En Cours</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description de l'intervention
            </label>
            <textarea
              rows={4}
              className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 resize-none ${
                errors.description ? 'border-red-300' : 'border-gray-300'
              }`}
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Décrivez le problème ou l'intervention nécessaire..."
              maxLength={1000}
            />
            <div className="flex justify-between mt-1">
              {errors.description && (
                <p className="text-red-500 text-sm">{errors.description}</p>
              )}
              <p className="text-gray-500 text-sm ml-auto">
                {formData.description.length}/1000
              </p>
            </div>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="urgence"
              className="mr-3 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
              checked={formData.urgence}
              onChange={(e) => handleChange('urgence', e.target.checked)}
            />
            <label htmlFor="urgence" className="text-sm font-medium text-gray-700">
              <span className="flex items-center">
                Intervention urgente
                <span className="ml-2 text-red-600">⚠️</span>
              </span>
            </label>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end space-x-2 pt-4">
        <button
          type="button"
          onClick={closeModal}
          disabled={loading}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
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

  // Tab content renderers
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
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {alerts.urgent?.map(alert => (
                <div key={alert.id} className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-red-900">{alert.title}</h4>
                      <p className="text-sm text-red-700 mt-1">{alert.description}</p>
                    </div>
                  </div>
                </div>
              ))}
              {alerts.overdue?.map(alert => (
                <div key={alert.id} className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Clock className="w-5 h-5 text-orange-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-orange-900">{alert.title}</h4>
                      <p className="text-sm text-orange-700 mt-1">{alert.description}</p>
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
                  <div className="font-medium">{value?.nom || 'N/A'}</div>
                  <div className="text-sm text-gray-500">{value?.proprietaire?.nom_entreprise || 'N/A'}</div>
                </div>
              )
            },
            { 
              key: 'description', 
              header: 'Description',
              render: (value) => truncateText(value, 50)
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
        />
      </div>
    </div>
  );

  const renderClients = () => {
    const { data: clientsData, isLoading } = clientsQuery;
    
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
          data={clientsData?.data || []}
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
              totalPages={Math.ceil((clientsData?.total || 0) / pageSize)}
              totalItems={clientsData?.total || 0}
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
                <option key={type} value={type}>{type.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
        </div>

        <DataTable
          data={equipmentData?.data || []}
          loading={isLoading}
          columns={[
            { key: 'nom', header: 'Nom' },
            { 
              key: 'type_equipement', 
              header: 'Type',
              render: (value) => value?.replace('_', ' ') || 'N/A'
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
              totalPages={Math.ceil((equipmentData?.total || 0) / pageSize)}
              totalItems={equipmentData?.total || 0}
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
          data={interventionsData?.data || []}
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
            }] : [])
          ] : null}
          pagination={
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil((interventionsData?.total || 0) / pageSize)}
              totalItems={interventionsData?.total || 0}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          }
        />
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
        {/* Intervention Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-lg mb-3 flex items-center space-x-2">
            <Wrench className="w-5 h-5" />
            <span>Informations de l'Intervention</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-700">Équipement:</p>
              <p className="text-sm text-gray-900">{intervention.equipement?.nom}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Client:</p>
              <p className="text-sm text-gray-900">{intervention.equipement?.proprietaire?.nom_entreprise}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Date:</p>
              <p className="text-sm text-gray-900">{formatDate(intervention.date)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Statut:</p>
              <StatusBadge status={intervention.statut} urgence={intervention.urgence} />
            </div>
            {intervention.description && (
              <div className="md:col-span-2">
                <p className="text-sm font-medium text-gray-700">Description:</p>
                <p className="text-sm text-gray-900">{intervention.description}</p>
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
                className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700"
              >
                <Edit className="w-4 h-4" />
                <span>Modifier</span>
              </button>
            )}
            <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-gray-100">
              <Download className="w-4 h-4" />
              <span>Télécharger Rapport</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Modal Renderer
  const renderModal = () => {
    if (!showModal) return null;

    const modalConfigs = {
      client: {
        title: selectedItem ? 'Modifier le Client' : 'Nouveau Client',
        size: 'lg',
        content: (
          <ClientForm
            client={selectedItem}
            onSubmit={(data) => {
              if (selectedItem) {
                updateClientMutation.mutate({ id: selectedItem.id, data });
              } else {
                createClientMutation.mutate(data);
              }
            }}
            loading={createClientMutation.isPending || updateClientMutation.isPending}
          />
        )
      },
      equipment: {
        title: selectedItem ? 'Modifier l\'Équipement' : 'Nouvel Équipement',
        size: 'lg',
        content: (
          <EquipmentForm
            equipment={selectedItem}
            onSubmit={(data) => {
              if (selectedItem) {
                updateEquipmentMutation.mutate({ id: selectedItem.id, data });
              } else {
                createEquipmentMutation.mutate(data);
              }
            }}
            loading={createEquipmentMutation.isPending || updateEquipmentMutation.isPending}
          />
        )
      },
      intervention: {
        title: selectedItem ? 'Modifier l\'Intervention' : 'Nouvelle Intervention',
        size: 'md',
        content: (
          <InterventionForm
            intervention={selectedItem}
            onSubmit={(data) => {
              if (selectedItem) {
                // Update logic for interventions would go here
                console.log('Update intervention:', data);
              } else {
                createInterventionMutation.mutate(data);
              }
            }}
            loading={createInterventionMutation.isPending}
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
      >
        {config.content}
      </Modal>
    );
  };

  // Main render
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tableau de Bord ETS RESELEC</h1>
            <p className="text-gray-600 mt-1">Système de gestion d'équipements industriels</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right text-sm text-gray-500">
              <p>Connecté en tant que</p>
              <p className="font-medium">{user?.nom}</p>
              <p className="text-xs text-blue-600">{user?.role}</p>
            </div>
            <div className="text-right text-sm text-gray-500">
              <p>Dernière mise à jour</p>
              <p className="font-medium">{formatDateTime(new Date())}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Vue d\'ensemble', icon: Activity },
              ...(hasPermission('clients:read') ? [{ id: 'clients', label: 'Clients', icon: Users }] : []),
              ...(hasPermission('equipment:read') ? [{ id: 'equipment', label: 'Équipements', icon: Package }] : []),
              ...(hasPermission('interventions:read') ? [{ id: 'interventions', label: 'Interventions', icon: Wrench }] : [])
            ].map(tab => {
              const Icon = tab.icon;
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
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
        
        <div className="p-6">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'clients' && renderClients()}
          {activeTab === 'equipment' && renderEquipment()}
          {activeTab === 'interventions' && renderInterventions()}
        </div>
      </div>

      {/* Render Modal */}
      {renderModal()}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Confirmer la suppression"
        message={`Êtes-vous sûr de vouloir supprimer ${
          activeTab === 'clients' ? 'ce client' : 'cet équipement'
        } ? Cette action est irréversible.`}
        type="danger"
        confirmText="Supprimer"
        loading={deleteClientMutation.isPending || deleteEquipmentMutation.isPending}
      />
    </div>
  );
};

export default Dashboard;