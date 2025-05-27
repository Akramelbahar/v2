
// 19. Mobile Optimization Components
// ets-reselec-frontend/src/components/mobile/MobileNavigation.jsx
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, Users, Package, Wrench, BarChart3, Menu, X, 
  ChevronRight, Settings, User, LogOut 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const MobileNavigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, hasPermission } = useAuth();

  const navigationItems = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Clients', href: '/clients', icon: Users, permission: 'clients:read' },
    { name: 'Equipment', href: '/equipment', icon: Package, permission: 'equipment:read' },
    { name: 'Interventions', href: '/interventions', icon: Wrench, permission: 'interventions:read' },
    { name: 'Analytics', href: '/analytics', icon: BarChart3, permission: 'analytics:read' }
  ].filter(item => !item.permission || hasPermission(item.permission));

  const handleNavigation = (href) => {
    navigate(href);
    setIsOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 bg-white rounded-lg shadow-lg border"
        >
          <Menu className="w-6 h-6 text-gray-600" />
        </button>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden">
          <div className="fixed inset-y-0 left-0 w-80 bg-white shadow-xl z-50 transform transition-transform duration-300">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center space-x-3">
                <Settings className="w-8 h-8 text-blue-600" />
                <div>
                  <h2 className="text-lg font-bold text-gray-900">ETS RESELEC</h2>
                  <p className="text-sm text-gray-500">Mobile Menu</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            {/* User Info */}
            <div className="p-6 bg-gray-50 border-b">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                  {user?.nom?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{user?.nom}</p>
                  <p className="text-sm text-gray-500">{user?.role}</p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4">
              <div className="space-y-2">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href;
                  
                  return (
                    <button
                      key={item.href}
                      onClick={() => handleNavigation(item.href)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${
                        isActive 
                          ? 'bg-blue-100 text-blue-900 border-l-4 border-blue-600' 
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{item.name}</span>
                      </div>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  );
                })}
              </div>
            </nav>

            {/* Footer Actions */}
            <div className="p-4 border-t">
              <div className="space-y-2">
                <button
                  onClick={() => handleNavigation('/profile')}
                  className="w-full flex items-center space-x-3 p-3 rounded-lg text-gray-600 hover:bg-gray-100"
                >
                  <User className="w-5 h-5" />
                  <span>Profile</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 p-3 rounded-lg text-red-600 hover:bg-red-50"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MobileNavigation;
