// ets-reselec-frontend/src/pages/Profile.jsx
import React, { useState } from 'react';
import { User, Lock, Settings, AlertCircle, CheckCircle, Eye, EyeOff, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSections } from '../hooks/useSections';
import { ButtonSpinner } from '../components/LoadingSpinner';

const Profile = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  const { user, updateProfile, changePassword } = useAuth();
  const { data: sections, isLoading: sectionsLoading } = useSections();
  
  // Helper function to get user initials
  const getUserInitials = (name) => {
    return name
      ?.split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';
  };
  
  // Handle profile update
  const onProfileSubmit = async (data) => {
    setIsUpdating(true);
    
    try {
      const result = await updateProfile(data);
      
      if (result.success) {
        // Profile updated successfully
        // You can add additional success handling here
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
  
  // Profile form
  const [profileFormData, setProfileFormData] = useState({
    nom: user?.nom || '',
    username: user?.username || '',
    section_id: user?.section?.id || ''
  });
  
  const [profileErrors, setProfileErrors] = useState({});
  
  // Password form
  const [passwordFormData, setPasswordFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [passwordErrors, setPasswordErrors] = useState({});
  
  // Profile form handlers
  const handleProfileChange = (field, value) => {
    setProfileFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (profileErrors[field]) {
      setProfileErrors(prev => ({ ...prev, [field]: null }));
    }
  };
  
  const handleProfileSubmit = (e) => {
    e.preventDefault();
    
    // Basic validation
    const errors = {};
    if (!profileFormData.nom || profileFormData.nom.length < 2) {
      errors.nom = 'Le nom doit contenir au moins 2 caractères';
    }
    
    if (Object.keys(errors).length > 0) {
      setProfileErrors(errors);
      return;
    }
    
    onProfileSubmit(profileFormData);
  };
  
  // Password form handlers
  const handlePasswordChange = (field, value) => {
    setPasswordFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (passwordErrors[field]) {
      setPasswordErrors(prev => ({ ...prev, [field]: null }));
    }
  };
  
  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    
    // Basic validation
    const errors = {};
    if (!passwordFormData.currentPassword) {
      errors.currentPassword = 'Le mot de passe actuel est requis';
    }
    if (!passwordFormData.newPassword || passwordFormData.newPassword.length < 6) {
      errors.newPassword = 'Le mot de passe doit contenir au moins 6 caractères';
    }
    if (!passwordFormData.confirmPassword) {
      errors.confirmPassword = 'La confirmation du mot de passe est requise';
    } else if (passwordFormData.confirmPassword !== passwordFormData.newPassword) {
      errors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }
    
    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }
    
    onPasswordSubmit(passwordFormData);
  };
  
  const resetPassword = () => {
    setPasswordFormData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setPasswordErrors({});
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
            <p className="text-primary-200">
              {typeof user?.role === 'object' ? user.role?.nom : user?.role || 'Rôle non défini'}
            </p>
            {user?.section && (
              <p className="text-primary-200">
                Section: {user.section.nom || user.section}
                {user.section.isResponsible && ' (Responsable)'}
              </p>
            )}
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
        
        <form onSubmit={handleProfileSubmit} className="p-6 space-y-6">
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
              value={profileFormData.nom}
              onChange={(e) => handleProfileChange('nom', e.target.value)}
            />
            {profileErrors.nom && (
              <p className="mt-2 text-sm text-error-600 flex items-center space-x-1">
                <AlertCircle className="w-4 h-4" />
                <span>{profileErrors.nom}</span>
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
          
          {/* Section Selection */}
          <div>
            <label htmlFor="section_id" className="block text-sm font-medium text-gray-700 mb-2">
              Section / Département
            </label>
            <select
              id="section_id"
              className={`
                form-input block w-full px-3 py-2 border rounded-lg
                focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                ${profileErrors.section_id ? 'border-error-300' : 'border-gray-300'}
              `}
              value={profileFormData.section_id}
              onChange={(e) => handleProfileChange('section_id', e.target.value)}
              disabled={sectionsLoading}
            >
              <option value="">-- Aucune section --</option>
              {sections?.map(section => (
                <option key={section.id} value={section.id}>
                  {section.nom} ({section.type})
                  {section.responsable?.id === user?.id && ' - Vous êtes responsable'}
                </option>
              ))}
            </select>
            {user?.section?.isResponsible && (
              <p className="mt-1 text-sm text-blue-600">
                Vous êtes le responsable de cette section
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
          
          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isUpdating}
              className={`
                flex items-center space-x-2 px-6 py-2 border border-transparent rounded-lg text-sm font-medium text-white
                ${isUpdating
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
                }
              `}
            >
              {isUpdating ? (
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
        
        <form onSubmit={handlePasswordSubmit} className="p-6 space-y-6">
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
                value={passwordFormData.currentPassword}
                onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
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
                <span>{passwordErrors.currentPassword}</span>
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
                value={passwordFormData.newPassword}
                onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
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
                <span>{passwordErrors.newPassword}</span>
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
                value={passwordFormData.confirmPassword}
                onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
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
                <span>{passwordErrors.confirmPassword}</span>
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
              disabled={isChangingPassword}
              className={`
                flex items-center space-x-2 px-6 py-2 border border-transparent rounded-lg text-sm font-medium text-white
                ${isChangingPassword
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
                }
              `}
            >
              {isChangingPassword ? (
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