import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Settings, Eye, EyeOff, User, Mail, Lock, AlertCircle, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ButtonSpinner } from '../components/LoadingSpinner';

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { register: registerUser, isAuthenticated, error, clearError } = useAuth();
  const navigate = useNavigate();
  
  // Form setup with validation
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
    watch
  } = useForm({
    defaultValues: {
      nom: '',
      username: '',
      password: '',
      confirmPassword: '',
      section: ''
    }
  });
  
  // Watch password for confirmation validation
  const password = watch('password');
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);
  
  // Clear errors when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);
  
  // Handle form submission
  const onSubmit = async (data) => {
    setIsLoading(true);
    clearErrors();
    clearError();
    
    try {
      // Remove confirmPassword from the data sent to API
      const { confirmPassword, ...registrationData } = data;
      
      const result = await registerUser(registrationData);
      
      if (result.success) {
        // Navigation will be handled by the useEffect above
      } else {
        setError('root', {
          type: 'manual',
          message: result.error || 'Registration failed'
        });
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('root', {
        type: 'manual',
        message: 'An unexpected error occurred'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-secondary-600 to-secondary-800 items-center justify-center p-12">
        <div className="max-w-md text-center text-white">
          <div className="mb-8">
            <UserCheck className="w-24 h-24 mx-auto mb-6" />
            <h1 className="text-4xl font-bold mb-4">Rejoignez ETS RESELEC</h1>
            <p className="text-xl text-secondary-100">
              Créez votre compte pour accéder au système de gestion
            </p>
          </div>
          
          <div className="space-y-4 text-secondary-100">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-secondary-300 rounded-full"></div>
              <span>Gestion personnalisée selon votre rôle</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-secondary-300 rounded-full"></div>
              <span>Support technique disponible</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right side - Registration form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="max-w-md w-full">
          {/* Mobile branding */}
          <div className="lg:hidden text-center mb-8">
            <Settings className="w-16 h-16 text-primary-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900">ETS RESELEC</h1>
            <p className="text-gray-600">Créer un nouveau compte</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-soft p-8">
            <div className="hidden lg:block text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Créer un compte
              </h2>
              <p className="text-gray-600">
                Remplissez le formulaire pour demander un accès
              </p>
            </div>
            
            {/* Error display */}
            {(error || errors.root) && (
              <div className="mb-6 p-4 bg-error-50 border border-error-200 rounded-lg flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-error-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-error-800">Erreur d'inscription</h4>
                  <p className="text-sm text-error-700 mt-1">
                    {error || errors.root?.message}
                  </p>
                </div>
              </div>
            )}
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Full name field */}
              <div>
                <label htmlFor="nom" className="block text-sm font-medium text-gray-700 mb-2">
                  Nom complet
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="nom"
                    type="text"
                    autoComplete="name"
                    className={`
                      form-input block w-full pl-10 pr-3 py-3 border rounded-lg
                      focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                      ${errors.nom 
                        ? 'border-error-300 focus:ring-error-500 focus:border-error-500' 
                        : 'border-gray-300'
                      }
                    `}
                    placeholder="Entrez votre nom complet"
                    {...register('nom', {
                      required: 'Le nom est requis',
                      minLength: {
                        value: 2,
                        message: 'Le nom doit contenir au moins 2 caractères'
                      },
                      maxLength: {
                        value: 100,
                        message: 'Le nom ne peut pas dépasser 100 caractères'
                      }
                    })}
                  />
                </div>
                {errors.nom && (
                  <p className="mt-2 text-sm text-error-600 flex items-center space-x-1">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.nom.message}</span>
                  </p>
                )}
              </div>
              
              {/* Username field */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                  Nom d'utilisateur
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="username"
                    type="text"
                    autoComplete="username"
                    className={`
                      form-input block w-full pl-10 pr-3 py-3 border rounded-lg
                      focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                      ${errors.username 
                        ? 'border-error-300 focus:ring-error-500 focus:border-error-500' 
                        : 'border-gray-300'
                      }
                    `}
                    placeholder="Choisissez un nom d'utilisateur"
                    {...register('username', {
                      required: 'Le nom d\'utilisateur est requis',
                      minLength: {
                        value: 3,
                        message: 'Le nom d\'utilisateur doit contenir au moins 3 caractères'
                      },
                      maxLength: {
                        value: 100,
                        message: 'Le nom d\'utilisateur ne peut pas dépasser 100 caractères'
                      },
                      pattern: {
                        value: /^[a-zA-Z0-9_]+$/,
                        message: 'Le nom d\'utilisateur ne peut contenir que des lettres, chiffres et underscores'
                      }
                    })}
                  />
                </div>
                {errors.username && (
                  <p className="mt-2 text-sm text-error-600 flex items-center space-x-1">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.username.message}</span>
                  </p>
                )}
              </div>
              
              {/* Section field */}
              <div>
                <label htmlFor="section" className="block text-sm font-medium text-gray-700 mb-2">
                  Section / Département
                </label>
                <input
                  id="section"
                  type="text"
                  className={`
                    form-input block w-full px-3 py-3 border rounded-lg
                    focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                    ${errors.section 
                      ? 'border-error-300 focus:ring-error-500 focus:border-error-500' 
                      : 'border-gray-300'
                    }
                  `}
                  placeholder="Ex: Maintenance, Technique, Administration"
                  {...register('section', {
                    maxLength: {
                      value: 100,
                      message: 'La section ne peut pas dépasser 100 caractères'
                    }
                  })}
                />
                {errors.section && (
                  <p className="mt-2 text-sm text-error-600 flex items-center space-x-1">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.section.message}</span>
                  </p>
                )}
              </div>
              
              {/* Password field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Mot de passe
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    className={`
                      form-input block w-full pl-10 pr-12 py-3 border rounded-lg
                      focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                      ${errors.password 
                        ? 'border-error-300 focus:ring-error-500 focus:border-error-500' 
                        : 'border-gray-300'
                      }
                    `}
                    placeholder="Créez un mot de passe sécurisé"
                    {...register('password', {
                      required: 'Le mot de passe est requis',
                      minLength: {
                        value: 6,
                        message: 'Le mot de passe doit contenir au moins 6 caractères'
                      },
                      pattern: {
                        value: /^(?=.*[a-zA-Z])(?=.*\d)/,
                        message: 'Le mot de passe doit contenir au moins une lettre et un chiffre'
                      }
                    })}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-2 text-sm text-error-600 flex items-center space-x-1">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.password.message}</span>
                  </p>
                )}
              </div>
              
              {/* Confirm password field */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    className={`
                      form-input block w-full pl-10 pr-12 py-3 border rounded-lg
                      focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                      ${errors.confirmPassword 
                        ? 'border-error-300 focus:ring-error-500 focus:border-error-500' 
                        : 'border-gray-300'
                      }
                    `}
                    placeholder="Confirmez votre mot de passe"
                    {...register('confirmPassword', {
                      required: 'La confirmation du mot de passe est requise',
                      validate: value =>
                        value === password || 'Les mots de passe ne correspondent pas'
                    })}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-2 text-sm text-error-600 flex items-center space-x-1">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.confirmPassword.message}</span>
                  </p>
                )}
              </div>
              
              {/* Terms and conditions */}
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="terms"
                    type="checkbox"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    {...register('terms', {
                      required: 'Vous devez accepter les conditions d\'utilisation'
                    })}
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="terms" className="text-gray-700">
                    J'accepte les{' '}
                    <Link to="/terms" className="text-primary-600 hover:text-primary-800 font-medium">
                      conditions d'utilisation
                    </Link>
                    {' '}et la{' '}
                    <Link to="/privacy" className="text-primary-600 hover:text-primary-800 font-medium">
                      politique de confidentialité
                    </Link>
                  </label>
                  {errors.terms && (
                    <p className="mt-1 text-sm text-error-600 flex items-center space-x-1">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.terms.message}</span>
                    </p>
                  )}
                </div>
              </div>
              
              {/* Submit button */}
              <button
                type="submit"
                disabled={isSubmitting || isLoading}
                className={`
                  w-full flex justify-center items-center py-3 px-4 border border-transparent 
                  rounded-lg text-sm font-medium text-white transition-colors
                  ${isSubmitting || isLoading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
                  }
                `}
              >
                {isSubmitting || isLoading ? (
                  <>
                    <ButtonSpinner />
                    <span className="ml-2">Création en cours...</span>
                  </>
                ) : (
                  'Créer le compte'
                )}
              </button>
            </form>
            
            {/* Login link */}
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600">
                Vous avez déjà un compte ?{' '}
                <Link
                  to="/login"
                  className="font-medium text-primary-600 hover:text-primary-800"
                >
                  Se connecter
                </Link>
              </p>
            </div>
          </div>
          
          {/* Info note */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">Note importante</p>
                <p className="mt-1">
                  Votre demande d'accès sera examinée par un administrateur. 
                  Vous recevrez une notification une fois votre compte activé.
                </p>
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="mt-8 text-center text-xs text-gray-500">
            <p>© 2024 ETS RESELEC. Tous droits réservés.</p>
            <p className="mt-1">Version {process.env.REACT_APP_VERSION || '1.0.0'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;