// src/components/interventions/InterventionForm.jsx
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { 
  Calendar, Clock, AlertTriangle, Package, User, FileText, 
  Wrench, Settings, Save, X, Search
} from 'lucide-react';
import FormField from '../forms/FormField';
import Select from '../forms/Select';
import { useEquipment } from '../../hooks/useEquipment';
import { useClients } from '../../hooks/useClients';

const InterventionForm = ({ 
  intervention = null, 
  onSubmit, 
  onCancel, 
  loading = false 
}) => {
  const [selectedClient, setSelectedClient] = useState(null);
  const [filteredEquipment, setFilteredEquipment] = useState([]);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset
  } = useForm({
    defaultValues: {
      equipement_id: intervention?.equipement_id || '',
      date: intervention?.date || new Date().toISOString().split('T')[0],
      description: intervention?.description || '',
      urgence: intervention?.urgence || false,
      statut: intervention?.statut || 'PLANIFIEE',
      type_intervention: intervention?.type_intervention || 'MAINTENANCE',
      priorite: intervention?.priorite || 'NORMALE',
      duree_estimee: intervention?.duree_estimee || '',
      cout_estime: intervention?.cout_estime || ''
    }
  });

  // Watch for equipment selection to get client info
  const selectedEquipmentId = watch('equipement_id');
  
  // Fetch data
  const { data: equipmentData, isLoading: equipmentLoading } = useEquipment({ 
    limit: 100 // Get more equipment for selection
  });
  const { data: clientsData } = useClients({ limit: 100 });

  // Equipment options for select
  const equipmentOptions = equipmentData?.data?.map(eq => ({
    value: eq.id,
    label: `${eq.nom} - ${eq.marque} ${eq.modele} (${eq.proprietaire?.nom_entreprise})`,
    client: eq.proprietaire
  })) || [];

  // Filter equipment by selected client
  const clientOptions = clientsData?.data?.map(client => ({
    value: client.id,
    label: client.nom_entreprise
  })) || [];

  useEffect(() => {
    if (selectedClient) {
      const filtered = equipmentOptions.filter(eq => 
        eq.client?.id === selectedClient
      );
      setFilteredEquipment(filtered);
    } else {
      setFilteredEquipment(equipmentOptions);
    }
  }, [selectedClient, equipmentData]);

  // Reset form when intervention prop changes
  useEffect(() => {
    if (intervention) {
      reset({
        equipement_id: intervention.equipement_id,
        date: intervention.date,
        description: intervention.description,
        urgence: intervention.urgence,
        statut: intervention.statut,
        type_intervention: intervention.type_intervention || 'MAINTENANCE',
        priorite: intervention.priorite || 'NORMALE',
        duree_estimee: intervention.duree_estimee || '',
        cout_estime: intervention.cout_estime || ''
      });
    }
  }, [intervention, reset]);

  const onFormSubmit = (data) => {
    // Convert string values to appropriate types
    const formattedData = {
      ...data,
      duree_estimee: data.duree_estimee ? parseInt(data.duree_estimee) : null,
      cout_estime: data.cout_estime ? parseFloat(data.cout_estime) : null,
      equipement_id: parseInt(data.equipement_id)
    };
    
    onSubmit(formattedData);
  };

  const interventionTypes = [
    { value: 'MAINTENANCE', label: 'Maintenance' },
    { value: 'RENOVATION', label: 'Rénovation' },
    { value: 'REPARATION', label: 'Réparation' },
    { value: 'INSTALLATION', label: 'Installation' }
  ];

  const priorityOptions = [
    { value: 'BASSE', label: 'Basse' },
    { value: 'NORMALE', label: 'Normale' },
    { value: 'HAUTE', label: 'Haute' },
    { value: 'CRITIQUE', label: 'Critique' }
  ];

  const statusOptions = [
    { value: 'PLANIFIEE', label: 'Planifiée' },
    { value: 'EN_ATTENTE_PDR', label: 'En Attente PDR' },
    { value: 'EN_COURS', label: 'En Cours' },
    { value: 'EN_PAUSE', label: 'En Pause' },
    { value: 'TERMINEE', label: 'Terminée' },
    { value: 'ANNULEE', label: 'Annulée' },
    { value: 'ECHEC', label: 'Échec' }
  ];

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Wrench className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {intervention ? 'Modifier l\'Intervention' : 'Nouvelle Intervention'}
            </h3>
            <p className="text-sm text-gray-600">
              {intervention ? 'Mettre à jour les détails' : 'Créer une nouvelle intervention'}
            </p>
          </div>
        </div>
        {intervention && (
          <div className="text-right text-sm text-gray-500">
            <p>ID: #{intervention.id}</p>
            <p>Créé le {new Date(intervention.createdAt || Date.now()).toLocaleDateString('fr-FR')}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4">
        {/* Left Column */}
        <div className="space-y-4">
          {/* Client Filter (Optional) */}
          <FormField
            label="Filtrer par client (optionnel)"
            name="client_filter"
            help="Sélectionner un client pour filtrer les équipements"
          >
            <Select
              value={selectedClient ? { value: selectedClient, label: clientOptions.find(c => c.value === selectedClient)?.label } : null}
              onChange={(option) => setSelectedClient(option?.value || null)}
              options={clientOptions}
              placeholder="Tous les clients"
              searchable
              className="w-full"
            />
          </FormField>

          {/* Equipment Selection */}
          <FormField
            label="Équipement"
            name="equipement_id"
            required
            error={errors.equipement_id?.message}
          >
            <Select
              value={selectedEquipmentId ? { 
                value: parseInt(selectedEquipmentId), 
                label: filteredEquipment.find(eq => eq.value === parseInt(selectedEquipmentId))?.label 
              } : null}
              onChange={(option) => setValue('equipement_id', option?.value || '')}
              options={filteredEquipment}
              placeholder="Sélectionner un équipement"
              searchable
              className="w-full"
              error={!!errors.equipement_id}
            />
            <input
              type="hidden"
              {...register('equipement_id', {
                required: 'L\'équipement est requis'
              })}
            />
          </FormField>

          {/* Date */}
          <FormField
            label="Date d'intervention"
            name="date"
            required
            error={errors.date?.message}
          >
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="date"
                className={`form-input pl-10 ${errors.date ? 'error' : ''}`}
                {...register('date', {
                  required: 'La date est requise'
                })}
              />
            </div>
          </FormField>

          {/* Type d'intervention */}
          <FormField
            label="Type d'intervention"
            name="type_intervention"
            required
            error={errors.type_intervention?.message}
          >
            <div className="relative">
              <Settings className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                className={`form-input pl-10 ${errors.type_intervention ? 'error' : ''}`}
                {...register('type_intervention', {
                  required: 'Le type d\'intervention est requis'
                })}
              >
                {interventionTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </FormField>

          {/* Priority */}
          <FormField
            label="Priorité"
            name="priorite"
            error={errors.priorite?.message}
          >
            <select
              className={`form-input ${errors.priorite ? 'error' : ''}`}
              {...register('priorite')}
            >
              {priorityOptions.map(priority => (
                <option key={priority.value} value={priority.value}>
                  {priority.label}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Description */}
          <FormField
            label="Description"
            name="description"
            help="Décrivez le problème ou les travaux à effectuer"
            error={errors.description?.message}
          >
            <textarea
              rows={4}
              className={`form-input ${errors.description ? 'error' : ''}`}
              placeholder="Décrivez l'intervention en détail..."
              {...register('description', {
                maxLength: {
                  value: 1000,
                  message: 'La description ne peut pas dépasser 1000 caractères'
                }
              })}
            />
          </FormField>

          {/* Duration and Cost */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Durée estimée (heures)"
              name="duree_estimee"
              error={errors.duree_estimee?.message}
            >
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  min="1"
                  step="0.5"
                  className={`form-input pl-10 ${errors.duree_estimee ? 'error' : ''}`}
                  placeholder="Ex: 2.5"
                  {...register('duree_estimee', {
                    min: {
                      value: 0,
                      message: 'La durée doit être positive'
                    }
                  })}
                />
              </div>
            </FormField>

            <FormField
              label="Coût estimé (MAD)"
              name="cout_estime"
              error={errors.cout_estime?.message}
            >
              <input
                type="number"
                min="0"
                step="0.01"
                className={`form-input ${errors.cout_estime ? 'error' : ''}`}
                placeholder="Ex: 1500.00"
                {...register('cout_estime', {
                  min: {
                    value: 0,
                    message: 'Le coût doit être positif'
                  }
                })}
              />
            </FormField>
          </div>

          {/* Status (only for editing) */}
          {intervention && (
            <FormField
              label="Statut"
              name="statut"
              error={errors.statut?.message}
            >
              <select
                className={`form-input ${errors.statut ? 'error' : ''}`}
                {...register('statut')}
              >
                {statusOptions.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </FormField>
          )}

          {/* Urgency and Flags */}
          <div className="space-y-3">
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
            
            <p className="text-xs text-gray-500 ml-7">
              Les interventions urgentes sont prioritaires dans le workflow
            </p>
          </div>
        </div>
      </div>

      {/* Equipment Info Display */}
      {selectedEquipmentId && (
        <div className="mx-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2 flex items-center space-x-2">
            <Package className="w-4 h-4" />
            <span>Informations Équipement</span>
          </h4>
          {(() => {
            const selectedEq = equipmentOptions.find(eq => eq.value === parseInt(selectedEquipmentId));
            return selectedEq ? (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-blue-700"><strong>Client:</strong> {selectedEq.client?.nom_entreprise}</p>
                  <p className="text-blue-700"><strong>Contact:</strong> {selectedEq.client?.contact_principal}</p>
                </div>
                <div>
                  <p className="text-blue-700"><strong>Téléphone:</strong> {selectedEq.client?.telephone_contact}</p>
                  <p className="text-blue-700"><strong>Email:</strong> {selectedEq.client?.email_contact}</p>
                </div>
              </div>
            ) : null;
          })()}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-end space-x-3 p-4 border-t border-gray-200 bg-gray-50">
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
          disabled={loading || equipmentLoading}
          className="btn btn-primary"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              {intervention ? 'Modification...' : 'Création...'}
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              {intervention ? 'Modifier' : 'Créer l\'intervention'}
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default InterventionForm;