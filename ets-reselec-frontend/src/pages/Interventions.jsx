// src/pages/Interventions.jsx
import React, { useState } from 'react';
import { 
  Wrench, Plus, Search, Edit, Eye, AlertCircle, CheckCircle, Clock, 
  Pause, X, Play, ArrowRight, Calendar, User, Building, Package,
  Filter, Download, RefreshCw, Settings, FileText, Clipboard,
  Activity, Target, Shield, BarChart, Trash2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import SearchInput from '../components/common/SearchInput';
import Pagination from '../components/common/Pagination';
import StatusBadge from '../components/common/StatusBadge';
import FormField from '../components/forms/FormField';
import Select from '../components/forms/Select';
import LoadingSpinner from '../components/common/LoadingSpinner';

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
import { formatDate, formatDateTime } from '../utils/dateUtils';
import { truncateText } from '../utils/formatUtils';

const Interventions = () => {
  const { user, hasPermission } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [selectedIntervention, setSelectedIntervention] = useState(null);
  const [activeWorkflowStep, setActiveWorkflowStep] = useState('intervention');

  // Data queries
  const { 
    data: interventionsData, 
    isLoading, 
    isError, 
    refetch 
  } = useInterventions({ 
    page: currentPage, 
    limit: pageSize, 
    search: searchQuery,
    ...filters 
  });

  const { data: equipmentData } = useEquipment({ limit: 1000 });

  // Mutations
  const createInterventionMutation = useCreateIntervention();
  const updateStatusMutation = useUpdateInterventionStatus();
  const updateDiagnosticMutation = useUpdateDiagnostic();
  const updatePlanificationMutation = useUpdatePlanification();
  const addControleQualiteMutation = useAddControleQualite();

  // Handlers
  const openModal = (type, intervention = null) => {
    setModalType(type);
    setSelectedIntervention(intervention);
    setShowModal(true);
    setActiveWorkflowStep('intervention');
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedIntervention(null);
    setModalType('');
    setActiveWorkflowStep('intervention');
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

  const handleStatusChange = async (interventionId, newStatus) => {
    try {
      await updateStatusMutation.mutateAsync({ id: interventionId, status: newStatus });
    } catch (error) {
      console.error('Status update error:', error);
    }
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

    const [errors, setErrors] = useState({});

    const handleSubmit = (e) => {
      e.preventDefault();
      
      const newErrors = {};
      if (!formData.equipement_id) {
        newErrors.equipement_id = 'L\'équipement est requis';
      }
      if (!formData.date) {
        newErrors.date = 'La date est requise';
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

    const equipmentOptions = equipmentData?.data?.map(equipment => ({
      value: equipment.id,
      label: `${equipment.nom} - ${equipment.proprietaire?.nom_entreprise}`
    })) || [];

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Équipement"
            name="equipement_id"
            required
            error={errors.equipement_id}
          >
            <Select
              value={equipmentOptions.find(opt => opt.value === parseInt(formData.equipement_id))}
              onChange={(option) => handleChange('equipement_id', option?.value?.toString() || '')}
              options={equipmentOptions}
              placeholder="Sélectionner un équipement"
              searchable
            />
          </FormField>

          <FormField
            label="Date d'intervention"
            name="date"
            required
            error={errors.date}
          >
            <input
              type="date"
              className="form-input"
              value={formData.date}
              onChange={(e) => handleChange('date', e.target.value)}
            />
          </FormField>
        </div>

        <FormField
          label="Description"
          name="description"
        >
          <textarea
            rows={3}
            className="form-input"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Décrivez l'intervention à réaliser..."
          />
        </FormField>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Statut"
            name="statut"
          >
            <select
              className="form-input"
              value={formData.statut}
              onChange={(e) => handleChange('statut', e.target.value)}
            >
              <option value="PLANIFIEE">Planifiée</option>
              <option value="EN_ATTENTE_PDR">En Attente PDR</option>
              <option value="EN_COURS">En Cours</option>
              <option value="TERMINEE">Terminée</option>
            </select>
          </FormField>

          <div className="flex items-center pt-6">
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
            {intervention ? 'Modifier' : 'Créer'}
          </button>
        </div>
      </form>
    );
  };

  // Workflow Management Component
  const WorkflowManager = ({ intervention }) => {
    const { data: workflow, isLoading: workflowLoading } = useInterventionWorkflow(intervention?.id);
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
    const [controleData, setControleData] = useState({
      resultatsEssais: '',
      analyseVibratoire: ''
    });

    if (workflowLoading) {
      return <LoadingSpinner />;
    }

    const steps = [
      { 
        id: 'intervention', 
        label: 'Intervention', 
        icon: Wrench,
        completed: true
      },
      { 
        id: 'diagnostic', 
        label: 'Diagnostic', 
        icon: Activity,
        completed: workflow?.phases?.diagnostic?.completed || false
      },
      { 
        id: 'planification', 
        label: 'Planification', 
        icon: Calendar,
        completed: workflow?.phases?.planification?.completed || false
      },
      { 
        id: 'controle', 
        label: 'Contrôle Qualité', 
        icon: Shield,
        completed: workflow?.phases?.controleQualite?.completed || false
      }
    ];

    const handleDiagnosticSubmit = async (e) => {
      e.preventDefault();
      try {
        await updateDiagnosticMutation.mutateAsync({
          id: intervention.id,
          data: diagnosticData
        });
      } catch (error) {
        console.error('Diagnostic update error:', error);
      }
    };

    const handlePlanificationSubmit = async (e) => {
      e.preventDefault();
      try {
        await updatePlanificationMutation.mutateAsync({
          id: intervention.id,
          data: planificationData
        });
      } catch (error) {
        console.error('Planification update error:', error);
      }
    };

    const handleControleSubmit = async (e) => {
      e.preventDefault();
      try {
        await addControleQualiteMutation.mutateAsync({
          id: intervention.id,
          data: controleData
        });
      } catch (error) {
        console.error('Controle qualite error:', error);
      }
    };

    const addDiagnosticItem = (field, value) => {
      if (!value.trim()) return;
      setDiagnosticData(prev => ({
        ...prev,
        [field]: [...(prev[field] || []), value.trim()]
      }));
    };

    const removeDiagnosticItem = (field, index) => {
      setDiagnosticData(prev => ({
        ...prev,
        [field]: prev[field].filter((_, i) => i !== index)
      }));
    };

    return (
      <div className="space-y-6">
        {/* Workflow Steps Navigation */}
        <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = activeWorkflowStep === step.id;
            const isCompleted = step.completed;
            
            return (
              <React.Fragment key={step.id}>
                <button
                  onClick={() => setActiveWorkflowStep(step.id)}
                  className={`flex flex-col items-center space-y-2 p-3 rounded-lg transition-colors ${
                    isActive ? 'bg-blue-100 text-blue-600' : 
                    isCompleted ? 'bg-green-100 text-green-600' : 
                    'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isCompleted ? 'bg-green-500 text-white' : 
                    isActive ? 'bg-blue-500 text-white' : 
                    'bg-gray-300 text-gray-600'
                  }`}>
                    {isCompleted ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <span className="text-xs font-medium">{step.label}</span>
                </button>
                {index < steps.length - 1 && (
                  <ArrowRight className={`w-5 h-5 ${isCompleted ? 'text-green-500' : 'text-gray-300'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Step Content */}
        <div className="bg-white border rounded-lg p-6">
          {activeWorkflowStep === 'intervention' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Informations de l'Intervention</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Équipement</label>
                  <p className="text-gray-900">{intervention.equipement?.nom}</p>
                  <p className="text-sm text-gray-500">{intervention.equipement?.proprietaire?.nom_entreprise}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <p className="text-gray-900">{formatDate(intervention.date)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                  <div className="flex items-center space-x-2">
                    <StatusBadge status={intervention.statut} urgence={intervention.urgence} />
                    {hasPermission('interventions:update') && (
                      <select
                        className="text-sm border rounded px-2 py-1"
                        value={intervention.statut}
                        onChange={(e) => handleStatusChange(intervention.id, e.target.value)}
                      >
                        <option value="PLANIFIEE">Planifiée</option>
                        <option value="EN_ATTENTE_PDR">En Attente PDR</option>
                        <option value="EN_COURS">En Cours</option>
                        <option value="EN_PAUSE">En Pause</option>
                        <option value="TERMINEE">Terminée</option>
                        <option value="ANNULEE">Annulée</option>
                        <option value="ECHEC">Échec</option>
                      </select>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Créé par</label>
                  <p className="text-gray-900">{intervention.creerPar?.nom}</p>
                </div>
                {intervention.description && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <p className="text-gray-900">{intervention.description}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeWorkflowStep === 'diagnostic' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Phase de Diagnostic</h3>
              <form onSubmit={handleDiagnosticSubmit} className="space-y-6">
                {/* Travail Requis */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Travail Requis</label>
                  <div className="space-y-2">
                    {diagnosticData.travailRequis.map((item, index) => (
                      <div key={index} className="flex items-center space-x-2 bg-gray-50 p-2 rounded">
                        <span className="flex-1">{item}</span>
                        <button
                          type="button"
                          onClick={() => removeDiagnosticItem('travailRequis', index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        className="form-input flex-1"
                        placeholder="Ajouter un élément de travail"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addDiagnosticItem('travailRequis', e.target.value);
                            e.target.value = '';
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          const input = e.target.previousSibling;
                          addDiagnosticItem('travailRequis', input.value);
                          input.value = '';
                        }}
                        className="btn btn-secondary"
                      >
                        Ajouter
                      </button>
                    </div>
                  </div>
                </div>

                {/* Besoin PDR */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Besoin Pièces de Rechange</label>
                  <div className="space-y-2">
                    {diagnosticData.besoinPDR.map((item, index) => (
                      <div key={index} className="flex items-center space-x-2 bg-gray-50 p-2 rounded">
                        <span className="flex-1">{item}</span>
                        <button
                          type="button"
                          onClick={() => removeDiagnosticItem('besoinPDR', index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        className="form-input flex-1"
                        placeholder="Ajouter une pièce de rechange"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addDiagnosticItem('besoinPDR', e.target.value);
                            e.target.value = '';
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          const input = e.target.previousSibling;
                          addDiagnosticItem('besoinPDR', input.value);
                          input.value = '';
                        }}
                        className="btn btn-secondary"
                      >
                        Ajouter
                      </button>
                    </div>
                  </div>
                </div>

                {/* Charges Réalisées */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Charges Réalisées</label>
                  <div className="space-y-2">
                    {diagnosticData.chargesRealisees.map((item, index) => (
                      <div key={index} className="flex items-center space-x-2 bg-gray-50 p-2 rounded">
                        <span className="flex-1">{item}</span>
                        <button
                          type="button"
                          onClick={() => removeDiagnosticItem('chargesRealisees', index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        className="form-input flex-1"
                        placeholder="Ajouter une charge réalisée"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addDiagnosticItem('chargesRealisees', e.target.value);
                            e.target.value = '';
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          const input = e.target.previousSibling;
                          addDiagnosticItem('chargesRealisees', input.value);
                          input.value = '';
                        }}
                        className="btn btn-secondary"
                      >
                        Ajouter
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={updateDiagnosticMutation.isPending}
                  className="btn btn-primary"
                >
                  {updateDiagnosticMutation.isPending && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>}
                  Enregistrer le Diagnostic
                </button>
              </form>
            </div>
          )}

          {activeWorkflowStep === 'planification' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Phase de Planification</h3>
              <form onSubmit={handlePlanificationSubmit} className="space-y-6">
                <FormField
                  label="Capacité d'Exécution"
                  name="capaciteExecution"
                >
                  <input
                    type="number"
                    className="form-input"
                    value={planificationData.capaciteExecution}
                    onChange={(e) => setPlanificationData(prev => ({ 
                      ...prev, 
                      capaciteExecution: e.target.value 
                    }))}
                    placeholder="Nombre d'heures estimées"
                  />
                </FormField>

                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="urgencePrise"
                      className="mr-2"
                      checked={planificationData.urgencePrise}
                      onChange={(e) => setPlanificationData(prev => ({ 
                        ...prev, 
                        urgencePrise: e.target.checked 
                      }))}
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
                      checked={planificationData.disponibilitePDR}
                      onChange={(e) => setPlanificationData(prev => ({ 
                        ...prev, 
                        disponibilitePDR: e.target.checked 
                      }))}
                    />
                    <label htmlFor="disponibilitePDR" className="text-sm font-medium text-gray-700">
                      Pièces de rechange disponibles
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={updatePlanificationMutation.isPending}
                  className="btn btn-primary"
                >
                  {updatePlanificationMutation.isPending && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>}
                  Enregistrer la Planification
                </button>
              </form>
            </div>
          )}

          {activeWorkflowStep === 'controle' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Phase de Contrôle Qualité</h3>
              <form onSubmit={handleControleSubmit} className="space-y-6">
                <FormField
                  label="Résultats des Essais"
                  name="resultatsEssais"
                >
                  <textarea
                    rows={4}
                    className="form-input"
                    value={controleData.resultatsEssais}
                    onChange={(e) => setControleData(prev => ({ 
                      ...prev, 
                      resultatsEssais: e.target.value 
                    }))}
                    placeholder="Décrivez les résultats des essais effectués..."
                  />
                </FormField>

                <FormField
                  label="Analyse Vibratoire"
                  name="analyseVibratoire"
                >
                  <textarea
                    rows={4}
                    className="form-input"
                    value={controleData.analyseVibratoire}
                    onChange={(e) => setControleData(prev => ({ 
                      ...prev, 
                      analyseVibratoire: e.target.value 
                    }))}
                    placeholder="Résultats de l'analyse vibratoire..."
                  />
                </FormField>

                <button
                  type="submit"
                  disabled={addControleQualiteMutation.isPending}
                  className="btn btn-primary"
                >
                  {addControleQualiteMutation.isPending && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>}
                  Enregistrer le Contrôle Qualité
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Next Actions */}
        {workflow?.nextActions && workflow.nextActions.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Prochaines Actions</h4>
            <ul className="space-y-1">
              {workflow.nextActions.map((action, index) => (
                <li key={index} className="text-sm text-blue-800 flex items-center space-x-2">
                  <Target className="w-4 h-4" />
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  // Intervention Detail Component  
  const InterventionDetail = ({ intervention }) => {
    if (!intervention) return null;

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-orange-800 rounded-lg p-6 text-white">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <Wrench className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Intervention #{intervention.id}</h2>
              <p className="text-orange-100">{intervention.equipement?.nom}</p>
              <p className="text-orange-200 text-sm">{formatDate(intervention.date)}</p>
            </div>
            <div className="ml-auto">
              <StatusBadge status={intervention.statut} urgence={intervention.urgence} />
            </div>
          </div>
        </div>

        {/* Workflow Management */}
        <WorkflowManager intervention={intervention} />
      </div>
    );
  };

  // Table columns configuration
  const columns = [
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
          {value ? truncateText(value, 60) : 'Aucune description'}
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
      render: (value) => formatDate(value)
    },
    { 
      key: 'creerPar', 
      header: 'Créé par',
      render: (value) => (
        <div className="flex items-center space-x-1">
          <User className="w-4 h-4 text-gray-400" />
          <span>{value?.nom || 'N/A'}</span>
        </div>
      )
    }
  ];

  // Table actions
  const actions = [
    {
      icon: Eye,
      label: 'Voir/Gérer',
      onClick: (row) => openModal('workflow', row),
      className: 'text-blue-600 hover:text-blue-800'
    },
    ...(hasPermission('interventions:update') ? [{
      icon: Edit,
      label: 'Modifier',
      onClick: (row) => openModal('edit', row),
      className: 'text-yellow-600 hover:text-yellow-800'
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
          <p className="text-gray-600 mb-4">Impossible de charger les données des interventions</p>
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
              <Wrench className="w-8 h-8 text-orange-600" />
              <span>Gestion des Interventions</span>
            </h1>
            <p className="text-gray-600 mt-1">Planifiez et suivez vos interventions de maintenance</p>
          </div>
          {hasPermission('interventions:create') && (
            <button 
              onClick={() => openModal('create')}
              className="btn btn-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle Intervention
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
              placeholder="Rechercher par équipement, description..."
              className="w-full"
            />
          </div>
          
          <select 
            className="form-input min-w-[200px]"
            value={filters.statut || ''}
            onChange={(e) => handleFilterChange('statut', e.target.value)}
          >
            <option value="">Tous les statuts</option>
            <option value="PLANIFIEE">Planifiée</option>
            <option value="EN_ATTENTE_PDR">En Attente PDR</option>
            <option value="EN_COURS">En Cours</option>
            <option value="EN_PAUSE">En Pause</option>
            <option value="TERMINEE">Terminée</option>
            <option value="ANNULEE">Annulée</option>
            <option value="ECHEC">Échec</option>
          </select>

          <select 
            className="form-input min-w-[150px]"
            value={filters.urgence || ''}
            onChange={(e) => handleFilterChange('urgence', e.target.value)}
          >
            <option value="">Toutes</option>
            <option value="true">Urgentes</option>
            <option value="false">Normales</option>
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
        data={interventionsData?.data || []}
        columns={columns}
        loading={isLoading}
        actions={hasPermission('interventions:read') ? actions : null}
        emptyMessage="Aucune intervention trouvée"
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

      {/* Modal */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={closeModal}
          title={
            modalType === 'create' ? 'Nouvelle Intervention' :
            modalType === 'edit' ? 'Modifier l\'Intervention' :
            modalType === 'workflow' ? 'Gestion de l\'Intervention' : ''
          }
          size={modalType === 'workflow' ? 'xl' : 'lg'}
        >
          {modalType === 'workflow' ? (
            <InterventionDetail intervention={selectedIntervention} />
          ) : (
            <InterventionForm
              intervention={selectedIntervention}
              onSubmit={(data) => {
                if (modalType === 'edit') {
                  // Handle edit - would need update intervention mutation
                  console.log('Update intervention:', data);
                } else {
                  createInterventionMutation.mutate(data);
                }
              }}
              loading={createInterventionMutation.isPending}
            />
          )}
        </Modal>
      )}
    </div>
  );
};

export default Interventions;