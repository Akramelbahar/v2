import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { User, Lock, Settings, AlertCircle, CheckCircle, Eye, EyeOff, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ButtonSpinner } from '../components/LoadingSpinner';

const Profile = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  const { user, updateProfile, changePassword } = useAuth();
  
  // Profile form
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors, isSubmitting: isProfileSubmitting },
    reset: resetProfile
  } = useForm({
    defaultValues: {
      nom: user?.nom || '',
      username: user?.username || '',
      section: user?.section || ''
    }
  });
  
  // Password form
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors, isSubmitting: isPasswordSubmitting },
    reset: resetPassword,
    watch
  } = useForm({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  });
  
  const newPassword = watch('newPassword');
  
  // Handle profile update
  const onProfileSubmit = async (data) => {
    setIsUpdating(true);
    
    try {
      const result = await updateProfile(data);
      
      if (result.success) {
        // Profile updated successfully
      }
    } catch (error) {
      console.error('Profile update error:', error);
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Handle password change
  const onPasswordSubmit = async (data) => {
    setIsChangingPassword(true);
    
    try {
      const { confirmPassword, ...passwordData } = data;
      const result = await changePassword(passwordData);
      
      if (result.success) {
        resetPassword();
      }
    } catch (error) {
      console.error('Password change error:', error);
    } finally {
      setIsChangingPassword(false);
    }
  };
  
  const getUserInitials = (name) => {
    return name
      ?.split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';
  };
  
  const ProfileTab = () => (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-lg p-6 text-white">
  <div className="flex items-center space-x-6">
    <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-2xl font-bold">
      {getUserInitials(user?.nom)}
    </div>
    <div>
      <h2 className="text-2xl font-bold">{user?.nom}</h2>
      <p className="text-primary-100">@{user?.username}</p>
      {/* Fix: Handle role being an object */}
      <p className="text-primary-200">
        {typeof user?.role === 'object' ? user.role?.nom : user?.role || 'Rôle non défini'}
      </p>
    </div>
  </div>
</div>
      
      {/* Profile Form */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold flex items-center space-x-2">
            <User className="w-5 h-5" />
            <span>Informations personnelles</span>
          </h3>
          <p className="text-gray-600 mt-1">Gérez vos informations de profil</p>
        </div>
        
        <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="p-6 space-y-6">
          {/* Full Name */}
          <div>
            <label htmlFor="nom" className="block text-sm font-medium text-gray-700 mb-2">
              Nom complet
            </label>
            <input
              id="nom"
              type="text"
              className={`
                form-input block w-full px-3 py-2 border rounded-lg
                focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                ${profileErrors.nom ? 'border-error-300' : 'border-gray-300'}
              `}
              {...registerProfile('nom', {
                required: 'Le nom est requis',
                minLength: {
                  value: 2,
                  message: 'Le nom doit contenir au moins 2 caractères'
                }
              })}
            />
            {profileErrors.nom && (
              <p className="mt-2 text-sm text-error-600 flex items-center space-x-1">
                <AlertCircle className="w-4 h-4" />
                <span>{profileErrors.nom.message}</span>
              </p>
            )}
          </div>
          
          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              Nom d'utilisateur
            </label>
            <input
              id="username"
              type="text"
              disabled
              className="form-input block w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
              value={user?.username || ''}
            />
            <p className="mt-1 text-sm text-gray-500">
              Le nom d'utilisateur ne peut pas être modifié
            </p>
          </div>
          
          {/* Section */}
          <div>
            <label htmlFor="section" className="block text-sm font-medium text-gray-700 mb-2">
              Section / Département
            </label>
            <input
              id="section"
              type="text"
              className={`
                form-input block w-full px-3 py-2 border rounded-lg
                focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                ${profileErrors.section ? 'border-error-300' : 'border-gray-300'}
              `}
              placeholder="Ex: Maintenance, Technique, Administration"
              {...registerProfile('section')}
            />
            {profileErrors.section && (
              <p className="mt-2 text-sm text-error-600 flex items-center space-x-1">
                <AlertCircle className="w-4 h-4" />
                <span>{profileErrors.section.message}</span>
              </p>
            )}
          </div>
          
          {/* Role (Read-only) */}
          <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Rôle
  </label>
  <input
    type="text"
    disabled
    className="form-input block w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
    value={typeof user?.role === 'object' ? user.role?.nom : user?.role || ''}
  />
  <p className="mt-1 text-sm text-gray-500">
    Le rôle est géré par les administrateurs
  </p>
</div>
          
          {/* Permissions (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Permissions
            </label>
            <div className="bg-gray-50 border border-gray-300 rounded-lg p-3">
              {user?.permissions?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {user.permissions.map((permission, index) => (
                    <span
                      key={index}
                      className="bg-primary-100 text-primary-800 px-2 py-1 rounded-full text-xs font-medium"
                    >
                      {permission}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Aucune permission spécifique</p>
              )}
            </div>
          </div>
          
          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isProfileSubmitting || isUpdating}
              className={`
                flex items-center space-x-2 px-6 py-2 border border-transparent rounded-lg text-sm font-medium text-white
                ${isProfileSubmitting || isUpdating
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
                }
              `}
            >
              {isProfileSubmitting || isUpdating ? (
                <>
                  <ButtonSpinner />
                  <span>Mise à jour...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Enregistrer</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
  
  const SecurityTab = () => (
    <div className="space-y-6">
      {/* Password Change Form */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold flex items-center space-x-2">
            <Lock className="w-5 h-5" />
            <span>Changer le mot de passe</span>
          </h3>
          <p className="text-gray-600 mt-1">Mettez à jour votre mot de passe pour sécuriser votre compte</p>
        </div>
        
        <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="p-6 space-y-6">
          {/* Current Password */}
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Mot de passe actuel
            </label>
            <div className="relative">
              <input
                id="currentPassword"
                type={showCurrentPassword ? 'text' : 'password'}
                className={`
                  form-input block w-full pr-12 px-3 py-2 border rounded-lg
                  focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                  ${passwordErrors.currentPassword ? 'border-error-300' : 'border-gray-300'}
                `}
                placeholder="Entrez votre mot de passe actuel"
                {...registerPassword('currentPassword', {
                  required: 'Le mot de passe actuel est requis'
                })}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
            {passwordErrors.currentPassword && (
              <p className="mt-2 text-sm text-error-600 flex items-center space-x-1">
                <AlertCircle className="w-4 h-4" />
                <span>{passwordErrors.currentPassword.message}</span>
              </p>
            )}
          </div>
          
          {/* New Password */}
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Nouveau mot de passe
            </label>
            <div className="relative">
              <input
                id="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                className={`
                  form-input block w-full pr-12 px-3 py-2 border rounded-lg
                  focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                  ${passwordErrors.newPassword ? 'border-error-300' : 'border-gray-300'}
                `}
                placeholder="Entrez un nouveau mot de passe"
                {...registerPassword('newPassword', {
                  required: 'Le nouveau mot de passe est requis',
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
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
            {passwordErrors.newPassword && (
              <p className="mt-2 text-sm text-error-600 flex items-center space-x-1">
                <AlertCircle className="w-4 h-4" />
                <span>{passwordErrors.newPassword.message}</span>
              </p>
            )}
          </div>
          
          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Confirmer le nouveau mot de passe
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                className={`
                  form-input block w-full pr-12 px-3 py-2 border rounded-lg
                  focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                  ${passwordErrors.confirmPassword ? 'border-error-300' : 'border-gray-300'}
                `}
                placeholder="Confirmez le nouveau mot de passe"
                {...registerPassword('confirmPassword', {
                  required: 'La confirmation du mot de passe est requise',
                  validate: value =>
                    value === newPassword || 'Les mots de passe ne correspondent pas'
                })}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
            {passwordErrors.confirmPassword && (
              <p className="mt-2 text-sm text-error-600 flex items-center space-x-1">
                <AlertCircle className="w-4 h-4" />
                <span>{passwordErrors.confirmPassword.message}</span>
              </p>
            )}
          </div>
          
          {/* Password Requirements */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">
              Exigences du mot de passe :
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4" />
                <span>Au moins 6 caractères</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4" />
                <span>Au moins une lettre</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4" />
                <span>Au moins un chiffre</span>
              </li>
            </ul>
          </div>
          
          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isPasswordSubmitting || isChangingPassword}
              className={`
                flex items-center space-x-2 px-6 py-2 border border-transparent rounded-lg text-sm font-medium text-white
                ${isPasswordSubmitting || isChangingPassword
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
                }
              `}
            >
              {isPasswordSubmitting || isChangingPassword ? (
                <>
                  <ButtonSpinner />
                  <span>Changement...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Changer le mot de passe</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
  
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h1 className="text-2xl font-bold text-gray-900">Mon Profil</h1>
        <p className="text-gray-600 mt-1">Gérez vos informations personnelles et paramètres de sécurité</p>
      </div>
      
      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'profile', label: 'Profil', icon: User },
              { id: 'security', label: 'Sécurité', icon: Lock }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-3 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
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
        
        <div className="p-6">
          {activeTab === 'profile' && <ProfileTab />}
          {activeTab === 'security' && <SecurityTab />}
        </div>
      </div>
    </div>
  );
};

export default Profile;