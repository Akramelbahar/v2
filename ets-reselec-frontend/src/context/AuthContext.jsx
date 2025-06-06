import React, { createContext, useContext, useReducer, useEffect } from 'react';
import authService from '../services/authService';
import toast from 'react-hot-toast';

// Initial state
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null
};

// Action types
const AUTH_ACTIONS = {
  AUTH_START: 'AUTH_START',
  AUTH_SUCCESS: 'AUTH_SUCCESS',
  AUTH_FAILURE: 'AUTH_FAILURE',
  LOGOUT: 'LOGOUT',
  UPDATE_USER: 'UPDATE_USER',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_LOADING: 'SET_LOADING'
};

// Reducer function
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.AUTH_START:
      return {
        ...state,
        isLoading: true,
        error: null
      };
      
    case AUTH_ACTIONS.AUTH_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null
      };
      
    case AUTH_ACTIONS.AUTH_FAILURE:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload
      };
      
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      };
      
    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: action.payload,
        error: null
      };
      
    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };
      
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };
      
    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// AuthProvider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  
  // Initialize authentication state on app load
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const authData = authService.initializeAuth();
        
        if (authData.isAuthenticated) {
          dispatch({
            type: AUTH_ACTIONS.AUTH_SUCCESS,
            payload: {
              user: authData.user,
              token: authData.token
            }
          });
        } else {
          dispatch({
            type: AUTH_ACTIONS.SET_LOADING,
            payload: false
          });
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        dispatch({
          type: AUTH_ACTIONS.AUTH_FAILURE,
          payload: 'Failed to initialize authentication'
        });
      }
    };
    
    initializeAuth();
  }, []);
  
  // Login function
  const login = async (credentials) => {
    dispatch({ type: AUTH_ACTIONS.AUTH_START });
    
    try {
      const { user, token } = await authService.login(credentials);
      
      dispatch({
        type: AUTH_ACTIONS.AUTH_SUCCESS,
        payload: { user, token }
      });
      
      toast.success(`Bienvenue, ${user.nom}!`);
      return { success: true };
      
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      
      dispatch({
        type: AUTH_ACTIONS.AUTH_FAILURE,
        payload: errorMessage
      });
      
      return { success: false, error: errorMessage };
    }
  };
  
  // Register function
  const register = async (userData) => {
    dispatch({ type: AUTH_ACTIONS.AUTH_START });
    
    try {
      const { user, token } = await authService.register(userData);
      
      dispatch({
        type: AUTH_ACTIONS.AUTH_SUCCESS,
        payload: { user, token }
      });
      
      toast.success(`Bienvenue à ETS RESELEC, ${user.nom}!`);
      return { success: true };
      
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Registration failed';
      
      dispatch({
        type: AUTH_ACTIONS.AUTH_FAILURE,
        payload: errorMessage
      });
      
      return { success: false, error: errorMessage };
    }
  };
  
  // Update profile function
  const updateProfile = async (profileData) => {
    try {
      const updatedUser = await authService.updateProfile(profileData);
      
      dispatch({
        type: AUTH_ACTIONS.UPDATE_USER,
        payload: updatedUser
      });
      
      toast.success('Profil mis à jour avec succès');
      return { success: true, user: updatedUser };
      
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Profile update failed';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };
  
  // Change password function
  const changePassword = async (passwordData) => {
    try {
      await authService.changePassword(passwordData);
      
      toast.success('Mot de passe modifié avec succès');
      return { success: true };
      
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Password change failed';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };
  
  // Logout function
  const logout = async () => {
    try {
      await authService.logout();
      
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      
      toast.success('Déconnexion réussie');
      
    } catch (error) {
      console.error('Logout error:', error);
      // Still logout locally even if API call fails
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  };
  
  // Clear error function
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };
  
  // Permission and role checking functions
  const hasPermission = (permission) => {
    return authService.hasPermission(permission);
  };
  
  const hasAnyPermission = (permissions) => {
    return authService.hasAnyPermission(permissions);
  };
  
  const hasRole = (role) => {
    const currentRole = authService.getRole();
    
    // Handle admin role variants
    if (role === 'Admin' && (currentRole === 'Admin' || currentRole === 'Administrateur' || currentRole === 'Administrator')) {
      return true;
    }
    
    return authService.hasRole(role);
  };
  
  const isAdmin = () => {
    return authService.isAdmin();
  };
  
  const getPermissions = () => {
    return authService.getPermissions();
  };
  
  const getRole = () => {
    return authService.getRole();
  };
  
  // Context value
  const value = {
    // State
    user: state.user,
    token: state.token,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
    
    // Actions
    login,
    register,
    updateProfile,
    changePassword,
    logout,
    clearError,
    
    // Authorization helpers
    hasPermission,
    hasAnyPermission,
    hasRole,
    isAdmin,
    getPermissions,
    getRole
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default AuthContext;