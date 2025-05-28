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
      performance_avant: controleQualite?.performance_avant || {},
      performance_apres: controleQualite?.performance_apres || {},
      
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
      tests_effectues: data.tests_effectues.filter(test => test.nom.trim()),
      date_validation: data.date_validation || new Date().toISOString(),
      dateControle: new Date().toISOString()
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
    const conformeTests = tests.filter(test => test.conforme === true).length;
    const totalTests = tests.filter(test => test.nom.trim()).length;
    
    if (totalTests === 0) return 0;
    return Math.round((conformeTests / totalTests) * 100);
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
                      const testType = testTypes.fin