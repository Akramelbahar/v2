// src/components/workflow/DiagnosticForm.jsx
import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { 
  Search, Plus, Trash2, Save, X, AlertTriangle, 
  Wrench, Package, Clock, DollarSign, FileText,
  CheckCircle, XCircle, Settings
} from 'lucide-react';
import FormField from '../forms/FormField';
import { formatDate } from '../../utils/dateUtils';

const DiagnosticForm = ({ 
  intervention, 
  diagnostic, 
  onSubmit, 
  onCancel, 
  loading = false 
}) => {
  const [activeTab, setActiveTab] = useState('analysis');
  
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    watch
  } = useForm({
    defaultValues: {
      // Analysis
      etat_initial: diagnostic?.etat_initial || '',
      problemes_identifies: diagnostic?.problemes_identifies || '',
      cause_probable: diagnostic?.cause_probable || '',
      
      // Required work
      travail_requis: diagnostic?.travail_requis || [
        { description: '', duree_estimee: '', priorite: 'NORMALE', type: 'MAINTENANCE' }
      ],
      
      // Spare parts
      pieces_detachees: diagnostic?.pieces_detachees || [
        { nom: '', reference: '', quantite: '', prix_unitaire: '', fournisseur: '', disponible: true }
      ],
      
      // Recommendations
      recommandations: diagnostic?.recommandations || '',
      actions_preventives: diagnostic?.actions_preventives || '',
      
      // Validation
      diagnostique_valide: diagnostic?.diagnostique_valide || false,
      technicien_diagnostic: diagnostic?.technicien_diagnostic || '',
      date_diagnostic: diagnostic?.date_diagnostic || '',
      
      // Cost estimation
      cout_estime_total: diagnostic?.cout_estime_total || '',
      cout_main_oeuvre: diagnostic?.cout_main_oeuvre || '',
      cout_pieces: diagnostic?.cout_pieces || ''
    }
  });

  // Field arrays
  const { 
    fields: travailFields, 
    append: appendTravail, 
    remove: removeTravail 
  } = useFieldArray({
    control,
    name: 'travail_requis'
  });

  const { 
    fields: piecesFields, 
    append: appendPiece, 
    remove: removePiece 
  } = useFieldArray({
    control,
    name: 'pieces_detachees'
  });

  const onFormSubmit = (data) => {
    const formattedData = {
      ...data,
      travail_requis: data.travail_requis.filter(work => work.description.trim()),
      pieces_detachees: data.pieces_detachees.filter(piece => piece.nom.trim()),
      date_diagnostic: data.date_diagnostic || new Date().toISOString(),
      diagnostique_valide: Boolean(data.diagnostique_valide)
    };
    
    onSubmit(formattedData);
  };

  const tabs = [
    { id: 'analysis', label: 'Analyse', icon: Search },
    { id: 'work', label: 'Travaux Requis', icon: Wrench },
    { id: 'parts', label: 'Pièces Détachées', icon: Package },
    { id: 'validation', label: 'Validation', icon: CheckCircle }
  ];

  const prioriteOptions = [
    { value: 'BASSE', label: 'Basse', color: 'text-green-600' },
    { value: 'NORMALE', label: 'Normale', color: 'text-blue-600' },
    { value: 'HAUTE', label: 'Haute', color: 'text-orange-600' },
    { value: 'CRITIQUE', label: 'Critique', color: 'text-red-600' }
  ];

  const typeOptions = [
    { value: 'MAINTENANCE', label: 'Maintenance' },
    { value: 'REPARATION', label: 'Réparation' },
    { value: 'REMPLACEMENT', label: 'Remplacement' },
    { value: 'REGLAGE', label: 'Réglage' },
    { value: 'NETTOYAGE', label: 'Nettoyage' },
    { value: 'INSPECTION', label: 'Inspection' }
  ];

  // Calculate total cost
  const calculateTotalCost = () => {
    const pieces = watch('pieces_detachees') || [];
    const coutPieces = pieces.reduce((total, piece) => {
      const prix = parseFloat(piece.prix_unitaire) || 0;
      const qty = parseInt(piece.quantite) || 0;
      return total + (prix * qty);
    }, 0);
    
    const coutMainOeuvre = parseFloat(watch('cout_main_oeuvre')) || 0;
    return coutPieces + coutMainOeuvre;
  };

  return (
    <div className="bg-white border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-blue-50 border-b p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Search className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Phase Diagnostic</h3>
              <p className="text-sm text-gray-600">
                Intervention #{intervention?.id} - Analyse et identification des travaux
              </p>
            </div>
          </div>
          
          <div className="text-right">
            {diagnostic?.date_diagnostic && (
              <div className="text-sm text-gray-500 mb-2">
                <p>Diagnostic effectué le</p>
                <p className="font-medium">{formatDate(diagnostic.date_diagnostic)}</p>
              </div>
            )}
            
            {/* Cost indicator */}
            <div className="bg-white rounded-lg p-3 border">
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">
                  {calculateTotalCost().toFixed(2)}€
                </div>
                <div className="text-xs text-gray-500">Coût estimé</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Equipment Summary */}
      <div className="bg-gray-50 border-b p-4">
        <div className="flex items-center space-x-4">
          <Settings className="w-5 h-5 text-gray-600" />
          <div>
            <h4 className="font-medium text-gray-900">
              {intervention?.equipement?.nom || 'Équipement'}
            </h4>
            <p className="text-sm text-gray-600">
              {intervention?.equipement?.modele} - S/N: {intervention?.equipement?.numero_serie}
            </p>
          </div>
        </div>
      </div>

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

      <form onSubmit={handleSubmit(onFormSubmit)}>
        <div className="p-6">
          {/* Analysis Tab */}
          {activeTab === 'analysis' && (
            <div className="space-y-6">
              <FormField
                label="État initial de l'équipement"
                name="etat_initial"
                required
                error={errors.etat_initial?.message}
                help="Décrivez l'état de l'équipement avant intervention"
              >
                <textarea
                  rows={4}
                  className={`form-input ${errors.etat_initial ? 'error' : ''}`}
                  placeholder="État général, symptômes observés, conditions de fonctionnement..."
                  {...register('etat_initial', {
                    required: 'L\'état initial est requis'
                  })}
                />
              </FormField>

              <FormField
                label="Problèmes identifiés"
                name="problemes_identifies"
                required
                error={errors.problemes_identifies?.message}
              >
                <textarea
                  rows={4}
                  className={`form-input ${errors.problemes_identifies ? 'error' : ''}`}
                  placeholder="Listez les problèmes détectés et leurs manifestations..."
                  {...register('problemes_identifies', {
                    required: 'Les problèmes identifiés sont requis'
                  })}
                />
              </FormField>

              <FormField
                label="Cause probable"
                name="cause_probable"
                error={errors.cause_probable?.message}
              >
                <textarea
                  rows={3}
                  className={`form-input ${errors.cause_probable ? 'error' : ''}`}
                  placeholder="Analysez les causes probables des problèmes identifiés..."
                  {...register('cause_probable')}
                />
              </FormField>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FormField
                  label="Recommandations"
                  name="recommandations"
                  error={errors.recommandations?.message}
                >
                  <textarea
                    rows={4}
                    className={`form-input ${errors.recommandations ? 'error' : ''}`}
                    placeholder="Recommandations générales pour l'intervention..."
                    {...register('recommandations')}
                  />
                </FormField>

                <FormField
                  label="Actions préventives"
                  name="actions_preventives"
                  error={errors.actions_preventives?.message}
                >
                  <textarea
                    rows={4}
                    className={`form-input ${errors.actions_preventives ? 'error' : ''}`}
                    placeholder="Actions préventives recommandées pour éviter la récurrence..."
                    {...register('actions_preventives')}
                  />
                </FormField>
              </div>
            </div>
          )}

          {/* Work Required Tab */}
          {activeTab === 'work' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-medium text-gray-900">Travaux à Effectuer</h4>
                <button
                  type="button"
                  onClick={() => appendTravail({ 
                    description: '', duree_estimee: '', priorite: 'NORMALE', type: 'MAINTENANCE' 
                  })}
                  className="btn btn-secondary"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter un travail
                </button>
              </div>

              <div className="space-y-4">
                {travailFields.map((field, index) => (
                  <div key={field.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-start justify-between mb-4">
                      <h5 className="font-medium text-gray-900">Travail #{index + 1}</h5>
                      {travailFields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTravail(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                      <div className="lg:col-span-6">
                        <FormField
                          label="Description du travail"
                          name={`travail_requis.${index}.description`}
                          required
                          error={errors.travail_requis?.[index]?.description?.message}
                        >
                          <textarea
                            rows={3}
                            className="form-input"
                            placeholder="Décrivez précisément le travail à effectuer..."
                            {...register(`travail_requis.${index}.description`, {
                              required: 'La description est requise'
                            })}
                          />
                        </FormField>
                      </div>
                      
                      <div className="lg:col-span-2">
                        <FormField
                          label="Type"
                          name={`travail_requis.${index}.type`}
                        >
                          <select
                            className="form-input"
                            {...register(`travail_requis.${index}.type`)}
                          >
                            {typeOptions.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </FormField>
                      </div>
                      
                      <div className="lg:col-span-2">
                        <FormField
                          label="Durée (h)"
                          name={`travail_requis.${index}.duree_estimee`}
                        >
                          <input
                            type="number"
                            step="0.5"
                            min="0.5"
                            className="form-input"
                            placeholder="2.5"
                            {...register(`travail_requis.${index}.duree_estimee`)}
                          />
                        </FormField>
                      </div>
                      
                      <div className="lg:col-span-2">
                        <FormField
                          label="Priorité"
                          name={`travail_requis.${index}.priorite`}
                        >
                          <select
                            className="form-input"
                            {...register(`travail_requis.${index}.priorite`)}
                          >
                            {prioriteOptions.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </FormField>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Spare Parts Tab */}
          {activeTab === 'parts' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-medium text-gray-900">Pièces Détachées Nécessaires</h4>
                <button
                  type="button"
                  onClick={() => appendPiece({ 
                    nom: '', reference: '', quantite: '', prix_unitaire: '', fournisseur: '', disponible: true 
                  })}
                  className="btn btn-secondary"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter une pièce
                </button>
              </div>

              <div className="space-y-4">
                {piecesFields.map((field, index) => (
                  <div key={field.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-start justify-between mb-4">
                      <h5 className="font-medium text-gray-900">Pièce #{index + 1}</h5>
                      {piecesFields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePiece(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
                      <div className="lg:col-span-2">
                        <FormField
                          label="Nom de la pièce"
                          name={`pieces_detachees.${index}.nom`}
                          required
                          error={errors.pieces_detachees?.[index]?.nom?.message}
                        >
                          <input
                            type="text"
                            className="form-input"
                            placeholder="Ex: Roulement à billes"
                            {...register(`pieces_detachees.${index}.nom`, {
                              required: 'Le nom de la pièce est requis'
                            })}
                          />
                        </FormField>
                      </div>
                      
                      <div>
                        <FormField
                          label="Référence"
                          name={`pieces_detachees.${index}.reference`}
                        >
                          <input
                            type="text"
                            className="form-input"
                            placeholder="SKF-6203"
                            {...register(`pieces_detachees.${index}.reference`)}
                          />
                        </FormField>
                      </div>
                      
                      <div>
                        <FormField
                          label="Quantité"
                          name={`pieces_detachees.${index}.quantite`}
                        >
                          <input
                            type="number"
                            min="1"
                            className="form-input"
                            placeholder="1"
                            {...register(`pieces_detachees.${index}.quantite`)}
                          />
                        </FormField>
                      </div>
                      
                      <div>
                        <FormField
                          label="Prix unitaire (€)"
                          name={`pieces_detachees.${index}.prix_unitaire`}
                        >
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            className="form-input"
                            placeholder="25.50"
                            {...register(`pieces_detachees.${index}.prix_unitaire`)}
                          />
                        </FormField>
                      </div>
                      
                      <div>
                        <FormField
                          label="Disponible"
                          name={`pieces_detachees.${index}.disponible`}
                        >
                          <select
                            className="form-input"
                            {...register(`pieces_detachees.${index}.disponible`)}
                          >
                            <option value="true">Oui</option>
                            <option value="false">Non</option>
                          </select>
                        </FormField>
                      </div>
                      
                      <div className="lg:col-span-6">
                        <FormField
                          label="Fournisseur"
                          name={`pieces_detachees.${index}.fournisseur`}
                        >
                          <input
                            type="text"
                            className="form-input"
                            placeholder="Nom du fournisseur"
                            {...register(`pieces_detachees.${index}.fournisseur`)}
                          />
                        </FormField>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cost Summary */}
              <div className="bg-gray-50 border rounded-lg p-4">
                <h5 className="font-medium text-gray-900 mb-3">Estimation des Coûts</h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    label="Coût main d'œuvre (€)"
                    name="cout_main_oeuvre"
                  >
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="form-input"
                      placeholder="150.00"
                      {...register('cout_main_oeuvre')}
                    />
                  </FormField>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Coût pièces (€)
                    </label>
                    <div className="form-input bg-gray-100 text-gray-600">
                      {(watch('pieces_detachees') || []).reduce((total, piece) => {
                        const prix = parseFloat(piece.prix_unitaire) || 0;
                        const qty = parseInt(piece.quantite) || 0;
                        return total + (prix * qty);
                      }, 0).toFixed(2)}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Coût total estimé (€)
                    </label>
                    <div className="form-input bg-blue-50 text-blue-900 font-semibold">
                      {calculateTotalCost().toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Validation Tab */}
          {activeTab === 'validation' && (
            <div className="space-y-6">
              <FormField
                label="Technicien ayant effectué le diagnostic"
                name="technicien_diagnostic"
                required
                error={errors.technicien_diagnostic?.message}
              >
                <input
                  type="text"
                  className={`form-input ${errors.technicien_diagnostic ? 'error' : ''}`}
                  placeholder="Nom du technicien"
                  {...register('technicien_diagnostic', {
                    required: 'Le nom du technicien est requis'
                  })}
                />
              </FormField>

              <FormField
                label="Date du diagnostic"
                name="date_diagnostic"
              >
                <input
                  type="datetime-local"
                  className="form-input"
                  {...register('date_diagnostic')}
                />
              </FormField>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="diagnostique_valide"
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  {...register('diagnostique_valide')}
                />
                <label htmlFor="diagnostique_valide" className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Diagnostic validé et prêt pour la planification</span>
                </label>
              </div>

              {/* Diagnostic Summary */}
              <div className="bg-gray-50 border rounded-lg p-4">
                <h5 className="font-medium text-gray-900 mb-3">Résumé du Diagnostic</h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Travaux identifiés:</p>
                    <p className="font-medium">{watch('travail_requis')?.filter(t => t.description.trim()).length || 0}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Pièces nécessaires:</p>
                    <p className="font-medium">{watch('pieces_detachees')?.filter(p => p.nom.trim()).length || 0}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Coût total estimé:</p>
                    <p className="font-medium text-blue-600">{calculateTotalCost().toFixed(2)}€</p>
                  </div>
                </div>
              </div>
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
                Enregistrer le diagnostic
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DiagnosticForm;