

// 16. Enhanced Hook for Role-Based UI
// ets-reselec-frontend/src/hooks/usePermissions.js
import { useAuth } from '../context/AuthContext';

export const usePermissions = () => {
  const { user, hasPermission, hasRole, isAdmin } = useAuth();

  // Role-based UI helpers
  const canCreate = (module) => hasPermission(`${module}:create`) || isAdmin();
  const canRead = (module) => hasPermission(`${module}:read`) || isAdmin();
  const canUpdate = (module) => hasPermission(`${module}:update`) || isAdmin();
  const canDelete = (module) => hasPermission(`${module}:delete`) || isAdmin();
  
  // Complex permission checks
  const canManageUsers = () => hasRole('Administrateur') || hasRole('Chef de Section');
  const canManageRoles = () => hasRole('Administrateur');
  const canAssignRoles = () => hasRole('Administrateur');
  const canViewReports = () => hasPermission('reports:read') || isAdmin();
  const canExportData = () => hasPermission('export:data') || isAdmin();
  
  // Equipment-specific permissions
  const canCreateEquipment = () => canCreate('equipments');
  const canDeleteEquipment = () => canDelete('equipments');
  const canGenerateQR = () => hasPermission('equipment:qr') || isAdmin();
  
  // Intervention-specific permissions
  const canCreateInterventions = () => canCreate('interventions');
  const canUpdateInterventionStatus = () => hasPermission('interventions:status') || isAdmin();
  const canValidateInterventions = () => hasPermission('interventions:validate') || hasRole('Chef de Section');
  
  return {
    // Basic CRUD permissions
    canCreate,
    canRead,
    canUpdate,
    canDelete,
    
    // Role-based permissions
    canManageUsers,
    canManageRoles,
    canAssignRoles,
    canViewReports,
    canExportData,
    
    // Entity-specific permissions
    canCreateEquipment,
    canDeleteEquipment,
    canGenerateQR,
    canCreateInterventions,
    canUpdateInterventionStatus,
    canValidateInterventions,
    
    // User info
    user,
    userRole: user?.role,
    userPermissions: user?.permissions || []
  };
};

export default usePermissions;
