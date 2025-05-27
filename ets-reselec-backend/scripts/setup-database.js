// ets-reselec-backend/scripts/setup-database.js
const { syncDatabase } = require('../database/sync');
const { seedDatabase } = require('../seeds');
const { sequelize } = require('../config/database');

const setupDatabase = async () => {
  try {
    console.log('🚀 Starting complete database setup...\n');

    // 1. Test database connection
    console.log('1️⃣ Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connection successful\n');

    // 2. Sync database structure
    console.log('2️⃣ Synchronizing database structure...');
    await syncDatabase({ alter: true }); // Use alter: true to update existing tables
    console.log('✅ Database structure synchronized\n');

    // 3. Seed database with initial data
    console.log('3️⃣ Seeding database with initial data...');
    await seedDatabase();
    console.log('✅ Database seeded successfully\n');

    console.log('🎉 Database setup completed successfully!');
    console.log('\n' + '='.repeat(50));
    console.log('🔐 ADMIN LOGIN CREDENTIALS');
    console.log('='.repeat(50));
    console.log('URL: http://localhost:3000/login');
    console.log('Username: admin');
    console.log('Password: Admin123!');
    console.log('='.repeat(50));
    console.log('⚠️  IMPORTANT: Change the admin password after first login!');
    console.log('='.repeat(50));

  } catch (error) {
    console.error('\n❌ Database setup failed:', error);
    console.error('\nError details:', error.message);
    
    if (error.name === 'SequelizeConnectionError') {
      console.error('\n💡 Database connection failed. Please check:');
      console.error('   - MySQL server is running');
      console.error('   - Database credentials in .env file');
      console.error('   - Database exists or can be created');
    }
    
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('\n🔒 Database connection closed.');
    process.exit(0);
  }
};

// Run if called directly
if (require.main === module) {
  setupDatabase();
}

module.exports = { setupDatabase };