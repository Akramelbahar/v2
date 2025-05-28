// src/components/workflow/PlanificationForm.jsx
import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { 
  Calendar, Clock, Users, Package, AlertTriangle, Save, 
  Plus, Trash2, Settings, CheckCircle, X, User
} from 'lucide-react';
import FormField from '../forms/FormField';
import { formatDate, formatDateTime } from '../../utils/dateUtils';
const renderTabContent = () => {
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
            onSubmit={(data) => {
              updateDiagnosticMutation.mutate({ id: intervention.id, data });
            }}
            loading={updateDiagnosticMutation.isPending}
          />
        );

      case 'planification':
        return (
          <PlanificationForm
            planification={workflowData?.phases?.planification?.data}
            onSubmit={(data) => {
              updatePlanificationMutation.mutate({ id: intervention.id, data });
            }}
            loading={updatePlanificationMutation.isPending}
          />
        );

      case 'qualite':
        return (
          <QualityControlForm
            controleQualite={workflowData?.phases?.controleQualite?.data}
            onSubmit={(data) => {
              addControleQualiteMutation.mutate({ id: intervention.id, data });
            }}
            loading={addControleQualiteMutation.isPending}
          />
        );

      default:
        return null;
    }
  };
// Planification Form Component
const PlanificationForm = ({ planification, onSubmit, loading }) => {
    const [formData, setFormData] = useState({
      capaciteExecution: planification?.capaciteExecution || '',
      urgencePrise: planification?.urgencePrise || false,
      disponibilitePDR: planification?.disponibilitePDR || false
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      onSubmit(formData);
    };

    const handleChange = (field, value) => {
      setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Capacité d'Exécution
          </label>
          <input
            type="number"
            min="0"
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            value={formData.capaciteExecution}
            onChange={(e) => handleChange('capaciteExecution', e.target.value)}
            placeholder="Nombre d'heures ou de jours..."
          />
        </div>

        <div className="flex items-center space-x-4">
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
        
        <div className="flex justify-end space-x-2 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center space-x-2"
          >
            {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
            <Save className="w-4 h-4" />
            <span>Enregistrer Planification</span>
          </button>
        </div>
      </form>
    );
  };

  // Quality Control Form Component
  const QualityControlForm = ({ controleQualite, onSubmit, loading }) => {
    const [formData, setFormData] = useState({
      resultatsEssais: controleQualite?.resultatsEssais || '',
      analyseVibratoire: controleQualite?.analyseVibratoire || ''
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      onSubmit(formData);
    };

    const handleChange = (field, value) => {
      setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
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
        
        <div className="flex justify-end space-x-2 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
          >
            {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
            <Save className="w-4 h-4" />
            <span>Enregistrer Contrôle Qualité</span>
          </button>
        </div>
      </form>
    );
  };

export default PlanificationForm;