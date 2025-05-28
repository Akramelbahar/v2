// Create this file as: ets-reselec-backend/scripts/audit-roles-permissions.js
const { sequelize } = require('../config/database');
const { User, Role, Permission } = require('../models');

const auditRolesAndPermissions = async () => {
  try {
    console.log('🔄 Starting Role and Permission Audit...\n');
    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    // 1. Check all roles
    console.log('📋 ROLES IN DATABASE:');
    console.log('='.repeat(50));
    const roles = await Role.findAll({
      include: [{
        model: Permission,
        as: 'permissions',
        through: { attributes: [] } // Don't include junction table data
      }]
    });

    roles.forEach(role => {
      console.log(`ID: ${role.id} | Name: "${role.nom}"`);
      if (role.permissions && role.permissions.length > 0) {
        console.log(`  Permissions (${role.permissions.length}):`);
        role.permissions.forEach(perm => {
          console.log(`    - ${perm.module}:${perm.action}`);
        });
      } else {
        console.log(`  ⚠️  NO PERMISSIONS ASSIGNED`);
      }
      console.log('');
    });

    // 2. Check all permissions
    console.log('\n📋 ALL PERMISSIONS IN DATABASE:');
    console.log('='.repeat(50));
    const permissions = await Permission.findAll();
    permissions.forEach(perm => {
      console.log(`ID: ${perm.id} | ${perm.module}:${perm.action} | ${perm.description || 'No description'}`);
    });

    // 3. Check Role-Permission junction table
    console.log('\n📋 ROLE-PERMISSION ASSOCIATIONS:');
    console.log('='.repeat(50));
    const rolePermissions = await sequelize.query(
      'SELECT rp.role_id, r.nom as role_name, rp.permission_id, p.module, p.action FROM Role_Permission rp LEFT JOIN Role r ON rp.role_id = r.id LEFT JOIN Permission p ON rp.permission_id = p.id ORDER BY rp.role_id',
      { type: sequelize.QueryTypes.SELECT }
    );

    if (rolePermissions.length === 0) {
      console.log('⚠️  NO ROLE-PERMISSION ASSOCIATIONS FOUND!');
    } else {
      rolePermissions.forEach(rp => {
        console.log(`Role "${rp.role_name}" (ID: ${rp.role_id}) -> ${rp.module}:${rp.action} (Permission ID: ${rp.permission_id})`);
      });
    }

    // 4. Check admin user specifically
    console.log('\n📋 ADMIN USER DETAILS:');
    console.log('='.repeat(50));
    const adminUser = await User.findOne({
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

    if (adminUser) {
      console.log(`User: ${adminUser.nom}`);
      console.log(`Username: ${adminUser.username}`);
      console.log(`Role ID: ${adminUser.role_id}`);
      console.log(`Role Name: ${adminUser.role?.nom || 'NO ROLE ASSIGNED'}`);
      
      if (adminUser.role?.permissions) {
        console.log(`Permissions Count: ${adminUser.role.permissions.length}`);
        if (adminUser.role.permissions.length > 0) {
          console.log('Permissions:');
          adminUser.role.permissions.forEach(perm => {
            console.log(`  - ${perm.module}:${perm.action}`);
          });
        } else {
          console.log('⚠️  ADMIN HAS NO PERMISSIONS!');
        }
      }
    } else {
      console.log('❌ Admin user not found!');
    }

    // 5. Check if tables exist and structure
    console.log('\n📋 DATABASE TABLES STRUCTURE:');
    console.log('='.repeat(50));
    
    const tables = await sequelize.query(
      "SHOW TABLES LIKE '%Role%' OR SHOW TABLES LIKE '%Permission%' OR SHOW TABLES LIKE '%User%'",
      { type: sequelize.QueryTypes.SELECT }
    );
    
    console.log('Related tables found:');
    tables.forEach(table => {
      const tableName = Object.values(table)[0];
      console.log(`  - ${tableName}`);
    });

    // Check if Role_Permission junction table exists
    const junctionTable = await sequelize.query(
      "SHOW TABLES LIKE 'Role_Permission'",
      { type: sequelize.QueryTypes.SELECT }
    );
    
    if (junctionTable.length === 0) {
      console.log('\n❌ CRITICAL: Role_Permission junction table NOT FOUND!');
      console.log('This explains why admin has no permissions.');
    } else {
      console.log('\n✅ Role_Permission junction table exists');
      
      // Check its structure
      const structure = await sequelize.query(
        "DESCRIBE Role_Permission",
        { type: sequelize.QueryTypes.SELECT }
      );
      
      console.log('Junction table structure:');
      structure.forEach(col => {
        console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(nullable)' : '(not null)'} ${col.Key ? `[${col.Key}]` : ''}`);
      });
    }

    // 6. Backend code expectations vs database
    console.log('\n📋 BACKEND CODE ANALYSIS:');
    console.log('='.repeat(50));
    
    console.log('Expected roles in backend code:');
    console.log('  - "Administrateur" (from seed file)');
    console.log('  - "Admin" (checked in hasRole methods)');
    
    console.log('\nExpected permissions format in backend:');
    console.log('  - "clients:read", "clients:create", "clients:update", "clients:delete"');
    console.log('  - "equipment:read", "equipment:create", etc.');
    console.log('  - "interventions:read", "interventions:create", etc.');

    // 7. Recommendations
    console.log('\n📋 RECOMMENDATIONS:');
    console.log('='.repeat(50));
    
    const adminRole = roles.find(r => r.nom === 'Administrateur');
    if (!adminRole) {
      console.log('❌ Create "Administrateur" role');
    } else if (!adminRole.permissions || adminRole.permissions.length === 0) {
      console.log('❌ Assign all permissions to "Administrateur" role');
    }
    
    if (rolePermissions.length === 0) {
      console.log('❌ Create Role_Permission associations');
    }
    
    if (!adminUser || adminUser.role_id !== adminRole?.id) {
      console.log('❌ Fix admin user role assignment');
    }

  } catch (error) {
    console.error('❌ Audit error:', error);
  } finally {
    await sequelize.close();
    console.log('\n🔐 Database connection closed');
  }
};

// Run the audit
auditRolesAndPermissions();