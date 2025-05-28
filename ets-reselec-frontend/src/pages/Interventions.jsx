import React, { useState } from 'react';
import { 
  Wrench, Plus, Search, Edit, Trash2, Eye, Calendar, Clock, AlertCircle,
  CheckCircle, X, Save, Stethoscope, Shield, FileText, Filter, RefreshCw,
  ChevronDown, ChevronRight, Settings, Users, Package
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
  useInterventions,
  useIntervention,
  useCreateIntervention,
  useUpdateInterventionStatus,
  useInterventionWorkflow,
  useUpdateDiagnostic,
  useUpdatePlanification,
  useAddControleQualite
} from '../hooks/useInterventions';
import { useEquipment } from '../hooks/useEquipment';
import { useClients } from '../hooks/useClients';

import { formatDate, formatDateTime } from '../utils/dateUtils';
import { truncateText } from '../utils/formatUtils';

const Interventions = () => {
  const { user, hasPermission } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [selectedIntervention, setSelectedIntervention] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState({});

  // Data queries
  const interventionsQuery = useInterventions({ 
    page: currentPage, 
    limit: pageSize, 
    search: searchQuery,
    ...filters 
  });
  
  const { data: equipmentData } = useEquipment({ limit: 1000 }); // Get all equipment for form
  const { data: clientsData } = useClients({ limit: 1000 }); // Get all clients for form

  // Mutations
  const createInterventionMutation = useCreateIntervention();
  const updateStatusMutation = useUpdateInterventionStatus();
  const updateDiagnosticMutation = useUpdateDiagnostic();
  const updatePlanificationMutation = useUpdatePlanification();
  const addControleQualiteMutation = useAddControleQualite();

  // Valid status transitions - Fixed based on business logic
  const STATUS_TRANSITIONS = {
    'PLANIFIEE': ['EN_ATTENTE_PDR', 'EN_COURS', 'ANNULEE'],
    'EN_ATTENTE_PDR': ['EN_COURS', 'PLANIFIEE', 'ANNULEE'],
    'EN_COURS': ['EN_PAUSE', 'TERMINEE', 'ECHEC'],
    'EN_PAUSE': ['EN_COURS', 'ANNULEE'],
    'TERMINEE': [], // Final state - no transitions allowed
    'ANNULEE': ['PLANIFIEE'], // Allow reactivation
    'ECHEC': ['PLANIFIEE', 'EN_COURS'] // Allow restart
  };

  const STATUS_LABELS = {
    'PLANIFIEE': 'Planifiée',
    'EN_ATTENTE_PDR': 'En Attente PDR',
    'EN_COURS': 'En Cours',
    'EN_PAUSE': 'En Pause',
    'TERMINEE': 'Terminée',
    'ANNULEE': 'Annulée',
    'ECHEC': 'Échec'
  };

  // Get valid next statuses for current status
  const getValidNextStatuses = (currentStatus) => {
    return STATUS_TRANSITIONS[currentStatus] || [];
  };

  // Handlers
  const openModal = (type, intervention = null) => {
    setModalType(type);
    setSelectedIntervention(intervention);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedIntervention(null);
    setModalType('');
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

  // Intervention Form Component
  const InterventionForm = ({ intervention, onSubmit, loading }) => {
    const [formData, setFormData] = useState({
      equipement_id: intervention?.equipement_id || '',
      date: intervention?.date || new Date().toISOString().split('T')[0],
      description: intervention?.description || '',
      urgence: intervention?.urgence || false,
      statut: intervention?.statut || 'PLANIFIEE'
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
        
        {!intervention && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Statut Initial
            </label>
            <select
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              value={formData.statut}
              onChange={(e) => handleChange('statut', e.target.value)}
            >
              <option value="PLANIFIEE">Planifiée</option>
              <option value="EN_COURS">En Cours</option>
            </select>
          </div>
        )}
        
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

  // Enhanced Intervention Detail Modal with Workflow Management
  const InterventionDetailModal = ({ intervention }) => {
    const { data: workflow, isLoading: workflowLoading, refetch: refetchWorkflow } = useInterventionWorkflow(intervention?.id);
    const [activeTab, setActiveTab] = useState('info');
    
    // Form states for different phases
    const [diagnosticData, setDiagnosticData] = useState({
      travailRequis: [],
      besoinPDR: [],
      chargesRealisees: []
    });
    
    const [planificationData, setPlanificationData] = useState({
      capaciteExecution: '',
      urgencePrise: false,
      disponibilitePDR: false
    });
    
    const [controleQualiteData, setControleQualiteData] = useState({
      resultatsEssais: '',
      analyseVibratoire: ''
    });

    // Form field states for adding new items
    const [newTravail, setNewTravail] = useState('');
    const [newPDR, setNewPDR] = useState('');
    const [newCharge, setNewCharge] = useState('');

    // Initialize form data when workflow loads
    React.useEffect(() => {
      if (workflow?.intervention) {
        if (workflow.intervention.diagnostic) {
          setDiagnosticData({
            travailRequis: workflow.intervention.diagnostic.travailRequis || [],
            besoinPDR: workflow.intervention.diagnostic.besoinPDR || [],
            chargesRealisees: workflow.intervention.diagnostic.chargesRealisees || []
          });
        }
        if (workflow.intervention.planification) {
          setPlanificationData({
            capaciteExecution: workflow.intervention.planification.capaciteExecution || '',
            urgencePrise: workflow.intervention.planification.urgencePrise || false,
            disponibilitePDR: workflow.intervention.planification.disponibilitePDR || false
          });
        }
        if (workflow.intervention.controleQualite) {
          setControleQualiteData({
            resultatsEssais: workflow.intervention.controleQualite.resultatsEssais || '',
            analyseVibratoire: workflow.intervention.controleQualite.analyseVibratoire || ''
          });
        }
      }
    }, [workflow]);

    const handleStatusChange = async (newStatus) => {
      try {
        await updateStatusMutation.mutateAsync({ id: intervention.id, status: newStatus });
        refetchWorkflow();
        // Refresh the main interventions list
        interventionsQuery.refetch();
      } catch (error) {
        console.error('Status update error:', error);
      }
    };

    const handleDiagnosticSubmit = async () => {
      try {
        await updateDiagnosticMutation.mutateAsync({ 
          id: intervention.id, 
          data: diagnosticData 
        });
        refetchWorkflow();
      } catch (error) {
        console.error('Diagnostic update error:', error);
      }
    };

    const handlePlanificationSubmit = async () => {
      try {
        await updatePlanificationMutation.mutateAsync({ 
          id: intervention.id, 
          data: planificationData 
        });
        refetchWorkflow();
      } catch (error) {
        console.error('Planification update error:', error);
      }
    };

    const handleControleQualiteSubmit = async () => {
      try {
        await addControleQualiteMutation.mutateAsync({ 
          id: intervention.id, 
          data: controleQualiteData 
        });
        refetchWorkflow();
      } catch (error) {
        console.error('Controle qualité update error:', error);
      }
    };

    // Helper functions for managing arrays
    const addToArray = (arrayName, value, setterFunction) => {
      if (value.trim()) {
        setterFunction(prev => ({
          ...prev,
          [arrayName]: [...prev[arrayName], value.trim()]
        }));
      }
    };

    const removeFromArray = (arrayName, index, setterFunction) => {
      setterFunction(prev => ({
        ...prev,
        [arrayName]: prev[arrayName].filter((_, i) => i !== index)
      }));
    };

    if (workflowLoading) {
      return <LoadingSpinner text="Chargement du workflow..." />;
    }

    const validNextStatuses = getValidNextStatuses(intervention.statut);

    return (
      <div className="space-y-6">
        {/* Intervention Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-6 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-bold mb-2">{intervention.equipement?.nom}</h3>
              <p className="text-blue-100">{intervention.equipement?.proprietaire?.nom_entreprise}</p>
              <p className="text-blue-200 text-sm mt-1">
                Créée le {formatDate(intervention.date)} par {intervention.creerPar?.nom}
              </p>
            </div>
            <div className="text-right">
              <StatusBadge status={intervention.statut} urgence={intervention.urgence} />
              {/* Status Change Dropdown */}
              {hasPermission('interventions:update') && validNextStatuses.length > 0 && (
                <div className="mt-3">
                  <select
                    className="bg-white text-gray-900 px-3 py-1 rounded text-sm"
                    value=""
                    onChange={(e) => e.target.value && handleStatusChange(e.target.value)}
                    disabled={updateStatusMutation.isPending}
                  >
                    <option value="">Changer le statut</option>
                    {validNextStatuses.map(status => (
                      <option key={status} value={status}>
                        {STATUS_LABELS[status]}
                      </option>
                    ))}
                  </select>
                  {updateStatusMutation.isPending && (
                    <div className="mt-1 text-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Workflow Progress Bar */}
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <h4 className="font-semibold text-gray-900 mb-4">Progression du Workflow</h4>
          <div className="flex items-center justify-between">
            {Object.entries(workflow?.phases || {}).map(([phase, data], index, array) => {
              const isCompleted = data.completed;
              const isActive = !isCompleted && index === array.findIndex(([, p]) => !p.completed);
              
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
                  {index < array.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-4 ${
                      isCompleted ? 'bg-green-500' : 'bg-gray-300'
                    }`}></div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Workflow Tabs */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'info', label: 'Informations', icon: FileText },
                { id: 'diagnostic', label: 'Diagnostic', icon: Stethoscope },
                { id: 'planification', label: 'Planification', icon: Calendar },
                { id: 'controle', label: 'Contrôle Qualité', icon: Shield }
              ].map(tab => {
                const Icon = tab.icon;
                const isCompleted = workflow?.phases?.[tab.id]?.completed;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-3 py-4 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                    {isCompleted && <CheckCircle className="w-4 h-4 text-green-500" />}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {/* Information Tab */}
            {activeTab === 'info' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Détails de l'Intervention</h4>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-gray-500">Équipement:</span>
                        <p className="text-sm text-gray-900">{intervention.equipement?.nom}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Type:</span>
                        <p className="text-sm text-gray-900">{intervention.equipement?.type_equipement?.replace('_', ' ')}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Marque/Modèle:</span>
                        <p className="text-sm text-gray-900">{intervention.equipement?.marque} {intervention.equipement?.modele}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Client:</span>
                        <p className="text-sm text-gray-900">{intervention.equipement?.proprietaire?.nom_entreprise}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Date:</span>
                        <p className="text-sm text-gray-900">{formatDate(intervention.date)}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Créé par:</span>
                        <p className="text-sm text-gray-900">{intervention.creerPar?.nom}</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Statut et Progression</h4>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-gray-500">Statut actuel:</span>
                        <div className="mt-1">
                          <StatusBadge status={intervention.statut} urgence={intervention.urgence} />
                        </div>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Prochaines actions possibles:</span>
                        <div className="mt-1">
                          {validNextStatuses.length > 0 ? (
                            <div className="space-y-1">
                              {validNextStatuses.map(status => (
                                <span key={status} className="inline-block bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs mr-2">
                                  {STATUS_LABELS[status]}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-500">Aucune action disponible</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {intervention.description && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                      {intervention.description}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Diagnostic Tab */}
            {activeTab === 'diagnostic' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-gray-900">Phase Diagnostic</h4>
                  {hasPermission('interventions:update') && (
                    <button
                      onClick={handleDiagnosticSubmit}
                      disabled={updateDiagnosticMutation.isPending}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                    >
                      {updateDiagnosticMutation.isPending ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      <span>Enregistrer</span>
                    </button>
                  )}
                </div>

                {/* Travail Requis */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Travail Requis
                  </label>
                  <div className="space-y-2">
                    {diagnosticData.travailRequis.map((item, index) => (
                      <div key={index} className="flex items-center space-x-2 bg-gray-50 p-2 rounded">
                        <span className="flex-1 text-sm">{item}</span>
                        <button
                          onClick={() => removeFromArray('travailRequis', index, setDiagnosticData)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        placeholder="Ajouter un travail requis..."
                        className="flex-1 p-2 border rounded-lg"
                        value={newTravail}
                        onChange={(e) => setNewTravail(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && newTravail.trim()) {
                            addToArray('travailRequis', newTravail, setDiagnosticData);
                            setNewTravail('');
                          }
                        }}
                      />
                      <button
                        onClick={() => {
                          if (newTravail.trim()) {
                            addToArray('travailRequis', newTravail, setDiagnosticData);
                            setNewTravail('');
                          }
                        }}
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
                    {diagnosticData.besoinPDR.map((item, index) => (
                      <div key={index} className="flex items-center space-x-2 bg-gray-50 p-2 rounded">
                        <span className="flex-1 text-sm">{item}</span>
                        <button
                          onClick={() => removeFromArray('besoinPDR', index, setDiagnosticData)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        placeholder="Ajouter une pièce de rechange..."
                        className="flex-1 p-2 border rounded-lg"
                        value={newPDR}
                        onChange={(e) => setNewPDR(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && newPDR.trim()) {
                            addToArray('besoinPDR', newPDR, setDiagnosticData);
                            setNewPDR('');
                          }
                        }}
                      />
                      <button
                        onClick={() => {
                          if (newPDR.trim()) {
                            addToArray('besoinPDR', newPDR, setDiagnosticData);
                            setNewPDR('');
                          }
                        }}
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
                    {diagnosticData.chargesRealisees.map((item, index) => (
                      <div key={index} className="flex items-center space-x-2 bg-gray-50 p-2 rounded">
                        <span className="flex-1 text-sm">{item}</span>
                        <button
                          onClick={() => removeFromArray('chargesRealisees', index, setDiagnosticData)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        placeholder="Ajouter une charge réalisée..."
                        className="flex-1 p-2 border rounded-lg"
                        value={newCharge}
                        onChange={(e) => setNewCharge(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && newCharge.trim()) {
                            addToArray('chargesRealisees', newCharge, setDiagnosticData);
                            setNewCharge('');
                          }
                        }}
                      />
                      <button
                        onClick={() => {
                          if (newCharge.trim()) {
                            addToArray('chargesRealisees', newCharge, setDiagnosticData);
                            setNewCharge('');
                          }
                        }}
                        className="bg-gray-200 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-300"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Planification Tab */}
            {activeTab === 'planification' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-gray-900">Phase Planification</h4>
                  {hasPermission('interventions:update') && (
                    <button
                      onClick={handlePlanificationSubmit}
                      disabled={updatePlanificationMutation.isPending}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                    >
                      {updatePlanificationMutation.isPending ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      <span>Enregistrer</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Capacité d'Exécution (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      className="w-full p-2 border rounded-lg"
                      placeholder="Pourcentage de capacité..."
                      value={planificationData.capaciteExecution}
                      onChange={(e) => setPlanificationData(prev => ({
                        ...prev,
                        capaciteExecution: e.target.value
                      }))}
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        checked={planificationData.urgencePrise}
                        onChange={(e) => setPlanificationData(prev => ({
                          ...prev,
                          urgencePrise: e.target.checked
                        }))}
                      />
                      <span className="text-sm font-medium text-gray-700">Urgence Prise en Compte</span>
                    </label>

                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        checked={planificationData.disponibilitePDR}
                        onChange={(e) => setPlanificationData(prev => ({
                          ...prev,
                          disponibilitePDR: e.target.checked
                        }))}
                      />
                      <span className="text-sm font-medium text-gray-700">Pièces de Rechange Disponibles</span>
                    </label>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h5 className="font-medium text-blue-900 mb-2">Notes de Planification</h5>
                  <p className="text-sm text-blue-800">
                    • La capacité d'exécution indique le pourcentage de ressources allouées à cette intervention
                  </p>
                  <p className="text-sm text-blue-800">
                    • Cocher "Urgence Prise en Compte" si l'urgence de l'intervention a été considérée dans la planification
                  </p>
                  <p className="text-sm text-blue-800">
                    • Cocher "Pièces de Rechange Disponibles" une fois que toutes les pièces nécessaires sont en stock
                  </p>
                </div>
              </div>
            )}

            {/* Contrôle Qualité Tab */}
            {activeTab === 'controle' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-gray-900">Contrôle Qualité</h4>
                  {hasPermission('interventions:update') && (
                    <button
                      onClick={handleControleQualiteSubmit}
                      disabled={addControleQualiteMutation.isPending}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                    >
                      {addControleQualiteMutation.isPending ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      <span>Enregistrer</span>
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Résultats des Essais
                    </label>
                    <textarea
                      rows={4}
                      className="w-full p-3 border rounded-lg"
                      placeholder="Décrivez les résultats des essais effectués..."
                      value={controleQualiteData.resultatsEssais}
                      onChange={(e) => setControleQualiteData(prev => ({
                        ...prev,
                        resultatsEssais: e.target.value
                      }))}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Analyse Vibratoire
                    </label>
                    <textarea
                      rows={4}
                      className="w-full p-3 border rounded-lg"
                      placeholder="Résultats de l'analyse vibratoire..."
                      value={controleQualiteData.analyseVibratoire}
                      onChange={(e) => setControleQualiteData(prev => ({
                        ...prev,
                        analyseVibratoire: e.target.value
                      }))}
                    />
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h5 className="font-medium text-green-900 mb-2">Guide du Contrôle Qualité</h5>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• Documenter tous les tests effectués après l'intervention</li>
                    <li>• Inclure les mesures de performance et les paramètres de fonctionnement</li>
                    <li>• Noter toute anomalie ou point d'attention pour le suivi</li>
                    <li>• L'analyse vibratoire permet de détecter les déséquilibres ou usures</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Modal Renderer
  const renderModal = () => {
    if (!showModal) return null;

    const modalConfigs = {
      intervention: {
        title: selectedIntervention ? 'Modifier l\'Intervention' : 'Nouvelle Intervention',
        size: 'md',
        content: (
          <InterventionForm
            intervention={selectedIntervention}
            onSubmit={(data) => {
              if (selectedIntervention) {
                // Update logic would go here - for now just close modal
                console.log('Update intervention:', data);
                closeModal();
              } else {
                createInterventionMutation.mutate(data, {
                  onSuccess: () => closeModal()
                });
              }
            }}
            loading={createInterventionMutation.isPending}
          />
        )
      },
      'intervention-detail': {
        title: 'Détails de l\'Intervention',
        size: '4xl',
        content: <InterventionDetailModal intervention={selectedIntervention} />
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
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-3">
              <Wrench className="w-8 h-8 text-blue-600" />
              <span>Gestion des Interventions</span>
            </h1>
            <p className="text-gray-600 mt-1">Planifiez, suivez et gérez toutes vos interventions de maintenance</p>
          </div>
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

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex-1 max-w-md">
            <SearchInput
              value={searchQuery}
              onChange={handleSearch}
              placeholder="Rechercher une intervention..."
            />
          </div>
          
          <div className="flex space-x-4">
            <select 
              className="px-4 py-2 border rounded-lg"
              value={filters.statut || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, statut: e.target.value || undefined }))}
            >
              <option value="">Tous les statuts</option>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
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

            <button
              onClick={() => interventionsQuery.refetch()}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Actualiser</span>
            </button>
          </div>
        </div>
      </div>

      {/* Interventions Table */}
      <DataTable
        data={interventionsQuery.data?.data || []}
        loading={interventionsQuery.isLoading}
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
            render: (value) => truncateText(value, 40) || 'Aucune description'
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
            totalPages={Math.ceil((interventionsQuery.data?.total || 0) / pageSize)}
            totalItems={interventionsQuery.data?.total || 0}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        }
        emptyMessage="Aucune intervention trouvée"
      />

      {/* Render Modal */}
      {renderModal()}
    </div>
  );
};

export default Interventions;