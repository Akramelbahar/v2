const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Maintenance = sequelize.define('Maintenance', {
  intervention_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: 'Intervention',
      key: 'id'
    }
  },
  typeMaintenance: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'typeMaintenance'
  },
  duree: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      isInt: {
        msg: 'Duration must be an integer'
      },
      min: {
        args: [0],
        msg: 'Duration cannot be negative'
      }
    }
  }
}, {
  tableName: 'Maintenance',
  timestamps: false
});

module.exports = Maintenance;