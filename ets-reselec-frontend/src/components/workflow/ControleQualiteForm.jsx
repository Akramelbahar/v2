// src/components/workflow/ControleQualiteForm.jsx
import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { 
  Target, CheckCircle, XCircle, AlertTriangle, Save, Plus, 
  Trash2, FileText, Camera, Thermometer, Activity, X,
  BarChart3, Clock, User
} from 'lucide-react';
import FormField from '../forms/FormField';
import { formatDate } from '../../utils/dateUtils';

const ControleQualiteForm = ({ 
  intervention, 
  controleQualite, 
  diagnostic,
  planification,
  onSubmit, 
  onCancel, 
  loading = false 
}) => {
  const [activeTab, setActiveTab] = useState('tests');
  
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    watch,
    setValue
  } = useForm({
    defaultValues: {
      // Test results
      resultatsEssais: controleQualite?.resultatsEssais || '',
      analyseVibratoire: controleQualite?.analyseVibratoire || '',
      
      // Individual tests
      tests_effectues: controleQualite?.tests_effectues || [
        { nom: '', resultat: '', valeur_mesuree: '', valeur_reference: '', conforme: null, commentaire: '' }
      ],
      
      // Performance metrics
      performance_avant: controleQualite?.performance_avant || {
        temperature: '',
        vibration: '',
        courant: '',
        rendement: ''
      },
      performance_apres: controleQualite?.performance_apres || {
        temperature: '',
        vibration: '',
        courant: '',
        rendement: ''
      },
      
      // Visual inspection
      inspection_visuelle: controleQualite?.inspection_visuelle || '',
      photos_prises: controleQualite?.photos_prises || false,
      
      // Final assessment
      evaluation_globale: controleQualite?.evaluation_globale || 'EN_COURS',
      defauts_constates: controleQualite?.defauts_constates || '',
      actions_correctives: controleQualite?.actions_correctives || '',
      
      // Validation
      validateur: controleQualite?.validateur || '',
      date_validation: controleQualite?.date_validation || '',
      commentaires_validateur: controleQualite?.commentaires_validateur || '',
      
      // Follow-up
      suivi_requis: controleQualite?.suivi_requis || false,
      prochaine_verification: controleQualite?.prochaine_verification || '',
      recommandations_maintenance: controleQualite?.recommandations_maintenance || ''
    }
  });

  // Field arrays
  const { 
    fields: testsFields, 
    append: appendTest, 
    remove: removeTest 
  } = useFieldArray({
    control,
    name: 'tests_effectues'
  });

  const onFormSubmit = (data) => {
    // Clean and format data
    const formattedData = {
      ...data,
      tests_effectues: data.tests_effectues.filter(test => test.nom && test.nom.trim()),
      date_validation: data.date_validation || new Date().toISOString(),
      dateControle: new Date().toISOString(),
      // Convert string booleans to actual booleans
      tests_effectues: data.tests_effectues.map(test => ({
        ...test,
        conforme: test.conforme === 'true' ? true : test.conforme === 'false' ? false : null
      })).filter(test => test.nom && test.nom.trim())
    };
    
    onSubmit(formattedData);
  };

  // Predefined test types
  const testTypes = [
    { name: 'Test de fonctionnement', unit: '', reference: '' },
    { name: 'Mesure de vibration', unit: 'mm/s', reference: '< 4.5' },
    { name: 'Mesure de température', unit: '°C', reference: '< 80' },
    { name: 'Test d\'isolement', unit: 'MΩ', reference: '> 1' },
    { name: 'Mesure de courant', unit: 'A', reference: '' },
    { name: 'Mesure de tension', unit: 'V', reference: '' },
    { name: 'Test de pression', unit: 'bar', reference: '' },
    { name: 'Contrôle d\'alignement', unit: 'mm', reference: '< 0.1' }
  ];

  const evaluationOptions = [
    { value: 'EN_COURS', label: 'En cours', color: 'text-blue-600' },
    { value: 'CONFORME', label: 'Conforme', color: 'text-green-600' },
    { value: 'NON_CONFORME', label: 'Non conforme', color: 'text-red-600' },
    { value: 'CONDITIONNEL', label: 'Conditionnel', color: 'text-orange-600' }
  ];

  const tabs = [
    { id: 'tests', label: 'Tests & Mesures', icon: BarChart3 },
    { id: 'inspection', label: 'Inspection Visuelle', icon: Target },
    { id: 'performance', label: 'Performance', icon: Activity },
    { id: 'validation', label: 'Validation', icon: CheckCircle }
  ];

  // Calculate overall conformity
  const calculateConformity = () => {
    const tests = watch('tests_effectues') || [];
    const validTests = tests.filter(test => test.nom && test.nom.trim());
    const conformeTests = validTests.filter(test => test.conforme === true).length;
    
    if (validTests.length === 0) return 0;
    return Math.round((conformeTests / validTests.length) * 100);
  };

  return (
    <div className="bg-white border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-green-50 border-b p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Phase Contrôle Qualité</h3>
              <p className="text-sm text-gray-600">
                Intervention #{intervention?.id} - Tests et validation finale
              </p>
            </div>
          </div>
          
          <div className="text-right">
            {controleQualite?.dateControle && (
              <div className="text-sm text-gray-500 mb-2">
                <p>Contrôle effectué le</p>
                <p className="font-medium">{formatDate(controleQualite.dateControle)}</p>
              </div>
            )}
            
            {/* Conformity indicator */}
            <div className="bg-white rounded-lg p-3 border">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {calculateConformity()}%
                </div>
                <div className="text-xs text-gray-500">Conformité</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Work Summary */}
      <div className="bg-blue-50 border-b p-4">
        <h4 className="font-medium text-blue-900 mb-2">Résumé des Travaux Effectués</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-blue-700">
              <strong>Durée planifiée:</strong> {planification?.duree_totale_estimee || 'N/A'}h
            </p>
          </div>
          <div>
            <p className="text-blue-700">
              <strong>Techniciens:</strong> {planification?.techniciens_assignes?.length || 0}
            </p>
          </div>
          <div>
            <p className="text-blue-700">
              <strong>Travaux:</strong> {diagnostic?.travailRequis?.length || 0} tâche(s)
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
                    ? 'border-green-500 text-green-600'
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
          {/* Tests Tab */}
          {activeTab === 'tests' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-medium text-gray-900">Tests et Mesures Effectués</h4>
                <div className="flex items-center space-x-3">
                  <select
                    onChange={(e) => {
                      const testType = testTypes.find(t => t.name === e.target.value);
                      if (testType) {
                        appendTest({
                          nom: testType.name,
                          resultat: '',
                          valeur_mesuree: '',
                          valeur_reference: testType.reference,
                          conforme: null,
                          commentaire: ''
                        });
                        e.target.value = ''; // Reset select
                      }
                    }}
                    className="form-input"
                    defaultValue=""
                  >
                    <option value="">Ajouter un test prédéfini</option>
                    {testTypes.map(test => (
                      <option key={test.name} value={test.name}>
                        {test.name}
                      </option>
                    ))}
                  </select>
                  
                  <button
                    type="button"
                    onClick={() => appendTest({ 
                      nom: '', resultat: '', valeur_mesuree: '', valeur_reference: '', conforme: null, commentaire: '' 
                    })}
                    className="btn btn-secondary"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Test personnalisé
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {testsFields.map((field, index) => (
                  <div key={field.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-start justify-between mb-4">
                      <h5 className="font-medium text-gray-900">Test #{index + 1}</h5>
                      {testsFields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTest(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
                      <div className="lg:col-span-2">
                        <FormField
                          label="Nom du test"
                          name={`tests_effectues.${index}.nom`}
                          required
                          error={errors.tests_effectues?.[index]?.nom?.message}
                        >
                          <input
                            type="text"
                            className="form-input"
                            placeholder="Ex: Test de fonctionnement"
                            {...register(`tests_effectues.${index}.nom`, {
                              required: 'Le nom du test est requis'
                            })}
                          />
                        </FormField>
                      </div>
                      
                      <div>
                        <FormField
                          label="Valeur mesurée"
                          name={`tests_effectues.${index}.valeur_mesuree`}
                        >
                          <input
                            type="text"
                            className="form-input"
                            placeholder="Ex: 3.2"
                            {...register(`tests_effectues.${index}.valeur_mesuree`)}
                          />
                        </FormField>
                      </div>
                      
                      <div>
                        <FormField
                          label="Valeur référence"
                          name={`tests_effectues.${index}.valeur_reference`}
                        >
                          <input
                            type="text"
                            className="form-input"
                            placeholder="Ex: < 4.5"
                            {...register(`tests_effectues.${index}.valeur_reference`)}
                          />
                        </FormField>
                      </div>
                      
                      <div>
                        <FormField
                          label="Conforme"
                          name={`tests_effectues.${index}.conforme`}
                        >
                          <select
                            className="form-input"
                            {...register(`tests_effectues.${index}.conforme`)}
                          >
                            <option value="">À évaluer</option>
                            <option value="true">Conforme</option>
                            <option value="false">Non conforme</option>
                          </select>
                        </FormField>
                      </div>
                      
                      <div>
                        <FormField
                          label="Résultat"
                          name={`tests_effectues.${index}.resultat`}
                        >
                          <select
                            className="form-input"
                            {...register(`tests_effectues.${index}.resultat`)}
                          >
                            <option value="">Sélectionner</option>
                            <option value="REUSSI">Réussi</option>
                            <option value="ECHEC">Échec</option>
                            <option value="PARTIEL">Partiel</option>
                          </select>
                        </FormField>
                      </div>
                      
                      <div className="lg:col-span-6">
                        <FormField
                          label="Commentaire"
                          name={`tests_effectues.${index}.commentaire`}
                        >
                          <textarea
                            rows={2}
                            className="form-input"
                            placeholder="Observations et commentaires..."
                            {...register(`tests_effectues.${index}.commentaire`)}
                          />
                        </FormField>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Analysis Results */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FormField
                  label="Résultats des essais"
                  name="resultatsEssais"
                  error={errors.resultatsEssais?.message}
                >
                  <textarea
                    rows={4}
                    className={`form-input ${errors.resultatsEssais ? 'error' : ''}`}
                    placeholder="Synthèse des résultats des essais effectués..."
                    {...register('resultatsEssais')}
                  />
                </FormField>

                <FormField
                  label="Analyse vibratoire"
                  name="analyseVibratoire"
                  error={errors.analyseVibratoire?.message}
                >
                  <textarea
                    rows={4}
                    className={`form-input ${errors.analyseVibratoire ? 'error' : ''}`}
                    placeholder="Résultats de l'analyse vibratoire si applicable..."
                    {...register('analyseVibratoire')}
                  />
                </FormField>
              </div>
            </div>
          )}

          {/* Visual Inspection Tab */}
          {activeTab === 'inspection' && (
            <div className="space-y-6">
              <FormField
                label="Inspection visuelle"
                name="inspection_visuelle"
                error={errors.inspection_visuelle?.message}
                help="Décrivez l'état visuel de l'équipement après intervention"
              >
                <textarea
                  rows={6}
                  className={`form-input ${errors.inspection_visuelle ? 'error' : ''}`}
                  placeholder="État général, propreté, signes d'usure, fuites, alignement..."
                  {...register('inspection_visuelle')}
                />
              </FormField>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="photos_prises"
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  {...register('photos_prises')}
                />
                <label htmlFor="photos_prises" className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                  <Camera className="w-4 h-4 text-blue-500" />
                  <span>Photos documentaires prises</span>
                </label>
              </div>

              <FormField
                label="Défauts constatés"
                name="defauts_constates"
                error={errors.defauts_constates?.message}
              >
                <textarea
                  rows={4}
                  className={`form-input ${errors.defauts_constates ? 'error' : ''}`}
                  placeholder="Listez les défauts ou anomalies constatés..."
                  {...register('defauts_constates')}
                />
              </FormField>

              <FormField
                label="Actions correctives"
                name="actions_correctives"
                error={errors.actions_correctives?.message}
              >
                <textarea
                  rows={4}
                  className={`form-input ${errors.actions_correctives ? 'error' : ''}`}
                  placeholder="Actions correctives à entreprendre..."
                  {...register('actions_correctives')}
                />
              </FormField>
            </div>
          )}

          {/* Performance Tab */}
          {activeTab === 'performance' && (
            <div className="space-y-6">
              <h4 className="text-lg font-medium text-gray-900">Comparaison des Performances</h4>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Before */}
                <div className="space-y-4">
                  <h5 className="font-medium text-gray-900 flex items-center space-x-2">
                    <XCircle className="w-4 h-4 text-red-500" />
                    <span>Avant Intervention</span>
                  </h5>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      label="Température (°C)"
                      name="performance_avant.temperature"
                    >
                      <input
                        type="number"
                        step="0.1"
                        className="form-input"
                        {...register('performance_avant.temperature')}
                      />
                    </FormField>
                    
                    <FormField
                      label="Vibration (mm/s)"
                      name="performance_avant.vibration"
                    >
                      <input
                        type="number"
                        step="0.1"
                        className="form-input"
                        {...register('performance_avant.vibration')}
                      />
                    </FormField>
                    
                    <FormField
                      label="Courant (A)"
                      name="performance_avant.courant"
                    >
                      <input
                        type="number"
                        step="0.1"
                        className="form-input"
                        {...register('performance_avant.courant')}
                      />
                    </FormField>
                    
                    <FormField
                      label="Rendement (%)"
                      name="performance_avant.rendement"
                    >
                      <input
                        type="number"
                        step="0.1"
                        className="form-input"
                        {...register('performance_avant.rendement')}
                      />
                    </FormField>
                  </div>
                </div>

                {/* After */}
                <div className="space-y-4">
                  <h5 className="font-medium text-gray-900 flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Après Intervention</span>
                  </h5>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      label="Température (°C)"
                      name="performance_apres.temperature"
                    >
                      <input
                        type="number"
                        step="0.1"
                        className="form-input"
                        {...register('performance_apres.temperature')}
                      />
                    </FormField>
                    
                    <FormField
                      label="Vibration (mm/s)"
                      name="performance_apres.vibration"
                    >
                      <input
                        type="number"
                        step="0.1"
                        className="form-input"
                        {...register('performance_apres.vibration')}
                      />
                    </FormField>
                    
                    <FormField
                      label="Courant (A)"
                      name="performance_apres.courant"
                    >
                      <input
                        type="number"
                        step="0.1"
                        className="form-input"
                        {...register('performance_apres.courant')}
                      />
                    </FormField>
                    
                    <FormField
                      label="Rendement (%)"
                      name="performance_apres.rendement"
                    >
                      <input
                        type="number"
                        step="0.1"
                        className="form-input"
                        {...register('performance_apres.rendement')}
                      />
                    </FormField>
                  </div>
                </div>
              </div>

              {/* Follow-up */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="suivi_requis"
                    className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                    {...register('suivi_requis')}
                  />
                  <label htmlFor="suivi_requis" className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                    <Clock className="w-4 h-4 text-orange-500" />
                    <span>Suivi requis</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <FormField
                    label="Prochaine vérification"
                    name="prochaine_verification"
                  >
                    <input
                      type="date"
                      className="form-input"
                      {...register('prochaine_verification')}
                    />
                  </FormField>

                  <FormField
                    label="Recommandations maintenance"
                    name="recommandations_maintenance"
                  >
                    <textarea
                      rows={3}
                      className="form-input"
                      placeholder="Recommandations pour la maintenance préventive..."
                      {...register('recommandations_maintenance')}
                    />
                  </FormField>
                </div>
              </div>
            </div>
          )}

          {/* Validation Tab */}
          {activeTab === 'validation' && (
            <div className="space-y-6">
              <FormField
                label="Évaluation globale"
                name="evaluation_globale"
                required
                error={errors.evaluation_globale?.message}
              >
                <select
                  className={`form-input ${errors.evaluation_globale ? 'error' : ''}`}
                  {...register('evaluation_globale', {
                    required: 'L\'évaluation globale est requise'
                  })}
                >
                  {evaluationOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </FormField>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FormField
                  label="Validateur"
                  name="validateur"
                  required
                  error={errors.validateur?.message}
                >
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      className={`form-input pl-10 ${errors.validateur ? 'error' : ''}`}
                      placeholder="Nom du validateur"
                      {...register('validateur', {
                        required: 'Le nom du validateur est requis'
                      })}
                    />
                  </div>
                </FormField>

                <FormField
                  label="Date de validation"
                  name="date_validation"
                >
                  <input
                    type="datetime-local"
                    className="form-input"
                    {...register('date_validation')}
                  />
                </FormField>
              </div>

              <FormField
                label="Commentaires du validateur"
                name="commentaires_validateur"
                error={errors.commentaires_validateur?.message}
              >
                <textarea
                  rows={4}
                  className={`form-input ${errors.commentaires_validateur ? 'error' : ''}`}
                  placeholder="Commentaires et observations du validateur..."
                  {...register('commentaires_validateur')}
                />
              </FormField>

              {/* Validation Summary */}
              <div className="bg-gray-50 border rounded-lg p-4">
                <h5 className="font-medium text-gray-900 mb-3">Résumé de Validation</h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Tests effectués:</p>
                    <p className="font-medium">{watch('tests_effectues')?.filter(t => t.nom && t.nom.trim()).length || 0}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Conformité:</p>
                    <p className="font-medium text-green-600">{calculateConformity()}%</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Évaluation:</p>
                    <p className="font-medium">
                      {evaluationOptions.find(opt => opt.value === watch('evaluation_globale'))?.label || 'Non évaluée'}                    </p>
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
                Enregistrer le contrôle qualité
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ControleQualiteForm;