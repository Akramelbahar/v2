import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { 
  Building, User, Mail, Phone, MapPin, Globe, 
  Save, X, AlertCircle, CheckCircle 
} from 'lucide-react';
import { useCreateClient, useUpdateClient, useClientSectors } from '../hooks/useClients';
import FormField from '../components/forms/FormField';
import Modal from '../components/common/Modal';
import { ButtonSpinner } from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const ClientForm = ({ 
  isOpen, 
  onClose, 
  client = null, 
  onSuccess 
}) => {
  const isEditing = !!client;
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // API hooks
  const createClientMutation = useCreateClient();
  const updateClientMutation = useUpdateClient();
  const { data: sectors = [] } = useClientSectors();

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
      nom_entreprise: '',
      secteur_activite: '',
      adresse: '',
      ville: '',
      codePostal: '',
      tel: '',
      fax: '',
      email: '',
      siteWeb: '',
      contact_principal: '',
      poste_contact: '',
      telephone_contact: '',
      email_contact: '',
      registre_commerce: '',
      forme_juridique: ''
    }
  });

  // Reset form when client changes
  useEffect(() => {
    if (client) {
      reset({
        nom_entreprise: client.nom_entreprise || '',
        secteur_activite: client.secteur_activite || '',
        adresse: client.adresse || '',
        ville: client.ville || '',
        codePostal: client.codePostal || '',
        tel: client.tel || '',
        fax: client.fax || '',
        email: client.email || '',
        siteWeb: client.siteWeb || '',
        contact_principal: client.contact_principal || '',
        poste_contact: client.poste_contact || '',
        telephone_contact: client.telephone_contact || '',
        email_contact: client.email_contact || '',
        registre_commerce: client.registre_commerce || '',
        forme_juridique: client.forme_juridique || ''
      });
    } else {
      reset({
        nom_entreprise: '',
        secteur_activite: '',
        adresse: '',
        ville: '',
        codePostal: '',
        tel: '',
        fax: '',
        email: '',
        siteWeb: '',
        contact_principal: '',
        poste_contact: '',
        telephone_contact: '',
        email_contact: '',
        registre_commerce: '',
        forme_juridique: ''
      });
    }
  }, [client, reset]);

  // Form submission
  const onSubmit = async (data) => {
    setIsSubmitting(true);
    clearErrors();

    try {
      // Clean up empty strings and null values
      const cleanData = Object.entries(data).reduce((acc, [key, value]) => {
        if (value && value.trim() !== '') {
          acc[key] = value.trim();
        }
        return acc;
      }, {});

      let result;
      if (isEditing) {
        result = await updateClientMutation.mutateAsync({
          id: client.id,
          data: cleanData
        });
      } else {
        result = await createClientMutation.mutateAsync(cleanData);
      }

      // Success handling
      toast.success(
        isEditing 
          ? `Client "${cleanData.nom_entreprise}" modifié avec succès` 
          : `Client "${cleanData.nom_entreprise}" créé avec succès`
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
        `Erreur lors de ${isEditing ? 'la modification' : 'la création'} du client`
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
          <Building className="w-5 h-5 text-blue-600" />
          <span>{isEditing ? 'Modifier le client' : 'Nouveau client'}</span>
        </div>
      }
      size="2xl"
      closeOnOverlayClick={!isDirty}
    >
      <div className="space-y-6">
        {/* Company Information Section */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <Building className="w-5 h-5" />
            <span>Informations de l'entreprise</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <FormField
                label="Nom de l'entreprise"
                name="nom_entreprise"
                required
                error={errors.nom_entreprise?.message}
              >
                <input
                  type="text"
                  className={`form-input w-full ${errors.nom_entreprise ? 'error' : ''}`}
                  placeholder="Nom complet de l'entreprise"
                  {...register('nom_entreprise', {
                    required: 'Le nom de l\'entreprise est requis',
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
              label="Secteur d'activité"
              name="secteur_activite"
              error={errors.secteur_activite?.message}
            >
              <input
                type="text"
                list="sectors-list"
                className={`form-input w-full ${errors.secteur_activite ? 'error' : ''}`}
                placeholder="Ex: Industrie, Services, Commerce..."
                {...register('secteur_activite', {
                  maxLength: {
                    value: 255,
                    message: 'Le secteur ne peut pas dépasser 255 caractères'
                  }
                })}
              />
              <datalist id="sectors-list">
                {sectors.map(sector => (
                  <option key={sector} value={sector} />
                ))}
              </datalist>
            </FormField>

            <FormField
              label="Forme juridique"
              name="forme_juridique"
              error={errors.forme_juridique?.message}
            >
              <select
                className={`form-input w-full ${errors.forme_juridique ? 'error' : ''}`}
                {...register('forme_juridique')}
              >
                <option value="">Sélectionner...</option>
                <option value="SARL">SARL</option>
                <option value="SA">SA</option>
                <option value="SAS">SAS</option>
                <option value="EURL">EURL</option>
                <option value="SNC">SNC</option>
                <option value="GIE">GIE</option>
                <option value="Auto-entrepreneur">Auto-entrepreneur</option>
                <option value="Association">Association</option>
                <option value="Autre">Autre</option>
              </select>
            </FormField>

            <FormField
              label="Registre de commerce"
              name="registre_commerce"
              error={errors.registre_commerce?.message}
            >
              <input
                type="text"
                className={`form-input w-full ${errors.registre_commerce ? 'error' : ''}`}
                placeholder="Numéro RC"
                {...register('registre_commerce', {
                  maxLength: {
                    value: 100,
                    message: 'Le numéro RC ne peut pas dépasser 100 caractères'
                  }
                })}
              />
            </FormField>
          </div>
        </div>

        {/* Contact Information Section */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <Phone className="w-5 h-5" />
            <span>Informations de contact</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Téléphone principal"
              name="tel"
              error={errors.tel?.message}
            >
              <input
                type="tel"
                className={`form-input w-full ${errors.tel ? 'error' : ''}`}
                placeholder="+212 5XX XX XX XX"
                {...register('tel', {
                  pattern: {
                    value: /^[\d\s\-\+\(\)\.]{8,20}$/,
                    message: 'Format de téléphone invalide'
                  }
                })}
              />
            </FormField>

            <FormField
              label="Fax"
              name="fax"
              error={errors.fax?.message}
            >
              <input
                type="tel"
                className={`form-input w-full ${errors.fax ? 'error' : ''}`}
                placeholder="+212 5XX XX XX XX"
                {...register('fax', {
                  pattern: {
                    value: /^[\d\s\-\+\(\)\.]{8,20}$/,
                    message: 'Format de fax invalide'
                  }
                })}
              />
            </FormField>

            <FormField
              label="Email principal"
              name="email"
              error={errors.email?.message}
            >
              <input
                type="email"
                className={`form-input w-full ${errors.email ? 'error' : ''}`}
                placeholder="contact@entreprise.com"
                {...register('email', {
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Format d\'email invalide'
                  }
                })}
              />
            </FormField>

            <FormField
              label="Site web"
              name="siteWeb"
              error={errors.siteWeb?.message}
            >
              <input
                type="url"
                className={`form-input w-full ${errors.siteWeb ? 'error' : ''}`}
                placeholder="https://www.entreprise.com"
                {...register('siteWeb', {
                  pattern: {
                    value: /^https?:\/\/.+/,
                    message: 'URL invalide (doit commencer par http:// ou https://)'
                  }
                })}
              />
            </FormField>
          </div>
        </div>

        {/* Address Section */}
        <div className="bg-green-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <MapPin className="w-5 h-5" />
            <span>Adresse</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-3">
              <FormField
                label="Adresse complète"
                name="adresse"
                error={errors.adresse?.message}
              >
                <textarea
                  rows={2}
                  className={`form-input w-full ${errors.adresse ? 'error' : ''}`}
                  placeholder="Adresse complète de l'entreprise"
                  {...register('adresse', {
                    maxLength: {
                      value: 255,
                      message: 'L\'adresse ne peut pas dépasser 255 caractères'
                    }
                  })}
                />
              </FormField>
            </div>

            <FormField
              label="Ville"
              name="ville"
              error={errors.ville?.message}
            >
              <input
                type="text"
                className={`form-input w-full ${errors.ville ? 'error' : ''}`}
                placeholder="Casablanca, Rabat, Tanger..."
                {...register('ville', {
                  maxLength: {
                    value: 100,
                    message: 'La ville ne peut pas dépasser 100 caractères'
                  }
                })}
              />
            </FormField>

            <FormField
              label="Code postal"
              name="codePostal"
              error={errors.codePostal?.message}
            >
              <input
                type="text"
                className={`form-input w-full ${errors.codePostal ? 'error' : ''}`}
                placeholder="20000"
                {...register('codePostal', {
                  pattern: {
                    value: /^[0-9A-Za-z\s\-]{2,20}$/,
                    message: 'Format de code postal invalide'
                  }
                })}
              />
            </FormField>
          </div>
        </div>

        {/* Contact Person Section */}
        <div className="bg-yellow-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <User className="w-5 h-5" />
            <span>Personne de contact</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Nom du contact principal"
              name="contact_principal"
              error={errors.contact_principal?.message}
            >
              <input
                type="text"
                className={`form-input w-full ${errors.contact_principal ? 'error' : ''}`}
                placeholder="Nom et prénom"
                {...register('contact_principal', {
                  maxLength: {
                    value: 100,
                    message: 'Le nom ne peut pas dépasser 100 caractères'
                  }
                })}
              />
            </FormField>

            <FormField
              label="Poste/Fonction"
              name="poste_contact"
              error={errors.poste_contact?.message}
            >
              <input
                type="text"
                className={`form-input w-full ${errors.poste_contact ? 'error' : ''}`}
                placeholder="Directeur, Responsable maintenance..."
                {...register('poste_contact', {
                  maxLength: {
                    value: 100,
                    message: 'Le poste ne peut pas dépasser 100 caractères'
                  }
                })}
              />
            </FormField>

            <FormField
              label="Téléphone contact"
              name="telephone_contact"
              error={errors.telephone_contact?.message}
            >
              <input
                type="tel"
                className={`form-input w-full ${errors.telephone_contact ? 'error' : ''}`}
                placeholder="+212 6XX XX XX XX"
                {...register('telephone_contact', {
                  pattern: {
                    value: /^[\d\s\-\+\(\)\.]{8,20}$/,
                    message: 'Format de téléphone invalide'
                  }
                })}
              />
            </FormField>

            <FormField
              label="Email contact"
              name="email_contact"
              error={errors.email_contact?.message}
            >
              <input
                type="email"
                className={`form-input w-full ${errors.email_contact ? 'error' : ''}`}
                placeholder="contact.direct@entreprise.com"
                {...register('email_contact', {
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Format d\'email invalide'
                  }
                })}
              />
            </FormField>
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

export default ClientForm;