import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Filter, Calendar, Eye, Edit, Trash2, 
  Clock, AlertCircle, CheckCircle, Pause, X, Play, Wrench,
  Settings, FileText, Save, ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/common/StatusBadge';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import SearchInput from '../components/common/SearchInput';
import Pagination from '../components/common/Pagination';
import ConfirmDialog from '../components/common/ConfirmDialog';
import LoadingSpinner from '../components/common/LoadingSpinner';

// Import custom hooks
import {
  useInterventions,
  useCreateIntervention,
  useUpdateInterventionStatus,
  useIntervention,
  useInterventionWorkflow,
  useUpdateDiagnostic,
  useUpdatePlanification,
  useAddControleQualite
} from '../hooks/useInterventions';
import { useEquipment } from '../hooks/useEquipment';

import { formatDate, formatDateTime } from '../utils/dateUtils';
import { truncateText } from '../utils/formatUtils';

const Interventions = () => {
  const { hasPermission } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeWorkflowTab, setActiveWorkflowTab] = useState('info');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Data queries
  const { data: interventionsData, isLoading, refetch: refetchInterventions } = useInterventions({
    page: currentPage,
    limit: pageSize,
    search: searchQuery,
    ...filters
  });
  
  const { data: equipmentData } = useEquipment({ limit: 1000 });

  // Intervention detail queries - only fetch when modal is open
 // Intervention detail queries - only fetch when modal is open
 const { data: interventionDetail, refetch: refetchIntervention } = useIntervention(
    selectedItem?.id,
    { enabled: !!selectedItem?.id && showModal }
  );
  
  const { data: workflowData, isLoading: workflowLoading, refetch: refetchWorkflow } = useInterventionWorkflow(
    selectedItem?.id,
    { enabled: !!selectedItem?.id && showModal }
  );

  // Mutations
  const createInterventionMutation = useCreateIntervention();
  const updateStatusMutation = useUpdateInterventionStatus();
  const updateDiagnosticMutation = useUpdateDiagnostic();
  const updatePlanificationMutation = useUpdatePlanification();
  const addControleQualiteMutation = useAddControleQualite();

  // Debug logging
  useEffect(() => {
    if (selectedItem && showModal) {
      console.log('Selected Item:', selectedItem);
      console.log('Intervention Detail:', interventionDetail);
      console.log('Workflow Data:', workflowData);
      console.log('Workflow Loading:', workflowLoading);
    }
  }, [selectedItem, interventionDetail, workflowData, workflowLoading, showModal]);

  // Handlers
  const openModal = (type, item = null) => {
    setModalType(type);
    setSelectedItem(item);
    setShowModal(true);
    setActiveWorkflowTab('info');
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedItem(null);
    setModalType('');
    setActiveWorkflowTab('info');
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

  const openDeleteDialog = (item) => {
    setSelectedItem(item);
    setShowDeleteDialog(true);
  };

  // Form Components
  const InterventionForm = ({ intervention, onSubmit, loading }) => {
    const [formData, setFormData] = useState({
      equipement_id: intervention?.equipement_id || '',
      date: intervention?.date || new Date().toISOString().split('T')[0],
      description: intervention?.description || '',
      urgence: intervention?.urgence || false,
      statut: intervention?.statut || 'PLANIFIEE'
    });

    useEffect(() => {
      if (intervention) {
        setFormData({
          equipement_id: intervention.equipement_id || '',
          date: intervention.date || new Date().toISOString().split('T')[0],
          description: intervention.description || '',
          urgence: intervention.urgence || false,
          statut: intervention.statut || 'PLANIFIEE'
        });
      }
    }, [intervention]);

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
            )) || []}
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

  // Diagnostic Form Component
  const DiagnosticForm = ({ diagnostic, onSubmit, loading }) => {
    console.log('DiagnosticForm received diagnostic:', diagnostic);
    
    const [formData, setFormData] = useState({
      travailRequis: [],
      besoinPDR: [],
      chargesRealisees: []
    });

    const [newItems, setNewItems] = useState({
      travailRequis: '',
      besoinPDR: '',
      chargesRealisees: ''
    });

    // Update form data when diagnostic prop changes
    useEffect(() => {
      if (diagnostic) {
        console.log('Setting diagnostic form data:', diagnostic);
        setFormData({
          travailRequis: diagnostic.travailRequis || [],
          besoinPDR: diagnostic.besoinPDR || [],
          chargesRealisees: diagnostic.chargesRealisees || []
        });
      }
    }, [diagnostic]);

    const handleSubmit = (e) => {
      e.preventDefault();
      onSubmit(formData);
    };

    const addItem = (field) => {
      if (newItems[field].trim()) {
        setFormData(prev => ({
          ...prev,
          [field]: [...prev[field], newItems[field].trim()]
        }));
        setNewItems(prev => ({ ...prev, [field]: '' }));
      }
    };

    const removeItem = (field, index) => {
      setFormData(prev => ({
        ...prev,
        [field]: prev[field].filter((_, i) => i !== index)
      }));
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h4 className="font-semibold text-gray-900">Phase Diagnostique</h4>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
          >
            {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
            <Save className="w-4 h-4" />
            <span>Enregistrer</span>
          </button>
        </div>

        {/* Travail Requis */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Travail Requis
          </label>
          <div className="space-y-2">
            {formData.travailRequis.map((item, index) => (
              <div key={index} className="flex items-center space-x-2 bg-gray-50 p-2 rounded">
                <span className="flex-1">{item}</span>
                <button
                  type="button"
                  onClick={() => removeItem('travailRequis', index)}
                  className="text-red-600 hover:text-red-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            <div className="flex space-x-2">
              <input
                type="text"
                className="flex-1 p-2 border rounded-lg"
                placeholder="Ajouter un travail requis..."
                value={newItems.travailRequis}
                onChange={(e) => setNewItems(prev => ({ ...prev, travailRequis: e.target.value }))}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('travailRequis'))}
              />
              <button
                type="button"
                onClick={() => addItem('travailRequis')}
                className="bg-gray-200 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-300"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Besoin PDR */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Besoin Pièces de Rechange
          </label>
          <div className="space-y-2">
            {formData.besoinPDR.map((item, index) => (
              <div key={index} className="flex items-center space-x-2 bg-gray-50 p-2 rounded">
                <span className="flex-1">{item}</span>
                <button
                  type="button"
                  onClick={() => removeItem('besoinPDR', index)}
                  className="text-red-600 hover:text-red-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            <div className="flex space-x-2">
              <input
                type="text"
                className="flex-1 p-2 border rounded-lg"
                placeholder="Ajouter une pièce de rechange..."
                value={newItems.besoinPDR}
                onChange={(e) => setNewItems(prev => ({ ...prev, besoinPDR: e.target.value }))}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('besoinPDR'))}
              />
              <button
                type="button"
                onClick={() => addItem('besoinPDR')}
                className="bg-gray-200 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-300"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Charges Réalisées */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Charges Réalisées
          </label>
          <div className="space-y-2">
            {formData.chargesRealisees.map((item, index) => (
              <div key={index} className="flex items-center space-x-2 bg-gray-50 p-2 rounded">
                <span className="flex-1">{item}</span>
                <button
                  type="button"
                  onClick={() => removeItem('chargesRealisees', index)}
                  className="text-red-600 hover:text-red-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            <div className="flex space-x-2">
              <input
                type="text"
                className="flex-1 p-2 border rounded-lg"
                placeholder="Ajouter une charge réalisée..."
                value={newItems.chargesRealisees}
                onChange={(e) => setNewItems(prev => ({ ...prev, chargesRealisees: e.target.value }))}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('chargesRealisees'))}
              />
              <button
                type="button"
                onClick={() => addItem('chargesRealisees')}
                className="bg-gray-200 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-300"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Planification Form Component
// Planification Form Component
const PlanificationForm = ({ planification, onSubmit, loading }) => {
    const [formData, setFormData] = useState({
      capaciteExecution: '',
      urgencePrise: false,
      disponibilitePDR: false
    });

    useEffect(() => {
      if (planification) {
        console.log('Planification data received:', planification);
        setFormData({
          capaciteExecution: planification.capaciteExecution || '',
          urgencePrise: planification.urgencePrise || false,
          disponibilitePDR: planification.disponibilitePDR || false
        });
      }
    }, [planification]);

    const handleSubmit = (e) => {
      e.preventDefault();
      console.log('Submitting planification data:', formData);
      onSubmit(formData);
    };

    const handleChange = (field, value) => {
      setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h4 className="font-semibold text-gray-900">Phase Planification</h4>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center space-x-2"
          >
            {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
            <Save className="w-4 h-4" />
            <span>Enregistrer</span>
          </button>
        </div>

        {/* Display current values for debugging */}
        {planification && (
          <div className="bg-gray-50 p-3 rounded border text-sm">
            <strong>Données actuelles:</strong>
            <div>Capacité: {planification.capaciteExecution}</div>
            <div>Urgence prise: {planification.urgencePrise ? 'Oui' : 'Non'}</div>
            <div>PDR disponible: {planification.disponibilitePDR ? 'Oui' : 'Non'}</div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Capacité d'Exécution (heures)
          </label>
          <input
            type="number"
            min="0"
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            value={formData.capaciteExecution}
            onChange={(e) => handleChange('capaciteExecution', e.target.value)}
            placeholder="Nombre d'heures nécessaires..."
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="urgencePrise"
              className="mr-2"
              checked={formData.urgencePrise}
              onChange={(e) => handleChange('urgencePrise', e.target.checked)}
            />
            <label htmlFor="urgencePrise" className="text-sm font-medium text-gray-700">
              Urgence prise en compte
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="disponibilitePDR"
              className="mr-2"
              checked={formData.disponibilitePDR}
              onChange={(e) => handleChange('disponibilitePDR', e.target.checked)}
            />
            <label htmlFor="disponibilitePDR" className="text-sm font-medium text-gray-700">
              Pièces de rechange disponibles
            </label>
          </div>
        </div>

        {/* Form data preview for debugging */}
        <div className="bg-blue-50 p-3 rounded border text-sm">
          <strong>Données du formulaire:</strong>
          <div>Capacité: {formData.capaciteExecution}</div>
          <div>Urgence prise: {formData.urgencePrise ? 'Oui' : 'Non'}</div>
          <div>PDR disponible: {formData.disponibilitePDR ? 'Oui' : 'Non'}</div>
        </div>
      </div>
    );
  };

  // Quality Control Form Component
  const QualityControlForm = ({ controleQualite, onSubmit, loading }) => {
    const [formData, setFormData] = useState({
      resultatsEssais: '',
      analyseVibratoire: ''
    });

    useEffect(() => {
      if (controleQualite) {
        setFormData({
          resultatsEssais: controleQualite.resultatsEssais || '',
          analyseVibratoire: controleQualite.analyseVibratoire || ''
        });
      }
    }, [controleQualite]);

    const handleSubmit = (e) => {
      e.preventDefault();
      onSubmit(formData);
    };

    const handleChange = (field, value) => {
      setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h4 className="font-semibold text-gray-900">Phase Contrôle Qualité</h4>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center space-x-2"
          >
            {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
            <Save className="w-4 h-4" />
            <span>Enregistrer</span>
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Résultats des Essais
          </label>
          <textarea
            rows={4}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            value={formData.resultatsEssais}
            onChange={(e) => handleChange('resultatsEssais', e.target.value)}
            placeholder="Décrivez les résultats des essais effectués..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Analyse Vibratoire
          </label>
          <textarea
            rows={4}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            value={formData.analyseVibratoire}
            onChange={(e) => handleChange('analyseVibratoire', e.target.value)}
            placeholder="Résultats de l'analyse vibratoire..."
          />
        </div>
      </div>
    );
  };

  // Workflow Progress Component
  const WorkflowProgress = ({ workflow }) => {
    if (!workflow) return null;

    const phases = [
      { key: 'diagnostic', label: 'Diagnostic', icon: Search },
      { key: 'planification', label: 'Planification', icon: Calendar },
      { key: 'controleQualite', label: 'Contrôle Qualité', icon: CheckCircle }
    ];

    return (
      <div className="bg-white border rounded-lg p-4 mb-6">
        <h4 className="font-semibold text-lg mb-4 flex items-center space-x-2">
          <Settings className="w-5 h-5" />
          <span>Progression du Workflow</span>
        </h4>
        
        <div className="flex items-center justify-between">
          {phases.map((phase, index) => {
            const phaseData = workflow.phases[phase.key];
            const isCompleted = phaseData?.completed;
            const isActive = !isCompleted && index === phases.findIndex(p => !workflow.phases[p.key]?.completed);
            const Icon = phase.icon;
            
            return (
              <React.Fragment key={phase.key}>
                <div className="flex flex-col items-center space-y-2">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                    isCompleted ? 'bg-green-500 text-white' : 
                    isActive ? 'bg-blue-500 text-white' : 
                    'bg-gray-300 text-gray-600'
                  }`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-sm">{phase.label}</div>
                    <div className={`text-xs ${
                      isCompleted ? 'text-green-600' : 
                      isActive ? 'text-blue-600' : 
                      'text-gray-500'
                    }`}>
                      {isCompleted ? 'Terminé' : isActive ? 'En cours' : 'En attente'}
                    </div>
                  </div>
                </div>
                {index < phases.length - 1 && (
                  <div className={`flex-1 h-1 mx-4 rounded ${
                    isCompleted ? 'bg-green-500' : 'bg-gray-300'
                  }`}></div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  };

  // Detailed Modal Component
  const InterventionDetailModal = ({ intervention }) => {
    if (!intervention) return <LoadingSpinner />;

    const tabs = [
      { id: 'info', label: 'Informations', icon: FileText },
      { id: 'diagnostic', label: 'Diagnostic', icon: Search },
      { id: 'planification', label: 'Planification', icon: Calendar },
      { id: 'qualite', label: 'Contrôle Qualité', icon: CheckCircle }
    ];

    const renderTabContent = () => {
      if (workflowLoading) {
        return <LoadingSpinner text="Chargement des données workflow..." />;
      }

      switch (activeWorkflowTab) {
        case 'info':
          return (
            <div className="space-y-4">
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
          );

        case 'diagnostic':
          return (
            <DiagnosticForm
              diagnostic={workflowData?.phases?.diagnostic?.data}
              onSubmit={async (data) => {
                try {
                  await updateDiagnosticMutation.mutateAsync({ id: intervention.id, data });
                  await refetchWorkflow();
                } catch (error) {
                  console.error('Error updating diagnostic:', error);
                }
              }}
              loading={updateDiagnosticMutation.isPending}
            />
          );

        case 'planification':
          return (
            <PlanificationForm
              planification={workflowData?.phases?.planification?.data}
              onSubmit={async (data) => {
                try {
                  await updatePlanificationMutation.mutateAsync({ id: intervention.id, data });
                  await refetchWorkflow();
                } catch (error) {
                  console.error('Error updating planification:', error);
                }
              }}
              loading={updatePlanificationMutation.isPending}
            />
          );

        case 'qualite':
          return (
            <QualityControlForm
              controleQualite={workflowData?.phases?.controleQualite?.data}
              onSubmit={async (data) => {
                try {
                  await addControleQualiteMutation.mutateAsync({ id: intervention.id, data });
                  await refetchWorkflow();
                } catch (error) {
                  console.error('Error updating quality control:', error);
                }
              }}
              loading={addControleQualiteMutation.isPending}
            />
          );

        default:
          return null;
      }
    };

    return (
      <div className="space-y-6">
        {/* Workflow Progress */}
        <WorkflowProgress workflow={workflowData} />

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const phaseData = workflowData?.phases?.[tab.id];
              const isCompleted = phaseData?.completed;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveWorkflowTab(tab.id)}
                  className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeWorkflowTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {isCompleted && tab.id !== 'info' && (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="py-4">
          {renderTabContent()}
        </div>
      </div>
    );
  };

  // Modal renderer
  const renderModal = () => {
    if (!showModal) return null;

    const modalConfigs = {
      create: {
        title: 'Nouvelle Intervention',
        size: 'md',
        content: (
          <InterventionForm
            onSubmit={async (data) => {
              try {
                await createInterventionMutation.mutateAsync(data);
                await refetchInterventions();
                closeModal();
              } catch (error) {
                console.error('Error creating intervention:', error);
              }
            }}
            loading={createInterventionMutation.isPending}
          />
        )
      },
      edit: {
        title: 'Modifier l\'Intervention',
        size: 'md',
        content: (
          <InterventionForm
            intervention={selectedItem}
            onSubmit={async (data) => {
              try {
                // Add update intervention logic here
                console.log('Update intervention:', data);
                closeModal();
              } catch (error) {
                console.error('Error updating intervention:', error);
              }
            }}
            loading={false}
          />
        )
      },
      detail: {
        title: `Intervention #${selectedItem?.id} - ${selectedItem?.equipement?.nom}`,
        size: '4xl',
        content: <InterventionDetailModal intervention={interventionDetail} />
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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestion des Interventions</h1>
            <p className="text-gray-600 mt-1">Planifiez et suivez vos interventions de maintenance</p>
          </div>
          {hasPermission('interventions:create') && (
            <button 
              onClick={() => openModal('create')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              <span>Nouvelle Intervention</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
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

      {/* Interventions Table */}
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
            label: 'Voir détails',
            onClick: (row) => openModal('detail', row),
            className: 'text-blue-600 hover:text-blue-800'
          },
          ...(hasPermission('interventions:update') ? [{
            icon: Edit,
            label: 'Modifier',
            onClick: (row) => openModal('edit', row),
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

      {/* Render Modal */}
      {renderModal()}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={() => {
          // Add delete logic here
          setShowDeleteDialog(false);
        }}
        title="Confirmer la suppression"
        message="Êtes-vous sûr de vouloir supprimer cette intervention ?"
        type="danger"
        confirmText="Supprimer"
        loading={false}
      />
    </div>
  );
};

export default Interventions;