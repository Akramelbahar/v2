// src/components/interventions/InterventionDetail.jsx
import React, { useState } from 'react';
import { 
  ArrowLeft, Edit, Trash2, Download, Share2, Clock, 
  User, Building, Package, Calendar, AlertTriangle, 
  CheckCircle, FileText, Settings, Target, Play,
  Pause, RefreshCw, MessageSquare
} from 'lucide-react';
import WorkflowPipeline from '../workflow/WorkflowPipeline';
import DiagnosticForm from '../workflow/DiagnosticForm';
import PlanificationForm from '../workflow/PlanificationForm';
import ControleQualiteForm from '../workflow/ControleQualiteForm';
import StatusBadge from '../common/StatusBadge';
import Modal from '../common/Modal';
import ConfirmDialog from '../common/ConfirmDialog';
import LoadingSpinner from '../common/LoadingSpinner';
import { useInterventionWorkflow, useUpdateDiagnostic, useUpdatePlanification, useAddControleQualite, useUpdateInterventionStatus } from '../../hooks/useInterventions';
import { useAuth } from '../../context/AuthContext';
import { formatDate, formatDateTime } from '../../utils/dateUtils';
import { formatCurrency } from '../../utils/formatUtils';

const InterventionDetail = ({ 
  intervention, 
  onBack, 
  onEdit, 
  onDelete, 
  onStatusChange 
}) => {
  const { hasPermission } = useAuth();
  const [activeModal, setActiveModal] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(null);
  
  // Fetch workflow data
  const { data: workflow, isLoading: workflowLoading, refetch: refetchWorkflow } = useInterventionWorkflow(intervention?.id);
  
  // Mutations
  const updateDiagnosticMutation = useUpdateDiagnostic();
  const updatePlanificationMutation = useUpdatePlanification();
  const addControleQualiteMutation = useAddControleQualite();
  const updateStatusMutation = useUpdateInterventionStatus();

  // Handle phase clicks
  const handlePhaseClick = (phaseId, phaseData) => {
    setCurrentPhase({ id: phaseId, data: phaseData });
    setActiveModal(phaseId);
  };

  // Handle phase submissions
  const handleDiagnosticSubmit = async (data) => {
    try {
      await updateDiagnosticMutation.mutateAsync({ id: intervention.id, data });
      setActiveModal(null);
      refetchWorkflow();
    } catch (error) {
      console.error('Diagnostic update error:', error);
    }
  };

  const handlePlanificationSubmit = async (data) => {
    try {
      await updatePlanificationMutation.mutateAsync({ id: intervention.id, data });
      setActiveModal(null);
      refetchWorkflow();
    } catch (error) {
      console.error('Planification update error:', error);
    }
  };

  const handleControleQualiteSubmit = async (data) => {
    try {
      await addControleQualiteMutation.mutateAsync({ id: intervention.id, data });
      setActiveModal(null);
      refetchWorkflow();
    } catch (error) {
      console.error('Controle qualite error:', error);
    }
  };

  // Handle status changes
  const handleStatusChange = async (newStatus) => {
    try {
      await updateStatusMutation.mutateAsync({ id: intervention.id, status: newStatus });
      refetchWorkflow();
      if (onStatusChange) onStatusChange(intervention, newStatus);
    } catch (error) {
      console.error('Status update error:', error);
    }
  };

  // Get available status transitions
  const getAvailableStatuses = () => {
    const currentStatus = intervention?.statut;
    const transitions = {
      'PLANIFIEE': ['EN_ATTENTE_PDR', 'ANNULEE'],
      'EN_ATTENTE_PDR': ['EN_COURS', 'ANNULEE'],
      'EN_COURS': ['EN_PAUSE', 'TERMINEE', 'ECHEC'],
      'EN_PAUSE': ['EN_COURS', 'ANNULEE'],
      'TERMINEE': [],
      'ANNULEE': [],
      'ECHEC': ['EN_COURS']
    };
    
    return transitions[currentStatus] || [];
  };

  // Get next recommended action
  const getNextAction = () => {
    const status = intervention?.statut;
    const actions = {
      'PLANIFIEE': { label: 'Commencer le diagnostic', action: () => handlePhaseClick('diagnostic') },
      'EN_ATTENTE_PDR': { label: 'Planifier les ressources', action: () => handlePhaseClick('planification') },
      'EN_COURS': { label: 'Effectuer contrôle qualité', action: () => handlePhaseClick('controleQualite') },
      'TERMINEE': { label: 'Générer rapport', action: () => {} }
    };
    
    return actions[status];
  };

  if (!intervention) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Intervention non trouvée</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-2xl font-bold text-gray-900">
                    Intervention #{intervention.id}
                  </h1>
                  <StatusBadge status={intervention.statut} urgence={intervention.urgence} />
                </div>
                <p className="text-gray-600">
                  {intervention.equipement?.nom} - {intervention.equipement?.proprietaire?.nom_entreprise}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Quick Actions */}
              {getNextAction() && (
                <button
                  onClick={getNextAction().action}
                  className="btn btn-primary"
                  disabled={!hasPermission('interventions:update')}
                >
                  <Play className="w-4 h-4 mr-2" />
                  {getNextAction().label}
                </button>
              )}
              
              {/* Status Change */}
              {getAvailableStatuses().length > 0 && hasPermission('interventions:update') && (
                <select
                  onChange={(e) => e.target.value && handleStatusChange(e.target.value)}
                  className="form-input"
                  defaultValue=""
                >
                  <option value="">Changer statut</option>
                  {getAvailableStatuses().map(status => (
                    <option key={status} value={status}>
                      {status.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              )}
              
              {/* More Actions */}
              <button className="btn btn-secondary">
                <Download className="w-4 h-4 mr-2" />
                Exporter
              </button>
              
              {hasPermission('interventions:update') && (
                <button
                  onClick={() => onEdit(intervention)}
                  className="btn btn-secondary"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Modifier
                </button>
              )}
              
              {hasPermission('interventions:delete') && (
                <button
                  onClick={() => setShowDeleteDialog(true)}
                  className="btn btn-secondary text-red-600 hover:text-red-800"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="xl:col-span-2 space-y-6">
          {/* Workflow Pipeline */}
          {workflowLoading ? (
            <div className="bg-white rounded-lg shadow-sm border p-8">
              <LoadingSpinner text="Chargement du workflow..." />
            </div>
          ) : (
            <WorkflowPipeline
              intervention={intervention}
              workflow={workflow}
              onPhaseClick={handlePhaseClick}
              showDetails={true}
            />
          )}

          {/* Description */}
          {intervention.description && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <span>Description</span>
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {intervention.description}
              </p>
            </div>
          )}

          {/* Workflow Phase Details */}
          {workflow && (
            <div className="space-y-4">
              {/* Diagnostic Details */}
              {workflow.phases?.diagnostic && (
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                      <Search className="w-5 h-5 text-blue-600" />
                      <span>Diagnostic</span>
                    </h3>
                    {hasPermission('interventions:update') && (
                      <button
                        onClick={() => handlePhaseClick('diagnostic', workflow.phases.diagnostic)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-gray-900">Problème identifié:</p>
                      <p className="text-gray-600">
                        {workflow.phases.diagnostic.probleme_identifie || 'Non spécifié'}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Gravité:</p>
                      <p className="text-gray-600">
                        {workflow.phases.diagnostic.gravite || 'Non évaluée'}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Travaux requis:</p>
                      <p className="text-gray-600">
                        {workflow.phases.diagnostic.travailRequis?.length || 0} tâche(s)
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Pièces nécessaires:</p>
                      <p className="text-gray-600">
                        {workflow.phases.diagnostic.besoinPDR?.length || 0} pièce(s)
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Planification Details */}
              {workflow.phases?.planification && (
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                      <Settings className="w-5 h-5 text-orange-600" />
                      <span>Planification</span>
                    </h3>
                    {hasPermission('interventions:update') && (
                      <button
                        onClick={() => handlePhaseClick('planification', workflow.phases.planification)}
                        className="text-orange-600 hover:text-orange-800"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-gray-900">Durée estimée:</p>
                      <p className="text-gray-600">
                        {workflow.phases.planification.duree_totale_estimee || 'Non spécifiée'}h
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Techniciens:</p>
                      <p className="text-gray-600">
                        {workflow.phases.planification.capaciteExecution || 'Non spécifié'}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Coût estimé:</p>
                      <p className="text-gray-600">
                        {workflow.phases.planification.cout_total_estime 
                          ? formatCurrency(workflow.phases.planification.cout_total_estime)
                          : 'Non estimé'
                        }
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">PDR disponible:</p>
                      <p className="text-gray-600">
                        {workflow.phases.planification.disponibilitePDR ? 'Oui' : 'Non'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Quality Control Details */}
              {workflow.phases?.controleQualite && (
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                      <Target className="w-5 h-5 text-green-600" />
                      <span>Contrôle Qualité</span>
                    </h3>
                    {hasPermission('interventions:update') && (
                      <button
                        onClick={() => handlePhaseClick('controleQualite', workflow.phases.controleQualite)}
                        className="text-green-600 hover:text-green-800"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-gray-900">Évaluation:</p>
                      <p className="text-gray-600">
                        {workflow.phases.controleQualite.evaluation_globale || 'Non évaluée'}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Tests effectués:</p>
                      <p className="text-gray-600">
                        {workflow.phases.controleQualite.tests_effectues?.length || 0}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Validateur:</p>
                      <p className="text-gray-600">
                        {workflow.phases.controleQualite.validateur || 'Non spécifié'}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Date contrôle:</p>
                      <p className="text-gray-600">
                        {workflow.phases.controleQualite.dateControle 
                          ? formatDate(workflow.phases.controleQualite.dateControle)
                          : 'Non effectué'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Equipment Info */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <Package className="w-5 h-5 text-gray-600" />
              <span>Équipement</span>
            </h3>
            
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-medium text-gray-900">Nom:</p>
                <p className="text-gray-600">{intervention.equipement?.nom}</p>
              </div>
              <div>
                <p className="font-medium text-gray-900">Marque/Modèle:</p>
                <p className="text-gray-600">
                  {intervention.equipement?.marque} {intervention.equipement?.modele}
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-900">Type:</p>
                <p className="text-gray-600">
                  {intervention.equipement?.type_equipement?.replace('_', ' ') || 'Non spécifié'}
                </p>
              </div>
              {intervention.equipement?.cout && (
                <div>
                  <p className="font-medium text-gray-900">Valeur:</p>
                  <p className="text-gray-600">{formatCurrency(intervention.equipement.cout)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Client Info */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <Building className="w-5 h-5 text-gray-600" />
              <span>Client</span>
            </h3>
            
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-medium text-gray-900">Entreprise:</p>
                <p className="text-gray-600">{intervention.equipement?.proprietaire?.nom_entreprise}</p>
              </div>
              <div>
                <p className="font-medium text-gray-900">Contact:</p>
                <p className="text-gray-600">{intervention.equipement?.proprietaire?.contact_principal}</p>
              </div>
              <div>
                <p className="font-medium text-gray-900">Téléphone:</p>
                <p className="text-gray-600">{intervention.equipement?.proprietaire?.telephone_contact}</p>
              </div>
              <div>
                <p className="font-medium text-gray-900">Email:</p>
                <p className="text-gray-600">{intervention.equipement?.proprietaire?.email_contact}</p>
              </div>
            </div>
          </div>

          {/* Intervention Info */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-gray-600" />
              <span>Informations</span>
            </h3>
            
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-medium text-gray-900">Date planifiée:</p>
                <p className="text-gray-600">{formatDate(intervention.date)}</p>
              </div>
              <div>
                <p className="font-medium text-gray-900">Type:</p>
                <p className="text-gray-600">
                  {intervention.type_intervention?.toLowerCase() || 'Non spécifié'}
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-900">Priorité:</p>
                <p className="text-gray-600">
                  {intervention.priorite?.toLowerCase() || 'Normale'}
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-900">Créé par:</p>
                <p className="text-gray-600 flex items-center space-x-1">
                  <User className="w-3 h-3" />
                  <span>{intervention.creerPar?.nom}</span>
                </p>
              </div>
              {intervention.duree_estimee && (
                <div>
                  <p className="font-medium text-gray-900">Durée estimée:</p>
                  <p className="text-gray-600">{intervention.duree_estimee}h</p>
                </div>
              )}
              {intervention.cout_estime && (
                <div>
                  <p className="font-medium text-gray-900">Coût estimé:</p>
                  <p className="text-gray-600">{formatCurrency(intervention.cout_estime)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <Clock className="w-5 h-5 text-gray-600" />
              <span>Chronologie</span>
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div>
                  <p className="font-medium">Intervention créée</p>
                  <p className="text-gray-500">{formatDateTime(intervention.createdAt || intervention.date)}</p>
                </div>
              </div>
              
              {workflow?.phases?.diagnostic?.dateCreation && (
                <div className="flex items-center space-x-2 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="font-medium">Diagnostic complété</p>
                    <p className="text-gray-500">{formatDateTime(workflow.phases.diagnostic.dateCreation)}</p>
                  </div>
                </div>
              )}
              
              {workflow?.phases?.planification?.dateCreation && (
                <div className="flex items-center space-x-2 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="font-medium">Planification complétée</p>
                    <p className="text-gray-500">{formatDateTime(workflow.phases.planification.dateCreation)}</p>
                  </div>
                </div>
              )}
              
              {workflow?.phases?.controleQualite?.dateControle && (
                <div className="flex items-center space-x-2 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="font-medium">Contrôle qualité effectué</p>
                    <p className="text-gray-500">{formatDateTime(workflow.phases.controleQualite.dateControle)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {activeModal === 'diagnostic' && (
        <Modal
          isOpen={true}
          onClose={() => setActiveModal(null)}
          title="Phase Diagnostic"
          size="4xl"
        >
          <DiagnosticForm
            intervention={intervention}
            diagnostic={currentPhase?.data}
            onSubmit={handleDiagnosticSubmit}
            onCancel={() => setActiveModal(null)}
            loading={updateDiagnosticMutation.isPending}
          />
        </Modal>
      )}

      {activeModal === 'planification' && (
        <Modal
          isOpen={true}
          onClose={() => setActiveModal(null)}
          title="Phase Planification"
          size="4xl"
        >
          <PlanificationForm
            intervention={intervention}
            planification={currentPhase?.data}
            diagnostic={workflow?.phases?.diagnostic}
            onSubmit={handlePlanificationSubmit}
            onCancel={() => setActiveModal(null)}
            loading={updatePlanificationMutation.isPending}
          />
        </Modal>
      )}

      {activeModal === 'controleQualite' && (
        <Modal
          isOpen={true}
          onClose={() => setActiveModal(null)}
          title="Phase Contrôle Qualité"
          size="4xl"
        >
          <ControleQualiteForm
            intervention={intervention}
            controleQualite={currentPhase?.data}
            diagnostic={workflow?.phases?.diagnostic}
            planification={workflow?.phases?.planification}
            onSubmit={handleControleQualiteSubmit}
            onCancel={() => setActiveModal(null)}
            loading={addControleQualiteMutation.isPending}
          />
        </Modal>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={() => {
          onDelete(intervention);
          setShowDeleteDialog(false);
        }}
        title="Supprimer l'intervention"
        message="Êtes-vous sûr de vouloir supprimer cette intervention ? Cette action est irréversible."
        type="danger"
        confirmText="Supprimer"
      />
    </div>
  );
};

export default InterventionDetail;