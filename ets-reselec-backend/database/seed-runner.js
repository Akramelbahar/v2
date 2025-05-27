const { syncDatabase } = require('./sync');
const { seedDatabase } = require('../seeds');
const { sequelize } = require('../config/database');

const runSeed = async () => {
  try {
    console.log('🚀 Starting database setup...\n');

    // Sync database structure (without altering existing tables)
    await syncDatabase({ alter: false, force: false });

    // Run seed data
    await seedDatabase();

    console.log('\n✅ Database setup completed successfully!');
  } catch (error) {
    console.error('\n❌ Database setup failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
};

runSeed();