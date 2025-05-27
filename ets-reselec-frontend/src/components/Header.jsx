import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Menu, 
  Search, 
  Bell, 
  Settings, 
  User, 
  LogOut, 
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Header = ({ onMenuClick, sidebarCollapsed, onToggleSidebar }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const userMenuRef = useRef(null);
  const notificationRef = useRef(null);
  
  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Mock notifications data
  const notifications = [
    {
      id: 1,
      type: 'urgent',
      title: 'Intervention urgente',
      message: 'Moteur électrique ABC Corp nécessite une intervention immédiate',
      time: '5 min',
      read: false
    },
    {
      id: 2,
      type: 'success',
      title: 'Intervention terminée',
      message: 'Transformateur XYZ Industries - Maintenance complétée',
      time: '1h',
      read: false
    },
    {
      id: 3,
      type: 'info',
      title: 'Nouveau client',
      message: 'Tech Solutions a été ajouté à la base de données',
      time: '2h',
      read: true
    }
  ];
  
  const unreadCount = notifications.filter(n => !n.read).length;
  
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };
  
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Implement search functionality
      console.log('Searching for:', searchQuery);
    }
  };
  
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'urgent':
        return <AlertCircle className="w-5 h-5 text-error-600" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-success-600" />;
      default:
        return <Bell className="w-5 h-5 text-primary-600" />;
    }
  };
  
  const getUserInitials = (name) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left side - Menu and search */}
          <div className="flex items-center space-x-4">
            {/* Mobile menu button */}
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            {/* Desktop sidebar toggle */}
            <button
              onClick={onToggleSidebar}
              className="hidden lg:flex p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              {sidebarCollapsed ? (
                <ChevronRight className="w-5 h-5" />
              ) : (
                <ChevronLeft className="w-5 h-5" />
              )}
            </button>
            
            {/* Search */}
            <form onSubmit={handleSearch} className="hidden md:flex">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Rechercher équipements, clients, interventions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-96 pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </form>
          </div>

          {/* Right side - Notifications and user menu */}
          <div className="flex items-center space-x-4">
            {/* Mobile search button */}
            <button className="md:hidden p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors">
              <Search className="w-5 h-5" />
            </button>
            
            {/* Notifications */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-error-600 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
              
              {/* Notifications dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-medium border border-gray-200 z-50">
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                      {unreadCount > 0 && (
                        <span className="text-sm text-gray-500">{unreadCount} non lues</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                            !notification.read ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            {getNotificationIcon(notification.type)}
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-600'}`}>
                                {notification.title}
                              </p>
                              <p className="text-sm text-gray-500 mt-1">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-400 mt-2">
                                Il y a {notification.time}
                              </p>
                            </div>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-gray-500">
                        <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        <p>Aucune notification</p>
                      </div>
                    )}
                  </div>
                  
                  {notifications.length > 0 && (
                    <div className="p-4 border-t border-gray-200">
                      <button className="w-full text-center text-sm text-primary-600 hover:text-primary-800 font-medium">
                        Voir toutes les notifications
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* User menu */}
                    <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-3 p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
              {user ? getUserInitials(user.nom) : 'U'}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-gray-900">{user?.nom || 'Utilisateur'}</p>
              {/* Fix: Handle role being an object */}
              <p className="text-xs text-gray-500">
                {typeof user?.role === 'object' ? user.role?.nom : user?.role || 'Role'}
              </p>
            </div>
          </button>
          
          {/* User dropdown menu */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-medium border border-gray-200 z-50">
              <div className="p-4 border-b border-gray-200">
                <p className="text-sm font-medium text-gray-900">{user?.nom}</p>
                <p className="text-xs text-gray-500">{user?.username}</p>
                {/* Fix: Handle role being an object */}
                <p className="text-xs text-primary-600">
                  {typeof user?.role === 'object' ? user.role?.nom : user?.role || 'Role'}
                </p>
              </div>
              
              <div className="py-2">
                <Link
                  to="/profile"
                  className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  onClick={() => setShowUserMenu(false)}
                >
                  <User className="w-4 h-4" />
                  <span>Mon profil</span>
                </Link>
                
                <Link
                  to="/settings"
                  className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  onClick={() => setShowUserMenu(false)}
                >
                  <Settings className="w-4 h-4" />
                  <span>Paramètres</span>
                </Link>
              </div>
              
              <div className="py-2 border-t border-gray-200">
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors w-full text-left"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Se déconnecter</span>
                </button>
              </div>
            </div>
          )}
        </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;