// Create this file as: ets-reselec-backend/scripts/fix-admin-login.js
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');

const fixAdminLogin = async () => {
  const transaction = await sequelize.transaction();
  
  try {
    console.log('🔧 Fixing admin login issue...\n');
    await sequelize.authenticate();

    // 1. Check current admin user
    console.log('📋 CURRENT ADMIN USER STATUS:');
    console.log('='.repeat(50));
    
    const adminCheck = await sequelize.query(`
      SELECT 
        id, nom, username, password, role_id,
        CHAR_LENGTH(password) as pwd_length,
        LEFT(password, 10) as pwd_start
      FROM Utilisateur 
      WHERE username = 'admin'
    `, { type: sequelize.QueryTypes.SELECT, transaction });

    if (adminCheck.length === 0) {
      console.log('❌ No admin user found! Creating new admin user...');
      
      // Create admin user with properly hashed password
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await sequelize.query(`
        INSERT INTO Utilisateur (nom, section, username, password, role_id) 
        VALUES (?, ?, ?, ?, ?)
      `, { 
        replacements: [
          'Administrateur Système',
          'Administration', 
          'admin', 
          hashedPassword, 
          5 // Administrateur role
        ], 
        transaction 
      });
      
      console.log('✅ Admin user created successfully');
    } else {
      const admin = adminCheck[0];
      console.log(`✅ Admin user found (ID: ${admin.id})`);
      console.log(`   Name: ${admin.nom}`);
      console.log(`   Username: ${admin.username}`);
      console.log(`   Password length: ${admin.pwd_length}`);
      console.log(`   Password starts with: ${admin.pwd_start}`);
      console.log(`   Role ID: ${admin.role_id}`);
      
      // Check if password is properly hashed
      if (!admin.password.startsWith('$2a$') && !admin.password.startsWith('$2b$')) {
        console.log('❌ Password is NOT properly hashed!');
        console.log('🔧 Fixing password hash...');
        
        const newHashedPassword = await bcrypt.hash('admin123', 10);
        await sequelize.query(
          'UPDATE Utilisateur SET password = ? WHERE username = ?',
          { replacements: [newHashedPassword, 'admin'], transaction }
        );
        
        console.log('✅ Password has been properly hashed');
      } else {
        console.log('✅ Password appears to be properly hashed');
        
        // Test the current password
        const passwordTest = await bcrypt.compare('admin123', admin.password);
        console.log(`🔐 Password test result: ${passwordTest ? '✅ VALID' : '❌ INVALID'}`);
        
        if (!passwordTest) {
          console.log('🔧 Current password doesn\'t work. Setting new password...');
          
          const newHashedPassword = await bcrypt.hash('admin123', 10);
          await sequelize.query(
            'UPDATE Utilisateur SET password = ? WHERE username = ?',
            { replacements: [newHashedPassword, 'admin'], transaction }
          );
          
          console.log('✅ New password set: admin123');
        }
      }
      
      // Ensure admin has correct role
      if (admin.role_id !== 5) {
        console.log(`🔧 Fixing admin role (current: ${admin.role_id}, should be: 5)`);
        await sequelize.query(
          'UPDATE Utilisateur SET role_id = 5 WHERE username = ?',
          { replacements: ['admin'], transaction }
        );
        console.log('✅ Admin role updated to Administrateur');
      }
    }

    // 2. Ensure Administrateur role has all permissions
    console.log('\n📋 FIXING ADMINISTRATEUR ROLE PERMISSIONS:');
    console.log('='.repeat(50));
    
    // Get all permissions
    const allPermissions = await sequelize.query(
      'SELECT id FROM Permission ORDER BY id',
      { type: sequelize.QueryTypes.SELECT, transaction }
    );
    
    console.log(`📋 Found ${allPermissions.length} permissions`);
    
    // Clear and reassign all permissions to Administrateur role
    await sequelize.query(
      'DELETE FROM Role_Permission WHERE role_id = 5',
      { transaction }
    );
    
    for (const permission of allPermissions) {
      await sequelize.query(
        'INSERT INTO Role_Permission (role_id, permission_id) VALUES (5, ?)',
        { replacements: [permission.id], transaction }
      );
    }
    
    console.log(`✅ Assigned ${allPermissions.length} permissions to Administrateur role`);

    // 3. Final verification
    console.log('\n📋 FINAL VERIFICATION:');
    console.log('='.repeat(50));
    
    const finalCheck = await sequelize.query(`
      SELECT 
        u.id,
        u.nom,
        u.username,
        u.role_id,
        r.nom as role_name,
        COUNT(rp.permission_id) as permission_count
      FROM Utilisateur u
      LEFT JOIN Role r ON u.role_id = r.id
      LEFT JOIN Role_Permission rp ON r.id = rp.role_id
      WHERE u.username = 'admin'
      GROUP BY u.id, u.nom, u.username, u.role_id, r.nom
    `, { type: sequelize.QueryTypes.SELECT, transaction });
    
    if (finalCheck.length > 0) {
      const result = finalCheck[0];
      console.log(`✅ User ID: ${result.id}`);
      console.log(`✅ Name: ${result.nom}`);
      console.log(`✅ Username: ${result.username}`);
      console.log(`✅ Role ID: ${result.role_id}`);
      console.log(`✅ Role Name: ${result.role_name}`);
      console.log(`✅ Permissions: ${result.permission_count}`);
    }

    // 4. Test login simulation
    console.log('\n📋 LOGIN SIMULATION TEST:');
    console.log('='.repeat(50));
    
    const testUser = await sequelize.query(`
      SELECT id, nom, username, password, section, role_id
      FROM Utilisateur 
      WHERE username = ?
    `, { 
      replacements: ['admin'],
      type: sequelize.QueryTypes.SELECT,
      transaction 
    });
    
    if (testUser.length > 0) {
      const user = testUser[0];
      const passwordMatch = await bcrypt.compare('admin123', user.password);
      
      console.log(`🔐 Username 'admin' found: ✅`);
      console.log(`🔐 Password 'admin123' matches: ${passwordMatch ? '✅' : '❌'}`);
      
      if (passwordMatch) {
        console.log('\n🎉 LOGIN SHOULD NOW WORK!');
        console.log('📝 Use these credentials:');
        console.log('   Username: admin');
        console.log('   Password: admin123');
      } else {
        console.log('\n❌ Password still doesn\'t match - there may be another issue');
      }
    }

    await transaction.commit();
    console.log('\n✅ All fixes applied successfully!');

  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error fixing admin login:', error);
  } finally {
    await sequelize.close();
    console.log('\n🔐 Database connection closed');
  }
};

// Run the fix
fixAdminLogin();