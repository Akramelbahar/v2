import api, { tokenStorage } from './api';

class AuthService {
  // Normalize user data to ensure consistent structure
  _normalizeUserData(user) {
    if (!user) return null;
    
    return {
      id: user.id,
      nom: user.nom,
      username: user.username,
      section: user.section,
      role: user.role, // Keep as string
      roleId: user.roleId,
      permissions: Array.isArray(user.permissions) ? user.permissions : []
    };
  }

  // Login user
  async login(credentials) {
    try {
      const response = await api.post('/auth/login', credentials);
      
      if (response.data.success && response.data.data.token) {
        const { token, user } = response.data.data;
        
        // Normalize user data
        const normalizedUser = this._normalizeUserData(user);
        
        // Store tokens and user data
        tokenStorage.set(token);
        localStorage.setItem('user_data', JSON.stringify(normalizedUser));
        
        return { user: normalizedUser, token };
      }
      
      throw new Error(response.data.message || 'Login failed');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }
  
  // Register user
  async register(userData) {
    try {
      const response = await api.post('/auth/register', userData);
      
      if (response.data.success && response.data.data.token) {
        const { token, user } = response.data.data;
        
        // Normalize user data
        const normalizedUser = this._normalizeUserData(user);
        
        // Store tokens and user data
        tokenStorage.set(token);
        localStorage.setItem('user_data', JSON.stringify(normalizedUser));
        
        return { user: normalizedUser, token };
      }
      
      throw new Error(response.data.message || 'Registration failed');
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }
  
  // Get current user profile
  async getProfile() {
    try {
      const response = await api.get('/auth/profile');
      
      if (response.data.success) {
        const user = response.data.data;
        
        // Normalize user data
        const normalizedUser = this._normalizeUserData(user);
        
        // Update stored user data
        localStorage.setItem('user_data', JSON.stringify(normalizedUser));
        
        return normalizedUser;
      }
      
      throw new Error('Failed to fetch profile');
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  }
  
  // Update user profile
  async updateProfile(profileData) {
    try {
      const response = await api.put('/auth/profile', profileData);
      
      if (response.data.success) {
        const user = response.data.data;
        
        // Normalize user data
        const normalizedUser = this._normalizeUserData(user);
        
        // Update stored user data
        localStorage.setItem('user_data', JSON.stringify(normalizedUser));
        
        return normalizedUser;
      }
      
      throw new Error(response.data.message || 'Profile update failed');
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }
  
  // Get current user from localStorage
  getCurrentUser() {
    try {
      const userData = localStorage.getItem('user_data');
      const user = userData ? JSON.parse(userData) : null;
      return this._normalizeUserData(user);
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  }
  
  // Initialize auth state from localStorage
  initializeAuth() {
    const token = tokenStorage.get();
    const userData = localStorage.getItem('user_data');
    
    if (token && userData && !this.isTokenExpired()) {
      try {
        const user = JSON.parse(userData);
        return {
          isAuthenticated: true,
          user: this._normalizeUserData(user),
          token
        };
      } catch (error) {
        console.error('Error initializing auth:', error);
        this.logout();
      }
    }
    
    return {
      isAuthenticated: false,
      user: null,
      token: null
    };
  }
  
  // Logout user
  async logout() {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      tokenStorage.clear();
    }
  }
  
  // Change password
  async changePassword(passwordData) {
    try {
      const response = await api.put('/auth/profile', passwordData);
      
      if (response.data.success) {
        return response.data;
      }
      
      throw new Error(response.data.message || 'Password change failed');
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  }
  
  // Refresh token
  async refreshToken() {
    try {
      const currentToken = tokenStorage.get();
      
      if (!currentToken) {
        throw new Error('No token to refresh');
      }
      
      const response = await api.post('/auth/refresh-token', {
        token: currentToken
      });
      
      if (response.data.success && response.data.data.token) {
        const { token, user } = response.data.data;
        
        // Store new token
        tokenStorage.set(token);
        
        // Update user data if provided
        if (user) {
          const normalizedUser = this._normalizeUserData(user);
          localStorage.setItem('user_data', JSON.stringify(normalizedUser));
        }
        
        return token;
      }
      
      throw new Error('Token refresh failed');
    } catch (error) {
      console.error('Refresh token error:', error);
      throw error;
    }
  }
  
  // Check if user is authenticated
  isAuthenticated() {
    const token = tokenStorage.get();
    const userData = localStorage.getItem('user_data');
    return !!(token && userData && !this.isTokenExpired());
  }
  
  // Check if user has specific permission
  hasPermission(permission) {
    const user = this.getCurrentUser();
    
    if (!user) {
      return false;
    }
    
    // Admin users have all permissions
    if (this.isAdmin()) {
      return true;
    }
    
    return user.permissions && user.permissions.includes(permission);
  }
  
  // Check if user has specific role
  hasRole(role) {
    const user = this.getCurrentUser();
    return user && user.role === role;
  }
  
  // Check if user is admin
  isAdmin() {
    const user = this.getCurrentUser();
  return user && (
    user.role === 'Admin' || 
    user.role === 'Administrateur' || 
    user.role === 'Administrator'
  );
  }
  
  // Check if user has any of the provided permissions
  hasAnyPermission(permissions) {
    if (!Array.isArray(permissions)) {
      return this.hasPermission(permissions);
    }
    
    return permissions.some(permission => this.hasPermission(permission));
  }
  
  // Get user permissions
  getPermissions() {
    const user = this.getCurrentUser();
    return user ? user.permissions || [] : [];
  }
  
  // Get user role
  getRole() {
    const user = this.getCurrentUser();
    return user ? user.role : null;
  }
  
  // Check if token is expired
  isTokenExpired() {
    const token = tokenStorage.get();
    
    if (!token) {
      return true;
    }
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      return payload.exp < currentTime;
    } catch (error) {
      console.error('Error checking token expiry:', error);
      return true;
    }
  }
}

const authService = new AuthService();
export default authService;