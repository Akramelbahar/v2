// ets-reselec-backend/seeds/seedPermissions.js
const { Permission, Role, sequelize } = require('../models');
const { Op } = require('sequelize');

const permissions = [
  // Client permissions
  { module: 'clients', action: 'read', description: 'Voir la liste des clients' },
  { module: 'clients', action: 'create', description: 'Créer de nouveaux clients' },
  { module: 'clients', action: 'update', description: 'Modifier les clients existants' },
  { module: 'clients', action: 'delete', description: 'Supprimer des clients' },
  
  // Equipment permissions
  { module: 'equipment', action: 'read', description: 'Voir la liste des équipements' },
  { module: 'equipment', action: 'create', description: 'Créer de nouveaux équipements' },
  { module: 'equipment', action: 'update', description: 'Modifier les équipements existants' },
  { module: 'equipment', action: 'delete', description: 'Supprimer des équipements' },
  
  // Intervention permissions
  { module: 'interventions', action: 'read', description: 'Voir la liste des interventions' },
  { module: 'interventions', action: 'create', description: 'Créer de nouvelles interventions' },
  { module: 'interventions', action: 'update', description: 'Modifier les interventions existantes' },
  { module: 'interventions', action: 'delete', description: 'Supprimer des interventions' },
  
  // Report permissions
  { module: 'reports', action: 'read', description: 'Voir les rapports' },
  { module: 'reports', action: 'create', description: 'Créer des rapports' },
  { module: 'reports', action: 'update', description: 'Modifier les rapports' },
  { module: 'reports', action: 'delete', description: 'Supprimer des rapports' },
  
  // Analytics permissions
  { module: 'analytics', action: 'read', description: 'Voir les analyses et statistiques' },
  
  // User management permissions
  { module: 'users', action: 'read', description: 'Voir la liste des utilisateurs' },
  { module: 'users', action: 'create', description: 'Créer de nouveaux utilisateurs' },
  { module: 'users', action: 'update', description: 'Modifier les utilisateurs existants' },
  { module: 'users', action: 'delete', description: 'Supprimer des utilisateurs' },
  
  // Role management permissions
  { module: 'roles', action: 'read', description: 'Voir la liste des rôles' },
  { module: 'roles', action: 'create', description: 'Créer de nouveaux rôles' },
  { module: 'roles', action: 'update', description: 'Modifier les rôles existants' },
  { module: 'roles', action: 'delete', description: 'Supprimer des rôles' },
  
  // Settings permissions
  { module: 'settings', action: 'read', description: 'Voir les paramètres' },
  { module: 'settings', action: 'update', description: 'Modifier les paramètres' }
];

const seedPermissions = async () => {
  const transaction = await sequelize.transaction();
  
  try {
    console.log('🌱 Seeding permissions...');
    
    // Create permissions
    for (const permission of permissions) {
      await Permission.findOrCreate({
        where: {
          module: permission.module,
          action: permission.action
        },
        defaults: permission,
        transaction
      });
    }
    
    console.log('✅ Permissions seeded successfully');
    
    // Get or create Administrator role
    const [adminRole] = await Role.findOrCreate({
      where: { nom: 'Administrateur' },
      defaults: { nom: 'Administrateur' },
      transaction
    });
    
    // Get all permissions
    const allPermissions = await Permission.findAll({ transaction });
    
    // Assign all permissions to Administrator role
    await adminRole.setPermissions(allPermissions, { transaction });
    
    console.log('✅ Administrator role configured with all permissions');
    
    // Create other default roles
    const defaultRoles = [
      {
        nom: 'Technicien',
        permissions: [
          'equipment:read',
          'equipment:update',
          'interventions:read',
          'interventions:create',
          'interventions:update',
          'reports:read',
          'reports:create'
        ]
      },
      {
        nom: 'Superviseur',
        permissions: [
          'clients:read',
          'equipment:read',
          'equipment:create',
          'equipment:update',
          'interventions:read',
          'interventions:create',
          'interventions:update',
          'interventions:delete',
          'reports:read',
          'reports:create',
          'reports:update',
          'analytics:read'
        ]
      },
      {
        nom: 'Consultant',
        permissions: [
          'clients:read',
          'equipment:read',
          'interventions:read',
          'reports:read',
          'analytics:read'
        ]
      }
    ];
    
    for (const roleData of defaultRoles) {
      const [role] = await Role.findOrCreate({
        where: { nom: roleData.nom },
        defaults: { nom: roleData.nom },
        transaction
      });
      
      // Find permissions for this role
      const rolePermissions = await Permission.findAll({
        where: {
          [Op.or]: roleData.permissions.map(p => {
            const [module, action] = p.split(':');
            return { module, action };
          })
        },
        transaction
      });
      
      // Assign permissions to role
      await role.setPermissions(rolePermissions, { transaction });
      
      console.log(`✅ ${roleData.nom} role configured`);
    }
    
    await transaction.commit();
    console.log('✅ All roles and permissions seeded successfully!');
    
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Seeding failed:', error);
    throw error;
  }
};

// Run seeding if called directly
if (require.main === module) {
  seedPermissions()
    .then(() => {
      console.log('Seeding completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedPermissions };