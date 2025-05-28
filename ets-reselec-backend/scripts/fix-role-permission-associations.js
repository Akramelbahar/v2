// Create this file as: ets-reselec-backend/scripts/fix-role-permission-associations.js
const { sequelize } = require('../config/database');
const { User, Role, Permission } = require('../models');

const fixRolePermissionAssociations = async () => {
  const transaction = await sequelize.transaction();
  
  try {
    console.log('🔄 Starting Role-Permission Association Fix...\n');
    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    // 1. Find or create Administrateur role
    let adminRole = await Role.findOne({
      where: { nom: 'Administrateur' }
    });

    if (!adminRole) {
      console.log('Creating Administrateur role...');
      adminRole = await Role.create({
        nom: 'Administrateur'
      }, { transaction });
      console.log('✅ Administrateur role created');
    } else {
      console.log('✅ Administrateur role found (ID:', adminRole.id, ')');
    }

    // 2. Get all permissions
    const permissions = await Permission.findAll();
    console.log(`📋 Found ${permissions.length} permissions in database`);

    if (permissions.length === 0) {
      console.log('❌ No permissions found. Creating basic permissions...');
      
      // Create essential permissions
      const essentialPermissions = [
        // User permissions
        { module: 'utilisateurs', action: 'create', description: 'Créer des utilisateurs' },
        { module: 'utilisateurs', action: 'read', description: 'Voir les utilisateurs' },
        { module: 'utilisateurs', action: 'update', description: 'Modifier les utilisateurs' },
        { module: 'utilisateurs', action: 'delete', description: 'Supprimer des utilisateurs' },
        
        // Client permissions
        { module: 'clients', action: 'create', description: 'Créer des clients' },
        { module: 'clients', action: 'read', description: 'Voir les clients' },
        { module: 'clients', action: 'update', description: 'Modifier les clients' },
        { module: 'clients', action: 'delete', description: 'Supprimer des clients' },
        
        // Equipment permissions
        { module: 'equipements', action: 'create', description: 'Créer des équipements' },
        { module: 'equipements', action: 'read', description: 'Voir les équipements' },
        { module: 'equipements', action: 'update', description: 'Modifier les équipements' },
        { module: 'equipements', action: 'delete', description: 'Supprimer des équipements' },
        
        // Intervention permissions
        { module: 'interventions', action: 'create', description: 'Créer des interventions' },
        { module: 'interventions', action: 'read', description: 'Voir les interventions' },
        { module: 'interventions', action: 'update', description: 'Modifier les interventions' },
        { module: 'interventions', action: 'delete', description: 'Supprimer des interventions' },
        { module: 'interventions', action: 'validate', description: 'Valider les interventions' },
        
        // Report permissions
        { module: 'rapports', action: 'create', description: 'Créer des rapports' },
        { module: 'rapports', action: 'read', description: 'Voir les rapports' },
        { module: 'rapports', action: 'validate', description: 'Valider les rapports' }
      ];

      const createdPermissions = await Permission.bulkCreate(essentialPermissions, { transaction });
      console.log(`✅ Created ${createdPermissions.length} permissions`);
      
      // Refresh permissions list
      const allPermissions = await Permission.findAll();
      permissions.push(...allPermissions);
    }

    // 3. Check current role-permission associations for admin role
    const currentAssociations = await adminRole.getPermissions();
    console.log(`📋 Admin role currently has ${currentAssociations.length} permissions`);

    // 4. Assign ALL permissions to Administrateur role
    console.log('🔄 Assigning all permissions to Administrateur role...');
    await adminRole.setPermissions(permissions, { transaction });
    console.log(`✅ Assigned ${permissions.length} permissions to Administrateur role`);

    // 5. Verify associations were created
    const verifyAssociations = await sequelize.query(
      'SELECT COUNT(*) as count FROM Role_Permission WHERE role_id = ?',
      {
        replacements: [adminRole.id],
        type: sequelize.QueryTypes.SELECT,
        transaction
      }
    );
    console.log(`✅ Verification: ${verifyAssociations[0].count} role-permission associations created`);

    // 6. Fix admin user role assignment
    const adminUser = await User.findOne({
      where: { username: 'admin' }
    });

    if (adminUser) {
      if (adminUser.role_id !== adminRole.id) {
        console.log(`🔄 Updating admin user role from ${adminUser.role_id} to ${adminRole.id}...`);
        await adminUser.update({
          role_id: adminRole.id
        }, { transaction });
        console.log('✅ Admin user role updated');
      } else {
        console.log('✅ Admin user already has correct role');
      }
    } else {
      console.log('❌ Admin user not found!');
    }

    // 7. Final verification - get admin user with full role and permissions
    const finalAdminUser = await User.findOne({
      where: { username: 'admin' },
      include: [{
        model: Role,
        as: 'role',
        include: [{
          model: Permission,
          as: 'permissions',
          through: { attributes: [] }
        }]
      }]
    });

    if (finalAdminUser) {
      console.log('\n📋 FINAL ADMIN USER STATUS:');
      console.log('='.repeat(40));
      console.log(`Name: ${finalAdminUser.nom}`);
      console.log(`Username: ${finalAdminUser.username}`);
      console.log(`Role ID: ${finalAdminUser.role_id}`);
      console.log(`Role Name: ${finalAdminUser.role?.nom}`);
      console.log(`Permissions Count: ${finalAdminUser.role?.permissions?.length || 0}`);
      
      if (finalAdminUser.role?.permissions?.length > 0) {
        console.log('Sample permissions:');
        finalAdminUser.role.permissions.slice(0, 5).forEach(perm => {
          console.log(`  - ${perm.module}:${perm.action}`);
        });
        if (finalAdminUser.role.permissions.length > 5) {
          console.log(`  ... and ${finalAdminUser.role.permissions.length - 5} more`);
        }
      }
    }

    await transaction.commit();
    console.log('\n✅ All fixes applied successfully!');
    console.log('\n🎉 Admin user should now have full permissions!');

  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error fixing role-permission associations:', error);
  } finally {
    await sequelize.close();
    console.log('\n🔐 Database connection closed');
  }
};

// Run the fix
fixRolePermissionAssociations();