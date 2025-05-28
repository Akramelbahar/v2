import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Settings, 
  BarChart3, 
  Users, 
  Wrench, 
  FileText, 
  Shield, 
  UserCheck, 
  X,
  Home,
  Package
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isOpen, isCollapsed, onClose, onToggleCollapse }) => {
  const location = useLocation();
  const { user, hasPermission, isAdmin, getRole, getPermissions } = useAuth();
  
  // Navigation items based on user permissions
  const navigationItems = [
    {
      name: 'Tableau de Bord',
      href: '/',
      icon: Home,
      permission: null // Available to all authenticated users
    },
    {
      name: 'Clients',
      href: '/clients',
      icon: Users,
      permission: 'clients:read'
    },
    {
      name: 'Équipements',
      href: '/equipment',
      icon: Package,
      permission: 'equipment:read'
    },
    {
      name: 'Interventions',
      href: '/interventions',
      icon: Wrench,
      permission: 'interventions:read'
    },
    {
      name: 'Rapports',
      href: '/reports',
      icon: FileText,
      permission: 'reports:read'
    },
    {
      name: 'Analytiques',
      href: '/analytics',
      icon: BarChart3,
      permission: 'analytics:read'
    }
  ];
  
  // Admin-only navigation items
  const adminItems = [
    {
      name: 'Gestion Utilisateurs',
      href: '/users',
      icon: UserCheck,
      adminOnly: true
    },
    {
      name: 'Rôles & Permissions',
      href: '/roles',
      icon: Shield,
      adminOnly: true
    }
  ];
  
  // Filter navigation items based on permissions
  const getFilteredItems = (items) => {
    return items.filter(item => {
      // Admin can see everything
      if (isAdmin()) return true;
      
      // Check permission if specified
      if (item.permission) {
        return hasPermission(item.permission);
      }
      
      // Admin-only items
      if (item.adminOnly) {
        return false;
      }
      
      return true;
    });
  };
  
  const filteredNavItems = getFilteredItems(navigationItems);
  const filteredAdminItems = getFilteredItems(adminItems);
  
  const NavItem = ({ item, collapsed = false }) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.href;
    
    return (
      <NavLink
        to={item.href}
        onClick={onClose}
        className={({ isActive }) => `
          flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
          ${isActive 
            ? 'bg-primary-100 text-primary-900 border-r-2 border-primary-600' 
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }
          ${collapsed ? 'justify-center px-2' : ''}
        `}
        title={collapsed ? item.name : ''}
      >
        <Icon className={`${collapsed ? 'w-6 h-6' : 'w-5 h-5'} flex-shrink-0`} />
        {!collapsed && <span>{item.name}</span>}
      </NavLink>
    );
  };

  // Get current user info
  const currentRole = getRole();
  const currentPermissions = getPermissions();
  
  const SidebarContent = () => (
    <>
      {/* Header */}
      <div className={`flex items-center ${isCollapsed ? 'justify-center px-2' : 'justify-between px-4'} py-4 border-b border-gray-200`}>
        {!isCollapsed && (
          <div className="flex items-center space-x-3">
            <Settings className="w-8 h-8 text-primary-600" />
            <div>
              <h1 className="text-lg font-bold text-gray-900">ETS RESELEC</h1>
              <p className="text-xs text-gray-500">Gestion d'équipements</p>
            </div>
          </div>
        )}
        
        {isCollapsed && (
          <Settings className="w-8 h-8 text-primary-600" />
        )}
        
        {/* Mobile close button */}
        <button
          onClick={onClose}
          className="lg:hidden p-1 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      {/* User info */}
      {!isCollapsed && (
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
              {user?.nom ? user.nom.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.nom || 'Utilisateur'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {currentRole || 'Aucun rôle'}
              </p>
              {currentPermissions.length > 0 && (
                <p className="text-xs text-blue-600 truncate">
                  {currentPermissions.length} permission{currentPermissions.length > 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
        {/* Main navigation */}
        <div className="space-y-1">
          {!isCollapsed && (
            <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Navigation
            </p>
          )}
          {filteredNavItems.map((item) => (
            <NavItem key={item.href} item={item} collapsed={isCollapsed} />
          ))}
        </div>
        
        {/* Admin section */}
        {filteredAdminItems.length > 0 && (
          <div className="pt-4 space-y-1">
            {!isCollapsed && (
              <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Administration
              </p>
            )}
            {filteredAdminItems.map((item) => (
              <NavItem key={item.href} item={item} collapsed={isCollapsed} />
            ))}
          </div>
        )}
        
        {/* Permissions debug info in development */}
        {process.env.NODE_ENV === 'development' && !isCollapsed && (
          <div className="pt-4 mt-4 border-t border-gray-200">
            <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Debug (Dev Only)
            </p>
            <div className="px-3 text-xs text-gray-600">
              <p><strong>Rôle:</strong> {currentRole || 'Aucun'}</p>
              <p><strong>Admin:</strong> {isAdmin() ? 'Oui' : 'Non'}</p>
              <p><strong>Permissions:</strong></p>
              <div className="max-h-20 overflow-y-auto">
                {currentPermissions.length > 0 ? (
                  currentPermissions.map((perm, index) => (
                    <span key={index} className="block text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded mt-1">
                      {perm}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-500">Aucune</span>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
      
      {/* Footer */}
      {!isCollapsed && (
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>© 2024 ETS RESELEC</span>
            <span>v{process.env.REACT_APP_VERSION || '1.0.0'}</span>
          </div>
        </div>
      )}
    </>
  );
  
  return (
    <>
      {/* Desktop sidebar */}
      <div className={`
        hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:z-30
        ${isCollapsed ? 'lg:w-16' : 'lg:w-64'}
        bg-white border-r border-gray-200 transition-all duration-300 ease-in-out
      `}>
        <SidebarContent />
      </div>
      
      {/* Mobile sidebar */}
      <div className={`
        lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <SidebarContent />
      </div>
    </>
  );
};

export default Sidebar;