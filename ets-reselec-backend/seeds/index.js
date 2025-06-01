// ets-reselec-backend/seeds/index.js
const { Role, Permission, User, sequelize } = require('../models');

const seedDatabase = async () => {
  const transaction = await sequelize.transaction();
  
  try {
    console.log('🌱 Seeding database...');

    // Default permissions
    const permissions = [
      // Dashboard permissions
      { module: 'dashboard', action: 'read', description: 'View dashboard statistics' },
      
      // Client permissions
      { module: 'clients', action: 'create', description: 'Create new clients' },
      { module: 'clients', action: 'read', description: 'View clients' },
      { module: 'clients', action: 'update', description: 'Update client information' },
      { module: 'clients', action: 'delete', description: 'Delete clients' },
      
      // Equipment permissions
      { module: 'equipment', action: 'create', description: 'Add new equipment' },
      { module: 'equipment', action: 'read', description: 'View equipment' },
      { module: 'equipment', action: 'update', description: 'Update equipment information' },
      { module: 'equipment', action: 'delete', description: 'Delete equipment' },
      
      // Intervention permissions
      { module: 'interventions', action: 'create', description: 'Create new interventions' },
      { module: 'interventions', action: 'read', description: 'View interventions' },
      { module: 'interventions', action: 'update', description: 'Update intervention status and details' },
      { module: 'interventions', action: 'delete', description: 'Delete interventions' },
      { module: 'interventions', action: 'manage_workflow', description: 'Manage intervention workflow phases' },
      
      // Report permissions
      { module: 'reports', action: 'read', description: 'View reports' },
      { module: 'reports', action: 'create', description: 'Generate reports' },
      { module: 'reports', action: 'export', description: 'Export reports' },
      
      // Analytics permissions
      { module: 'analytics', action: 'read', description: 'View analytics and charts' },
      
      // User management permissions
      { module: 'users', action: 'create', description: 'Create new users' },
      { module: 'users', action: 'read', description: 'View users' },
      { module: 'users', action: 'update', description: 'Update user information' },
      { module: 'users', action: 'delete', description: 'Delete users' },
      
      // Role management permissions
      { module: 'roles', action: 'create', description: 'Create new roles' },
      { module: 'roles', action: 'read', description: 'View roles' },
      { module: 'roles', action: 'update', description: 'Update roles' },
      { module: 'roles', action: 'delete', description: 'Delete roles' },
      { module: 'roles', action: 'assign_permissions', description: 'Assign permissions to roles' },
      
      // System administration
      { module: 'system', action: 'admin', description: 'Full system administration access' },
      { module: 'system', action: 'settings', description: 'Manage system settings' }
    ];

    // Create permissions
    const createdPermissions = [];
    for (const permission of permissions) {
      const [perm, created] = await Permission.findOrCreate({
        where: { module: permission.module, action: permission.action },
        defaults: permission,
        transaction
      });
      createdPermissions.push(perm);
      if (created) {
        console.log(`✓ Created permission: ${permission.module}:${permission.action}`);
      }
    }

    // Default roles
    const roles = [
      {
        nom: 'Administrateur',
        description: 'Full system access with all permissions',
        permissions: createdPermissions.map(p => p.id) // All permissions
      },
      {
        nom: 'Technicien Senior',
        description: 'Senior technician with most operational permissions',
        permissions: createdPermissions
          .filter(p => !['users', 'roles', 'system'].includes(p.module))
          .map(p => p.id)
      },
      {
        nom: 'Technicien',
        description: 'Standard technician with basic operational permissions',
        permissions: createdPermissions
          .filter(p => 
            ['dashboard', 'clients', 'equipment', 'interventions'].includes(p.module) &&
            ['create', 'read', 'update'].includes(p.action)
          )
          .map(p => p.id)
      },
      {
        nom: 'Consultant',
        description: 'Read-only access for consultants and external users',
        permissions: createdPermissions
          .filter(p => p.action === 'read')
          .map(p => p.id)
      },
      {
        nom: 'Utilisateur Basic',
        description: 'Basic user with minimal permissions',
        permissions: createdPermissions
          .filter(p => 
            p.module === 'dashboard' && p.action === 'read'
          )
          .map(p => p.id)
      }
    ];

    // Create roles and assign permissions
    for (const roleData of roles) {
      const [role, created] = await Role.findOrCreate({
        where: { nom: roleData.nom },
        defaults: { nom: roleData.nom },
        transaction
      });

      if (created) {
        console.log(`✓ Created role: ${roleData.nom}`);
      }

      // Assign permissions to role
      await role.setPermissions(roleData.permissions, { transaction });
      console.log(`✓ Assigned ${roleData.permissions.length} permissions to ${roleData.nom}`);
    }

    // Create default admin user if it doesn't exist
    const adminRole = await Role.findOne({
      where: { nom: 'Administrateur' },
      transaction
    });

    const [adminUser, userCreated] = await User.findOrCreate({
      where: { username: 'admin' },
      defaults: {
        nom: 'Administrateur Système',
        username: 'admin',
        password: 'admin123', // This will be hashed by the model hook
        section: 'Administration',
        role_id: adminRole.id
      },
      transaction
    });

    if (userCreated) {
      console.log('✓ Created default admin user (username: admin, password: admin123)');
      console.log('⚠️  Please change the default admin password after first login!');
    }

    await transaction.commit();
    console.log('✅ Database seeding completed successfully!');
    
    return {
      success: true,
      message: 'Database seeded successfully',
      data: {
        permissions: createdPermissions.length,
        roles: roles.length,
        adminUser: userCreated
      }
    };

  } catch (error) {
    await transaction.rollback();
    console.error('❌ Database seeding failed:', error);
    throw error;
  }
};

module.exports = {
  seedDatabase
};