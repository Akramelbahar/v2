import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { 
  Package, Settings, DollarSign, Building, User, 
  Save, X, AlertCircle, CheckCircle 
} from 'lucide-react';
import { 
  useCreateEquipment, 
  useUpdateEquipment, 
  useEquipmentTypes 
} from '../hooks/useEquipment';
import { useClients } from '../hooks/useClients';
import FormField from '../components/forms/FormField';
import Select from '../components/forms/Select';
import Modal from '../components/common/Modal';
import { ButtonSpinner } from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const EquipmentForm = ({ 
  isOpen, 
  onClose, 
  equipment = null, 
  onSuccess 
}) => {
  const isEditing = !!equipment;
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // API hooks
  const createEquipmentMutation = useCreateEquipment();
  const updateEquipmentMutation = useUpdateEquipment();
  const { data: equipmentTypes = [] } = useEquipmentTypes();
  const { data: clientsData } = useClients({ limit: 1000 });

  // Form setup
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    watch,
    setValue,
    clearErrors
  } = useForm({
    defaultValues: {
      nom: '',
      marque: '',
      modele: '',
      type_equipement: '',
      etatDeReception: '',
      valeur: '',
      cout: '',
      proprietaire_id: ''
    }
  });

  // Reset form when equipment changes
  useEffect(() => {
    if (equipment) {
      reset({
        nom: equipment.nom || '',
        marque: equipment.marque || '',
        modele: equipment.modele || '',
        type_equipement: equipment.type_equipement || '',
        etatDeReception: equipment.etatDeReception || '',
        valeur: equipment.valeur || '',
        cout: equipment.cout || '',
        proprietaire_id: equipment.proprietaire_id || ''
      });
    } else {
      reset({
        nom: '',
        marque: '',
        modele: '',
        type_equipement: '',
        etatDeReception: '',
        valeur: '',
        cout: '',
        proprietaire_id: ''
      });
    }
  }, [equipment, reset]);

  // Prepare options for selects
  const typeOptions = equipmentTypes.map(type => ({
    value: type,
    label: type.replace(/_/g, ' ')
  }));

  const clientOptions = (clientsData?.data || []).map(client => ({
    value: client.id.toString(),
    label: client.nom_entreprise
  }));

  const receptionStateOptions = [
    { value: 'BON', label: 'Bon état' },
    { value: 'MOYEN', label: 'État moyen' },
    { value: 'MAUVAIS', label: 'Mauvais état' },
    { value: 'NEUF', label: 'Neuf' },
    { value: 'USAGE', label: 'Usagé' },
    { value: 'DEFECTUEUX', label: 'Défectueux' }
  ];

  // Form submission
  const onSubmit = async (data) => {
    setIsSubmitting(true);
    clearErrors();

    try {
      // Clean up data
      const cleanData = Object.entries(data).reduce((acc, [key, value]) => {
        if (value !== null && value !== '') {
          if (key === 'cout' && value) {
            acc[key] = parseFloat(value);
          } else if (key === 'proprietaire_id') {
            acc[key] = parseInt(value);
          } else {
            acc[key] = typeof value === 'string' ? value.trim() : value;
          }
        }
        return acc;
      }, {});

      let result;
      if (isEditing) {
        result = await updateEquipmentMutation.mutateAsync({
          id: equipment.id,
          data: cleanData
        });
      } else {
        result = await createEquipmentMutation.mutateAsync(cleanData);
      }

      // Success handling
      toast.success(
        isEditing 
          ? `Équipement "${cleanData.nom}" modifié avec succès` 
          : `Équipement "${cleanData.nom}" créé avec succès`
      );
      
      onSuccess?.(result);
      onClose();
      
    } catch (error) {
      console.error('Form submission error:', error);
      
      // Handle validation errors
      if (error.response?.data?.details) {
        error.response.data.details.forEach(detail => {
          if (detail.path) {
            setError(detail.path, {
              type: 'server',
              message: detail.msg || detail.message
            });
          }
        });
      }
      
      toast.error(
        error.response?.data?.message || 
        `Erreur lors de ${isEditing ? 'la modification' : 'la création'} de l'équipement`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isDirty && !isSubmitting) {
      if (window.confirm('Vous avez des modifications non sauvegardées. Voulez-vous vraiment fermer ?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        <div className="flex items-center space-x-2">
          <Package className="w-5 h-5 text-green-600" />
          <span>{isEditing ? 'Modifier l\'équipement' : 'Nouvel équipement'}</span>
        </div>
      }
      size="xl"
      closeOnOverlayClick={!isDirty}
    >
      <div className="space-y-6">
        {/* Basic Information Section */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>Informations de base</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <FormField
                label="Nom de l'équipement"
                name="nom"
                required
                error={errors.nom?.message}
              >
                <input
                  type="text"
                  className={`form-input w-full ${errors.nom ? 'error' : ''}`}
                  placeholder="Nom descriptif de l'équipement"
                  {...register('nom', {
                    required: 'Le nom de l\'équipement est requis',
                    minLength: {
                      value: 2,
                      message: 'Le nom doit contenir au moins 2 caractères'
                    },
                    maxLength: {
                      value: 255,
                      message: 'Le nom ne peut pas dépasser 255 caractères'
                    }
                  })}
                />
              </FormField>
            </div>

            <FormField
              label="Type d'équipement"
              name="type_equipement"
              error={errors.type_equipement?.message}
            >
              <select
                className={`form-input w-full ${errors.type_equipement ? 'error' : ''}`}
                {...register('type_equipement')}
              >
                <option value="">Sélectionner un type</option>
                {equipmentTypes.map(type => (
                  <option key={type} value={type}>
                    {type.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField
              label="Propriétaire"
              name="proprietaire_id"
              required
              error={errors.proprietaire_id?.message}
            >
              <select
                className={`form-input w-full ${errors.proprietaire_id ? 'error' : ''}`}
                {...register('proprietaire_id', {
                  required: 'Le propriétaire est requis'
                })}
              >
                <option value="">Sélectionner un client</option>
                {clientsData?.data?.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.nom_entreprise}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField
              label="Marque"
              name="marque"
              error={errors.marque?.message}
            >
              <input
                type="text"
                className={`form-input w-full ${errors.marque ? 'error' : ''}`}
                placeholder="Marque du fabricant"
                {...register('marque', {
                  maxLength: {
                    value: 100,
                    message: 'La marque ne peut pas dépasser 100 caractères'
                  }
                })}
              />
            </FormField>

            <FormField
              label="Modèle"
              name="modele"
              error={errors.modele?.message}
            >
              <input
                type="text"
                className={`form-input w-full ${errors.modele ? 'error' : ''}`}
                placeholder="Modèle ou référence"
                {...register('modele', {
                  maxLength: {
                    value: 100,
                    message: 'Le modèle ne peut pas dépasser 100 caractères'
                  }
                })}
              />
            </FormField>
          </div>
        </div>

        {/* State and Value Section */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <CheckCircle className="w-5 h-5" />
            <span>État et valeur</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              label="État de réception"
              name="etatDeReception"
              error={errors.etatDeReception?.message}
            >
              <select
                className={`form-input w-full ${errors.etatDeReception ? 'error' : ''}`}
                {...register('etatDeReception')}
              >
                <option value="">Sélectionner l'état</option>
                {receptionStateOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField
              label="Valeur estimée"
              name="valeur"
              error={errors.valeur?.message}
              help="Valeur estimée ou de référence"
            >
              <input
                type="text"
                className={`form-input w-full ${errors.valeur ? 'error' : ''}`}
                placeholder="Ex: 50000 MAD, Élevée, Faible..."
                {...register('valeur', {
                  maxLength: {
                    value: 100,
                    message: 'La valeur ne peut pas dépasser 100 caractères'
                  }
                })}
              />
            </FormField>

            <FormField
              label="Coût d'acquisition"
              name="cout"
              error={errors.cout?.message}
              help="Coût en MAD"
            >
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className={`form-input w-full pl-10 ${errors.cout ? 'error' : ''}`}
                  placeholder="0.00"
                  {...register('cout', {
                    min: {
                      value: 0,
                      message: 'Le coût ne peut pas être négatif'
                    },
                    validate: value => {
                      if (value && (isNaN(value) || value < 0)) {
                        return 'Veuillez entrer un montant valide';
                      }
                      return true;
                    }
                  })}
                />
              </div>
            </FormField>
          </div>
        </div>

        {/* Additional Information Section */}
        <div className="bg-yellow-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <AlertCircle className="w-5 h-5" />
            <span>Informations complémentaires</span>
          </h3>
          
          <div className="space-y-4">
            {/* Show current owner info if editing */}
            {isEditing && equipment?.proprietaire && (
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center space-x-2">
                  <Building className="w-4 h-4" />
                  <span>Propriétaire actuel</span>
                </h4>
                <div className="text-sm text-gray-600">
                  <div className="font-medium">{equipment.proprietaire.nom_entreprise}</div>
                  {equipment.proprietaire.secteur_activite && (
                    <div>Secteur: {equipment.proprietaire.secteur_activite}</div>
                  )}
                  {equipment.proprietaire.ville && (
                    <div>Ville: {equipment.proprietaire.ville}</div>
                  )}
                </div>
              </div>
            )}

            {/* Creation info if editing */}
            {isEditing && equipment?.ajouterPar && (
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>Informations de création</span>
                </h4>
                <div className="text-sm text-gray-600">
                  <div>Ajouté par: {equipment.ajouterPar.nom}</div>
                  {equipment.createdAt && (
                    <div>Date: {new Date(equipment.createdAt).toLocaleDateString('fr-FR')}</div>
                  )}
                </div>
              </div>
            )}

            {/* Intervention count if editing */}
            {isEditing && typeof equipment?.interventionCount === 'number' && (
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  Historique des interventions
                </h4>
                <div className="text-sm text-gray-600">
                  <div className="font-medium text-lg text-blue-600">
                    {equipment.interventionCount} intervention(s)
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Nombre total d'interventions enregistrées
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="btn btn-secondary"
          >
            <X className="w-4 h-4 mr-2" />
            Annuler
          </button>
          
          <button
            type="button"
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting || (!isDirty && isEditing)}
            className={`btn btn-primary ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isSubmitting ? (
              <>
                <ButtonSpinner size="small" />
                <span className="ml-2">
                  {isEditing ? 'Modification...' : 'Création...'}
                </span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                <span>{isEditing ? 'Modifier' : 'Créer'}</span>
              </>
            )}
          </button>
        </div>

        {/* Form Status */}
        {isDirty && (
          <div className="flex items-center text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
            <AlertCircle className="w-4 h-4 mr-2" />
            <span>Vous avez des modifications non sauvegardées</span>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default EquipmentForm;