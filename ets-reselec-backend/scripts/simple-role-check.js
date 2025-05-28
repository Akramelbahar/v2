// Create this file as: ets-reselec-backend/scripts/simple-role-check.js
const { sequelize } = require('../config/database');

const checkRolesAndPermissions = async () => {
  try {
    console.log('🔄 Connecting to database...\n');
    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    // 1. Check roles
    console.log('📋 CHECKING ROLES:');
    console.log('='.repeat(40));
    const roles = await sequelize.query('SELECT * FROM Role ORDER BY id', {
      type: sequelize.QueryTypes.SELECT
    });
    
    if (roles.length === 0) {
      console.log('❌ No roles found!');
    } else {
      roles.forEach(role => {
        console.log(`ID: ${role.id} | Name: "${role.nom}"`);
      });
    }

    // 2. Check permissions
    console.log('\n📋 CHECKING PERMISSIONS:');
    console.log('='.repeat(40));
    const permissions = await sequelize.query('SELECT * FROM Permission ORDER BY id', {
      type: sequelize.QueryTypes.SELECT
    });
    
    if (permissions.length === 0) {
      console.log('❌ No permissions found!');
    } else {
      console.log(`Found ${permissions.length} permissions:`);
      permissions.slice(0, 10).forEach(perm => {
        console.log(`  ${perm.id}: ${perm.module}:${perm.action}`);
      });
      if (permissions.length > 10) {
        console.log(`  ... and ${permissions.length - 10} more`);
      }
    }

    // 3. Check Role_Permission junction table
    console.log('\n📋 CHECKING ROLE-PERMISSION ASSOCIATIONS:');
    console.log('='.repeat(40));
    
    // First check if table exists
    const tables = await sequelize.query("SHOW TABLES LIKE 'Role_Permission'", {
      type: sequelize.QueryTypes.SELECT
    });
    
    if (tables.length === 0) {
      console.log('❌ Role_Permission table does NOT exist!');
      console.log('This is the main problem - no way to associate roles with permissions.');
    } else {
      console.log('✅ Role_Permission table exists');
      
      const rolePermissions = await sequelize.query(`
        SELECT 
          rp.role_id,
          rp.permission_id,
          r.nom as role_name,
          p.module,
          p.action
        FROM Role_Permission rp 
        LEFT JOIN Role r ON rp.role_id = r.id 
        LEFT JOIN Permission p ON rp.permission_id = p.id 
        ORDER BY rp.role_id
      `, {
        type: sequelize.QueryTypes.SELECT
      });
      
      if (rolePermissions.length === 0) {
        console.log('❌ No role-permission associations found!');
        console.log('This means no role has any permissions assigned.');
      } else {
        console.log(`Found ${rolePermissions.length} associations:`);
        
        // Group by role
        const byRole = {};
        rolePermissions.forEach(rp => {
          if (!byRole[rp.role_name]) {
            byRole[rp.role_name] = [];
          }
          byRole[rp.role_name].push(`${rp.module}:${rp.action}`);
        });
        
        Object.keys(byRole).forEach(roleName => {
          console.log(`  ${roleName}: ${byRole[roleName].length} permissions`);
          if (roleName === 'Administrateur') {
            console.log(`    Sample: ${byRole[roleName].slice(0, 3).join(', ')}`);
          }
        });
      }
    }

    // 4. Check admin user
    console.log('\n📋 CHECKING ADMIN USER:');
    console.log('='.repeat(40));
    const adminUsers = await sequelize.query(`
      SELECT 
        u.*,
        r.nom as role_name
      FROM Utilisateur u 
      LEFT JOIN Role r ON u.role_id = r.id 
      WHERE u.username = 'admin'
    `, {
      type: sequelize.QueryTypes.SELECT
    });
    
    if (adminUsers.length === 0) {
      console.log('❌ No admin user found!');
    } else {
      const admin = adminUsers[0];
      console.log(`Name: ${admin.nom}`);
      console.log(`Username: ${admin.username}`);
      console.log(`Role ID: ${admin.role_id}`);
      console.log(`Role Name: ${admin.role_name || 'NO ROLE'}`);
      
      if (admin.role_name !== 'Administrateur') {
        console.log(`❌ Admin has wrong role: "${admin.role_name}" (should be "Administrateur")`);
      }
    }

    // 5. Check what admin can actually do
    console.log('\n📋 ADMIN PERMISSIONS CHECK:');
    console.log('='.repeat(40));
    const adminPermissions = await sequelize.query(`
      SELECT 
        CONCAT(p.module, ':', p.action) as permission
      FROM Utilisateur u
      JOIN Role r ON u.role_id = r.id
      JOIN Role_Permission rp ON r.id = rp.role_id
      JOIN Permission p ON rp.permission_id = p.id
      WHERE u.username = 'admin'
      ORDER BY p.module, p.action
    `, {
      type: sequelize.QueryTypes.SELECT
    });
    
    if (adminPermissions.length === 0) {
      console.log('❌ Admin has NO permissions!');
      console.log('This is why delete buttons are not showing.');
    } else {
      console.log(`✅ Admin has ${adminPermissions.length} permissions:`);
      adminPermissions.slice(0, 10).forEach(perm => {
        console.log(`  - ${perm.permission}`);
      });
      if (adminPermissions.length > 10) {
        console.log(`  ... and ${adminPermissions.length - 10} more`);
      }
    }

    // 6. Diagnosis and recommendations
    console.log('\n📋 DIAGNOSIS:');
    console.log('='.repeat(40));
    
    const adminRole = roles.find(r => r.nom === 'Administrateur');
    const adminUser = adminUsers[0];
    
    if (!adminRole) {
      console.log('🔧 ISSUE: No "Administrateur" role found');
    }
    
    if (!adminUser) {
      console.log('🔧 ISSUE: No admin user found');
    } else if (!adminRole || adminUser.role_id !== adminRole.id) {
      console.log('🔧 ISSUE: Admin user has wrong role assigned');
    }
    
    if (tables.length === 0) {
      console.log('🔧 ISSUE: Role_Permission junction table missing');
    } else if (rolePermissions && rolePermissions.length === 0) {
      console.log('🔧 ISSUE: No role-permission associations');
    }
    
    if (adminPermissions.length === 0) {
      console.log('🔧 ISSUE: Admin has no permissions - this is the main problem!');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
    console.log('\n🔐 Database connection closed');
  }
};

// Run the check
checkRolesAndPermissions();