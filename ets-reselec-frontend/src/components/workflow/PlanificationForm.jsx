// src/components/workflow/PlanificationForm.jsx
import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { 
  Calendar, Clock, Users, Package, AlertTriangle, Save, 
  Plus, Trash2, Settings, CheckCircle, X, User
} from 'lucide-react';
import FormField from '../forms/FormField';
import { formatDate, formatDateTime } from '../../utils/dateUtils';

const PlanificationForm = ({ 
  intervention, 
  planification, 
  diagnostic,
  onSubmit, 
  onCancel, 
  loading = false 
}) => {
  const [activeTab, setActiveTab] = useState('schedule');
  
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    watch,
    setValue
  } = useForm({
    defaultValues: {
      // Scheduling
      date_debut_prevue: planification?.date_debut_prevue || '',
      date_fin_prevue: planification?.date_fin_prevue || '',
      duree_totale_estimee: planification?.duree_totale_estimee || diagnostic?.travailRequis?.reduce((total, travail) => 
        total + parseFloat(travail.duree_estimee || 0), 0) || '',
      
      // Resources
      capaciteExecution: planification?.capaciteExecution || 1,
      techniciens_assignes: planification?.techniciens_assignes || [{ nom: '', specialite: '', disponible: true }],
      
      // Spare parts management
      disponibilitePDR: planification?.disponibilitePDR || false,
      pieces_commandees: planification?.pieces_commandees || [],
      pieces_en_stock: planification?.pieces_en_stock || [],
      
      // Urgency and priority
      urgencePrise: planification?.urgencePrise || intervention?.urgence || false,
      priorite_planification: planification?.priorite_planification || 'NORMALE',
      
      // Constraints and conditions
      contraintes: planification?.contraintes || '',
      conditions_prerequises: planification?.conditions_prerequises || '',
      risques_identifies: planification?.risques_identifies || '',
      
      // Cost estimation
      cout_main_oeuvre: planification?.cout_main_oeuvre || '',
      cout_pieces: planification?.cout_pieces || '',
      cout_total_estime: planification?.cout_total_estime || ''
    }
  });

  // Field arrays
  const { 
    fields: techniciensFields, 
    append: appendTechnicien, 
    remove: removeTechnicien 
  } = useFieldArray({
    control,
    name: 'techniciens_assignes'
  });

  // Watch for automatic calculations
  const coutMainOeuvre = watch('cout_main_oeuvre');
  const coutPieces = watch('cout_pieces');
  const dateDebut = watch('date_debut_prevue');
  const dureeEstimee = watch('duree_totale_estimee');

  // Auto-calculate end date
  React.useEffect(() => {
    if (dateDebut && dureeEstimea) {
      const debut = new Date(dateDebut);
      const fin = new Date(debut.getTime() + (parseFloat(dureeEstimee) * 60 * 60 * 1000));
      setValue('date_fin_prevue', fin.toISOString().slice(0, 16));
    }
  }, [dateDebut, dureeEstimee, setValue]);

  // Auto-calculate total cost
  React.useEffect(() => {
    const mainOeuvre = parseFloat(coutMainOeuvre || 0);
    const pieces = parseFloat(coutPieces || 0);
    const total = mainOeuvre + pieces;
    if (total > 0) {
      setValue('cout_total_estime', total.toString());
    }
  }, [coutMainOeuvre, coutPieces, setValue]);

  const onFormSubmit = (data) => {
    // Clean and format data
    const formattedData = {
      ...data,
      capaciteExecution: parseInt(data.capaciteExecution),
      duree_totale_estimee: parseFloat(data.duree_totale_estimee) || null,
      cout_main_oeuvre: parseFloat(data.cout_main_oeuvre) || null,
      cout_pieces: parseFloat(data.cout_pieces) || null,
      cout_total_estime: parseFloat(data.cout_total_estime) || null,
      techniciens_assignes: data.techniciens_assignes.filter(tech => tech.nom.trim()),
      date_debut_prevue: data.date_debut_prevue || null,
      date_fin_prevue: data.date_fin_prevue || null
    };
    
    onSubmit(formattedData);
  };

  const priorityOptions = [
    { value: 'BASSE', label: 'Basse', color: 'text-green-600' },
    { value: 'NORMALE', label: 'Normale', color: 'text-blue-600' },
    { value: 'HAUTE', label: 'Haute', color: 'text-orange-600' },
    { value: 'CRITIQUE', label: 'Critique', color: 'text-red-600' }
  ];

  const specialiteOptions = [
    'Électricien',
    'Mécanicien',
    'Automaticien',
    'Soudeur',
    'Hydraulicien',
    'Pneumaticien',
    'Généraliste'
  ];

  const tabs = [
    { id: 'schedule', label: 'Planification', icon: Calendar },
    { id: 'resources', label: 'Ressources', icon: Users },
    { id: 'parts', label: 'Pièces & Stock', icon: Package },
    { id: 'risks', label: 'Risques & Contraintes', icon: AlertTriangle }
  ];

  return (
    <div className="bg-white border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-orange-50 border-b p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Settings className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Phase Planification</h3>
              <p className="text-sm text-gray-600">
                Intervention #{intervention?.id} - Planification des ressources et du timing
              </p>
            </div>
          </div>
          
          {planification?.dateCreation && (
            <div className="text-right text-sm text-gray-500">
              <p>Planification créée le</p>
              <p className="font-medium">{formatDate(planification.dateCreation)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Diagnostic Summary */}
      {diagnostic && (
        <div className="bg-blue-50 border-b p-4">
          <h4 className="font-medium text-blue-900 mb-2">Résumé du Diagnostic</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-blue-700">
                <strong>Problème:</strong> {diagnostic.probleme_identifie?.substring(0, 100)}...
              </p>
            </div>
            <div>
              <p className="text-blue-700">
                <strong>Gravité:</strong> {diagnostic.gravite}
              </p>
            </div>
            <div>
              <p className="text-blue-700">
                <strong>Travaux:</strong> {diagnostic.travailRequis?.length || 0} tâche(s)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-orange-500 text-orange-600'
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

      <form onSubmit={handleSubmit(onFormSubmit)}>
        <div className="p-6">
          {/* Schedule Tab */}
          {activeTab === 'schedule' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Priority */}
                <FormField
                  label="Priorité de planification"
                  name="priorite_planification"
                  required
                  error={errors.priorite_planification?.message}
                >
                  <select
                    className={`form-input ${errors.priorite_planification ? 'error' : ''}`}
                    {...register('priorite_planification', {
                      required: 'La priorité est requise'
                    })}
                  >
                    {priorityOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </FormField>

                {/* Urgency handling */}
                <div className="flex items-center space-x-3 pt-8">
                  <input
                    type="checkbox"
                    id="urgencePrise"
                    className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                    {...register('urgencePrise')}
                  />
                  <label htmlFor="urgencePrise" className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <span>Urgence prise en compte</span>
                  </label>
                </div>
              </div>

              {/* Dates and Duration */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <FormField
                  label="Date de début prévue"
                  name="date_debut_prevue"
                  required
                  error={errors.date_debut_prevue?.message}
                >
                  <input
                    type="datetime-local"
                    className={`form-input ${errors.date_debut_prevue ? 'error' : ''}`}
                    {...register('date_debut_prevue', {
                      required: 'La date de début est requise'
                    })}
                  />
                </FormField>

                <FormField
                  label="Durée totale estimée (heures)"
                  name="duree_totale_estimee"
                  required
                  error={errors.duree_totale_estimee?.message}
                >
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      className={`form-input pl-10 ${errors.duree_totale_estimee ? 'error' : ''}`}
                      placeholder="8.0"
                      {...register('duree_totale_estimee', {
                        required: 'La durée est requise',
                        min: {
                          value: 0,
                          message: 'La durée doit être positive'
                        }
                      })}
                    />
                  </div>
                </FormField>

                <FormField
                  label="Date de fin prévue"
                  name="date_fin_prevue"
                  help="Calculée automatiquement"
                >
                  <input
                    type="datetime-local"
                    className="form-input bg-gray-50"
                    readOnly
                    {...register('date_fin_prevue')}
                  />
                </FormField>
              </div>

              {/* Capacity */}
              <FormField
                label="Capacité d'exécution (nombre de techniciens)"
                name="capaciteExecution"
                required
                error={errors.capaciteExecution?.message}
              >
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    min="1"
                    max="10"
                    className={`form-input pl-10 ${errors.capaciteExecution ? 'error' : ''}`}
                    placeholder="2"
                    {...register('capaciteExecution', {
                      required: 'La capacité d\'exécution est requise',
                      min: {
                        value: 1,
                        message: 'Au moins un technicien est requis'
                      }
                    })}
                  />
                </div>
              </FormField>

              {/* Cost Estimation */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <FormField
                  label="Coût main d'œuvre (MAD)"
                  name="cout_main_oeuvre"
                  error={errors.cout_main_oeuvre?.message}
                >
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className={`form-input ${errors.cout_main_oeuvre ? 'error' : ''}`}
                    placeholder="1500.00"
                    {...register('cout_main_oeuvre', {
                      min: {
                        value: 0,
                        message: 'Le coût ne peut pas être négatif'
                      }
                    })}
                  />
                </FormField>

                <FormField
                  label="Coût pièces (MAD)"
                  name="cout_pieces"
                  error={errors.cout_pieces?.message}
                >
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className={`form-input ${errors.cout_pieces ? 'error' : ''}`}
                    placeholder="500.00"
                    {...register('cout_pieces', {
                      min: {
                        value: 0,
                        message: 'Le coût ne peut pas être négatif'
                      }
                    })}
                  />
                </FormField>

                <FormField
                  label="Coût total estimé (MAD)"
                  name="cout_total_estime"
                  help="Calculé automatiquement"
                >
                  <input
                    type="number"
                    className="form-input bg-gray-50"
                    readOnly
                    {...register('cout_total_estime')}
                  />
                </FormField>
              </div>
            </div>
          )}

          {/* Resources Tab */}
          {activeTab === 'resources' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-medium text-gray-900">Techniciens Assignés</h4>
                <button
                  type="button"
                  onClick={() => appendTechnicien({ nom: '', specialite: '', disponible: true })}
                  className="btn btn-secondary"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter un technicien
                </button>
              </div>

              <div className="space-y-4">
                {techniciensFields.map((field, index) => (
                  <div key={field.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-start justify-between mb-4">
                      <h5 className="font-medium text-gray-900 flex items-center space-x-2">
                        <User className="w-4 h-4" />
                        <span>Technicien #{index + 1}</span>
                      </h5>
                      {techniciensFields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTechnicien(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        label="Nom du technicien"
                        name={`techniciens_assignes.${index}.nom`}
                        required
                      >
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Ex: Ahmed Benali"
                          {...register(`techniciens_assignes.${index}.nom`, {
                            required: 'Le nom est requis'
                          })}
                        />
                      </FormField>
                      
                      <FormField
                        label="Spécialité"
                        name={`techniciens_assignes.${index}.specialite`}
                      >
                        <select
                          className="form-input"
                          {...register(`techniciens_assignes.${index}.specialite`)}
                        >
                          <option value="">Sélectionner</option>
                          {specialiteOptions.map(specialite => (
                            <option key={specialite} value={specialite}>
                              {specialite}
                            </option>
                          ))}
                        </select>
                      </FormField>
                      
                      <div className="flex items-center pt-6">
                        <input
                          type="checkbox"
                          id={`disponible-${index}`}
                          className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                          {...register(`techniciens_assignes.${index}.disponible`)}
                        />
                        <label htmlFor={`disponible-${index}`} className="ml-2 text-sm text-gray-700">
                          Disponible
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Prerequisites */}
              <FormField
                label="Conditions préalables"
                name="conditions_prerequises"
                error={errors.conditions_prerequises?.message}
                help="Conditions à remplir avant de commencer l'intervention"
              >
                <textarea
                  rows={4}
                  className={`form-input ${errors.conditions_prerequises ? 'error' : ''}`}
                  placeholder="Ex: Arrêt de la production, mise en sécurité électrique..."
                  {...register('conditions_prerequises')}
                />
              </FormField>
            </div>
          )}

          {/* Parts Tab */}
          {activeTab === 'parts' && (
            <div className="space-y-6">
              {/* PDR Availability */}
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="disponibilitePDR"
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  {...register('disponibilitePDR')}
                />
                <label htmlFor="disponibilitePDR" className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Toutes les pièces de rechange sont disponibles</span>
                </label>
              </div>

              {/* Parts from Diagnostic */}
              {diagnostic?.besoinPDR && diagnostic.besoinPDR.length > 0 && (
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Pièces Identifiées au Diagnostic</h4>
                  <div className="space-y-3">
                    {diagnostic.besoinPDR.map((piece, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Package className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="font-medium text-gray-900">{piece.piece}</p>
                            <p className="text-sm text-gray-600">
                              Quantité: {piece.quantite}
                              {piece.urgent && <span className="text-red-600 ml-2">(Urgent)</span>}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            piece.disponible 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {piece.disponible ? 'Disponible' : 'À commander'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Risks Tab */}
          {activeTab === 'risks' && (
            <div className="space-y-6">
              <FormField
                label="Contraintes identifiées"
                name="contraintes"
                error={errors.contraintes?.message}
                help="Contraintes techniques, logistiques ou temporelles"
              >
                <textarea
                  rows={4}
                  className={`form-input ${errors.contraintes ? 'error' : ''}`}
                  placeholder="Ex: Accès difficile, horaires de production..."
                  {...register('contraintes')}
                />
              </FormField>

              <FormField
                label="Risques identifiés"
                name="risques_identifies"
                error={errors.risques_identifies?.message}
                help="Risques potentiels et mesures de prévention"
              >
                <textarea
                  rows={4}
                  className={`form-input ${errors.risques_identifies ? 'error' : ''}`}
                  placeholder="Ex: Risque électrique, travail en hauteur..."
                  {...register('risques_identifies')}
                />
              </FormField>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary"
            disabled={loading}
          >
            <X className="w-4 h-4 mr-2" />
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Enregistrer la planification
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PlanificationForm;