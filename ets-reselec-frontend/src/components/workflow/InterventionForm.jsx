// src/components/interventions/InterventionForm.jsx
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { 
  Settings, AlertTriangle, Calendar, User, Building2, 
  Wrench, FileText, Save, X, Search, Clock, Target
} from 'lucide-react';
import FormField from '../forms/FormField';
import { formatDate } from '../../utils/dateUtils';

const InterventionForm = ({ 
  intervention, 
  onSubmit, 
  onCancel, 
  loading = false,
  equipments = [],
  clients = [],
  users = []
}) => {
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [equipmentSearch, setEquipmentSearch] = useState('');
  const [filteredEquipments, setFilteredEquipments] = useState(equipments);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset
  } = useForm({
    defaultValues: {
      // Basic info
      titre: intervention?.titre || '',
      description: intervention?.description || '',
      type_intervention: intervention?.type_intervention || 'MAINTENANCE',
      
      // Equipment and client
      equipement_id: intervention?.equipement_id || '',
      client_id: intervention?.client_id || '',
      
      // Priority and urgency
      priorite: intervention?.priorite || 'NORMALE',
      urgence: intervention?.urgence || false,
      
      // Scheduling
      date_prevue: intervention?.date_prevue || '',
      duree_estimee: intervention?.duree_estimee || '',
      
      // Assignment
      technicien_principal: intervention?.technicien_principal || '',
      techniciens_assignes: intervention?.techniciens_assignes || [],
      
      // Additional info
      observations: intervention?.observations || '',
      conditions_specifiques: intervention?.conditions_specifiques || '',
      materiel_requis: intervention?.materiel_requis || '',
      
      // Status (auto-managed)
      statut: intervention?.statut || 'PLANIFIEE',
      workflow_phase: intervention?.workflow_phase || 'DIAGNOSTIC'
    }
  });

  // Equipment search functionality
  useEffect(() => {
    const filtered = equipments.filter(eq => 
      eq.nom.toLowerCase().includes(equipmentSearch.toLowerCase()) ||
      eq.modele?.toLowerCase().includes(equipmentSearch.toLowerCase()) ||
      eq.numero_serie?.toLowerCase().includes(equipmentSearch.toLowerCase())
    );
    setFilteredEquipments(filtered);
  }, [equipmentSearch, equipments]);

  // Handle equipment selection
  const handleEquipmentSelect = (equipment) => {
    setSelectedEquipment(equipment);
    setValue('equipement_id', equipment.id);
    setValue('client_id', equipment.client_id);
    setEquipmentSearch('');
  };

  // Get selected equipment details
  useEffect(() => {
    const equipmentId = watch('equipement_id');
    if (equipmentId && equipments.length > 0) {
      const equipment = equipments.find(eq => eq.id === parseInt(equipmentId));
      if (equipment) {
        setSelectedEquipment(equipment);
      }
    }
  }, [watch('equipement_id'), equipments]);

  const onFormSubmit = (data) => {
    const formattedData = {
      ...data,
      urgence: Boolean(data.urgence),
      techniciens_assignes: data.techniciens_assignes || [],
      date_creation: intervention?.date_creation || new Date().toISOString(),
      date_prevue: data.date_prevue ? new Date(data.date_prevue).toISOString() : null,
      duree_estimee: data.duree_estimee ? parseInt(data.duree_estimee) : null,
      workflow_phase: data.workflow_phase || 'DIAGNOSTIC',
      statut: data.statut || 'PLANIFIEE'
    };
    
    onSubmit(formattedData);
  };

  const typeOptions = [
    { value: 'MAINTENANCE', label: 'Maintenance', icon: Wrench, color: 'text-blue-600' },
    { value: 'RENOVATION', label: 'Rénovation', icon: Settings, color: 'text-purple-600' },
    { value: 'REPARATION', label: 'Réparation', icon: Target, color: 'text-red-600' },
    { value: 'INSPECTION', label: 'Inspection', icon: Search, color: 'text-green-600' }
  ];

  const prioriteOptions = [
    { value: 'BASSE', label: 'Basse', color: 'text-green-600' },
    { value: 'NORMALE', label: 'Normale', color: 'text-blue-600' },
    { value: 'HAUTE', label: 'Haute', color: 'text-orange-600' },
    { value: 'CRITIQUE', label: 'Critique', color: 'text-red-600' }
  ];

  return (
    <div className="bg-white border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-blue-50 border-b p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Settings className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                {intervention ? 'Modifier l\'intervention' : 'Nouvelle intervention'}
              </h3>
              <p className="text-sm text-gray-600">
                {intervention ? `Intervention #${intervention.id}` : 'Créer une nouvelle intervention'}
              </p>
            </div>
          </div>
          
          {intervention?.date_creation && (
            <div className="text-right text-sm text-gray-500">
              <p>Créée le</p>
              <p className="font-medium">{formatDate(intervention.date_creation)}</p>
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit(onFormSubmit)}>
        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-6">
            <h4 className="text-lg font-medium text-gray-900 border-b pb-2">
              Informations générales
            </h4>
            
            <FormField
              label="Titre de l'intervention"
              name="titre"
              required
              error={errors.titre?.message}
            >
              <input
                type="text"
                className={`form-input ${errors.titre ? 'error' : ''}`}
                placeholder="Ex: Maintenance préventive pompe centrifuge"
                {...register('titre', {
                  required: 'Le titre est requis',
                  minLength: { value: 5, message: 'Le titre doit faire au moins 5 caractères' }
                })}
              />
            </FormField>

            <FormField
              label="Description"
              name="description"
              error={errors.description?.message}
              help="Décrivez brièvement l'intervention à effectuer"
            >
              <textarea
                rows={3}
                className={`form-input ${errors.description ? 'error' : ''}`}
                placeholder="Description détaillée de l'intervention..."
                {...register('description')}
              />
            </FormField>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <FormField
                label="Type d'intervention"
                name="type_intervention"
                required
                error={errors.type_intervention?.message}
              >
                <select
                  className={`form-input ${errors.type_intervention ? 'error' : ''}`}
                  {...register('type_intervention', {
                    required: 'Le type d\'intervention est requis'
                  })}
                >
                  {typeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField
                label="Priorité"
                name="priorite"
                error={errors.priorite?.message}
              >
                <select
                  className={`form-input ${errors.priorite ? 'error' : ''}`}
                  {...register('priorite')}
                >
                  {prioriteOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="urgence"
                className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                {...register('urgence')}
              />
              <label htmlFor="urgence" className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span>Intervention urgente</span>
              </label>
            </div>
          </div>

          {/* Equipment Selection */}
          <div className="space-y-6">
            <h4 className="text-lg font-medium text-gray-900 border-b pb-2">
              Équipement concerné
            </h4>
            
            {/* Equipment Search */}
            <FormField
              label="Rechercher un équipement"
              name="equipment_search"
              help="Recherchez par nom, modèle ou numéro de série"
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  className="form-input pl-10"
                  placeholder="Rechercher un équipement..."
                  value={equipmentSearch}
                  onChange={(e) => setEquipmentSearch(e.target.value)}
                />
              </div>
            </FormField>

            {/* Equipment Results */}
            {equipmentSearch && (
              <div className="bg-gray-50 border rounded-lg max-h-60 overflow-y-auto">
                {filteredEquipments.length > 0 ? (
                  <div className="divide-y divide-gray-200">
                    {filteredEquipments.slice(0, 10).map(equipment => (
                      <button
                        key={equipment.id}
                        type="button"
                        onClick={() => handleEquipmentSelect(equipment)}
                        className="w-full p-3 text-left hover:bg-blue-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{equipment.nom}</p>
                            <p className="text-sm text-gray-600">
                              {equipment.modele} - S/N: {equipment.numero_serie}
                            </p>
                            <p className="text-xs text-gray-500">
                              {equipment.client?.nom || 'Client non spécifié'}
                            </p>
                          </div>
                          <Settings className="w-5 h-5 text-gray-400" />
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    Aucun équipement trouvé
                  </div>
                )}
              </div>
            )}

            {/* Selected Equipment */}
            {selectedEquipment && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Settings className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h5 className="font-medium text-blue-900">{selectedEquipment.nom}</h5>
                      <p className="text-sm text-blue-700">
                        {selectedEquipment.modele} - S/N: {selectedEquipment.numero_serie}
                      </p>
                      <p className="text-xs text-blue-600">
                        Client: {selectedEquipment.client?.nom || 'Non spécifié'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedEquipment(null);
                      setValue('equipement_id', '');
                      setValue('client_id', '');
                    }}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Manual Equipment/Client Selection */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <FormField
                label="Équipement"
                name="equipement_id"
                required
                error={errors.equipement_id?.message}
              >
                <select
                  className={`form-input ${errors.equipement_id ? 'error' : ''}`}
                  {...register('equipement_id', {
                    required: 'L\'équipement est requis'
                  })}
                  onChange={(e) => {
                    const equipment = equipments.find(eq => eq.id === parseInt(e.target.value));
                    if (equipment) {
                      setSelectedEquipment(equipment);
                      setValue('client_id', equipment.client_id);
                    }
                  }}
                >
                  <option value="">Sélectionner un équipement</option>
                  {equipments.map(equipment => (
                    <option key={equipment.id} value={equipment.id}>
                      {equipment.nom} - {equipment.modele}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField
                label="Client"
                name="client_id"
                required
                error={errors.client_id?.message}
              >
                <select
                  className={`form-input ${errors.client_id ? 'error' : ''}`}
                  {...register('client_id', {
                    required: 'Le client est requis'
                  })}
                  disabled={selectedEquipment}
                >
                  <option value="">Sélectionner un client</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.nom}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>
          </div>

          {/* Scheduling */}
          <div className="space-y-6">
            <h4 className="text-lg font-medium text-gray-900 border-b pb-2">
              Planification
            </h4>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <FormField
                label="Date prévue"
                name="date_prevue"
                error={errors.date_prevue?.message}
              >
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="datetime-local"
                    className={`form-input pl-10 ${errors.date_prevue ? 'error' : ''}`}
                    {...register('date_prevue')}
                  />
                </div>
              </FormField>

              <FormField
                label="Durée estimée (heures)"
                name="duree_estimee"
                error={errors.duree_estimee?.message}
              >
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    className={`form-input pl-10 ${errors.duree_estimee ? 'error' : ''}`}
                    placeholder="Ex: 2.5"
                    {...register('duree_estimee', {
                      min: { value: 0.5, message: 'La durée minimale est de 0.5 heure' }
                    })}
                  />
                </div>
              </FormField>
            </div>
          </div>

          {/* Assignment */}
          <div className="space-y-6">
            <h4 className="text-lg font-medium text-gray-900 border-b pb-2">
              Attribution
            </h4>
            
            <FormField
              label="Technicien principal"
              name="technicien_principal"
              error={errors.technicien_principal?.message}
            >
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  className={`form-input pl-10 ${errors.technicien_principal ? 'error' : ''}`}
                  {...register('technicien_principal')}
                >
                  <option value="">Sélectionner un technicien</option>
                  {users.filter(user => user.role === 'TECHNICIEN').map(user => (
                    <option key={user.id} value={user.id}>
                      {user.prenom} {user.nom}
                    </option>
                  ))}
                </select>
              </div>
            </FormField>
          </div>

          {/* Additional Information */}
          <div className="space-y-6">
            <h4 className="text-lg font-medium text-gray-900 border-b pb-2">
              Informations complémentaires
            </h4>
            
            <FormField
              label="Matériel requis"
              name="materiel_requis"
              error={errors.materiel_requis?.message}
            >
              <textarea
                rows={3}
                className={`form-input ${errors.materiel_requis ? 'error' : ''}`}
                placeholder="Listez le matériel et les outils nécessaires..."
                {...register('materiel_requis')}
              />
            </FormField>

            <FormField
              label="Conditions spécifiques"
              name="conditions_specifiques"
              error={errors.conditions_specifiques?.message}
            >
              <textarea
                rows={3}
                className={`form-input ${errors.conditions_specifiques ? 'error' : ''}`}
                placeholder="Conditions d'accès, contraintes, précautions..."
                {...register('conditions_specifiques')}
              />
            </FormField>

            <FormField
              label="Observations"
              name="observations"
              error={errors.observations?.message}
            >
              <textarea
                rows={3}
                className={`form-input ${errors.observations ? 'error' : ''}`}
                placeholder="Observations et notes diverses..."
                {...register('observations')}
              />
            </FormField>
          </div>
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
                {intervention ? 'Mettre à jour' : 'Créer l\'intervention'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default InterventionForm;