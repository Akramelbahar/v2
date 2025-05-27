const { sequelize } = require('../config/database');
const models = require('../models');

const syncDatabase = async (options = {}) => {
  try {
    // Default options - don't alter existing tables
    const syncOptions = {
      alter: false,
      force: false,
      ...options
    };

    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    // Sync all models
    await sequelize.sync(syncOptions);
    console.log('✅ All models synchronized successfully.');

    return true;
  } catch (error) {
    console.error('❌ Database synchronization failed:', error);
    throw error;
  }
};

module.exports = { syncDatabase };