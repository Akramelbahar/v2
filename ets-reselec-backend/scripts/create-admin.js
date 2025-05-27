// ets-reselec-backend/scripts/create-admin.js
const { User, Role, Section } = require('../models');
const { sequelize } = require('../config/database');

const createAdminUser = async () => {
  try {
    console.log('🔐 Creating admin user...\n');

    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Find or create admin role
    const [adminRole] = await Role.findOrCreate({
      where: { nom: 'Administrateur' },
      defaults: { nom: 'Administrateur' }
    });

    // Find or create admin section
    const [adminSection] = await Section.findOrCreate({
      where: { nom: 'Administration' },
      defaults: { 
        nom: 'Administration', 
        type: 'Administrative' 
      }
    });

    // Create admin user
    const [adminUser, created] = await User.findOrCreate({
      where: { username: 'admin' },
      defaults: {
        nom: 'Administrateur Système',
        username: 'admin',
        password: 'Admin123!', // Will be hashed by model hook
        section: 'Administration',
        role_id: adminRole.id,
        section_id: adminSection.id
      }
    });

    if (created) {
      console.log('✅ Admin user created successfully!');
      console.log('\n' + '='.repeat(40));
      console.log('🔐 ADMIN CREDENTIALS');
      console.log('='.repeat(40));
      console.log('Username: admin');
      console.log('Password: Admin123!');
      console.log('Role: Administrateur');
      console.log('='.repeat(40));
      console.log('⚠️  Please change the password after first login!');
    } else {
      console.log('ℹ️  Admin user already exists');
      console.log('Username: admin');
      
      // Ask if user wants to reset password
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const resetPassword = await new Promise(resolve => {
        readline.question('Reset admin password to Admin123!? (y/N): ', answer => {
          readline.close();
          resolve(answer.toLowerCase() === 'y');
        });
      });
      
      if (resetPassword) {
        await adminUser.update({ password: 'Admin123!' });
        console.log('✅ Admin password reset to: Admin123!');
        console.log('⚠️  Please change this password after login!');
      }
    }

  } catch (error) {
    console.error('❌ Failed to create admin user:', error);
    console.error('Error details:', error.message);
    
    if (error.name === 'SequelizeConnectionError') {
      console.error('\n💡 Database connection failed. Please check:');
      console.error('   - MySQL server is running');
      console.error('   - Database credentials in .env file');
      console.error('   - Run database setup first: npm run setup');
    }
    
    throw error;
  } finally {
    await sequelize.close();
  }
};

// Run if called directly
if (require.main === module) {
  createAdminUser()
    .then(() => {
      console.log('\n✅ Admin creation completed');
      process.exit(0);
    })
    .catch(() => {
      process.exit(1);
    });
}

module.exports = { createAdminUser };