import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Settings, Eye, EyeOff, Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ButtonSpinner } from '../components/LoadingSpinner';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, isAuthenticated, error, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the redirect path from location state or default to dashboard
  const from = location.state?.from?.pathname || '/';
  
  // Form setup with validation
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    clearErrors
  } = useForm({
    defaultValues: {
      username: '',
      password: ''
    }
  });
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);
  
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
      const result = await login(data);
      
      if (result.success) {
        // Navigation will be handled by the useEffect above
      } else {
        setError('root', {
          type: 'manual',
          message: result.error || 'Login failed'
        });
      }
    } catch (err) {
      console.error('Login error:', err);
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
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 to-primary-800 items-center justify-center p-12">
        <div className="max-w-md text-center text-white">
          <div className="mb-8">
            <Settings className="w-24 h-24 mx-auto mb-6 animate-spin-slow" />
            <h1 className="text-4xl font-bold mb-4">ETS RESELEC</h1>
            <p className="text-xl text-primary-100">
              Système de Gestion d'Équipements Industriels
            </p>
          </div>
          
          <div className="space-y-4 text-primary-100">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-primary-300 rounded-full"></div>
              <span>Gestion complète des interventions</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-primary-300 rounded-full"></div>
              <span>Suivi en temps réel des équipements</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-primary-300 rounded-full"></div>
              <span>Rapports et analyses détaillés</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="max-w-md w-full">
          {/* Mobile branding */}
          <div className="lg:hidden text-center mb-8">
            <Settings className="w-16 h-16 text-primary-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900">ETS RESELEC</h1>
            <p className="text-gray-600">Connexion à votre compte</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-soft p-8">
            <div className="hidden lg:block text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Bienvenue
              </h2>
              <p className="text-gray-600">
                Connectez-vous à votre compte ETS RESELEC
              </p>
            </div>
            
            {/* Error display */}
            {(error || errors.root) && (
              <div className="mb-6 p-4 bg-error-50 border border-error-200 rounded-lg flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-error-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-error-800">Erreur de connexion</h4>
                  <p className="text-sm text-error-700 mt-1">
                    {error || errors.root?.message}
                  </p>
                </div>
              </div>
            )}
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Username/Email field */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                  Nom d'utilisateur ou Email
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
                    placeholder="Entrez votre nom d'utilisateur"
                    {...register('username', {
                      required: 'Le nom d\'utilisateur est requis',
                      minLength: {
                        value: 3,
                        message: 'Le nom d\'utilisateur doit contenir au moins 3 caractères'
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
                    autoComplete="current-password"
                    className={`
                      form-input block w-full pl-10 pr-12 py-3 border rounded-lg
                      focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                      ${errors.password 
                        ? 'border-error-300 focus:ring-error-500 focus:border-error-500' 
                        : 'border-gray-300'
                      }
                    `}
                    placeholder="Entrez votre mot de passe"
                    {...register('password', {
                      required: 'Le mot de passe est requis',
                      minLength: {
                        value: 6,
                        message: 'Le mot de passe doit contenir au moins 6 caractères'
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
              
              {/* Remember me and forgot password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                    Se souvenir de moi
                  </label>
                </div>
                
                <Link
                  to="/forgot-password"
                  className="text-sm text-primary-600 hover:text-primary-800 font-medium"
                >
                  Mot de passe oublié ?
                </Link>
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
                    <span className="ml-2">Connexion en cours...</span>
                  </>
                ) : (
                  'Se connecter'
                )}
              </button>
            </form>
            
            {/* Register link */}
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600">
                Pas encore de compte ?{' '}
                <Link
                  to="/register"
                  className="font-medium text-primary-600 hover:text-primary-800"
                >
                  Demander un accès
                </Link>
              </p>
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

export default Login;