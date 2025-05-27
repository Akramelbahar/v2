const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Renovation = sequelize.define('Renovation', {
  intervention_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: 'Intervention',
      key: 'id'
    }
  },
  objectif: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  cout: {
    type: DataTypes.DOUBLE,
    allowNull: true,
    validate: {
      isNumeric: {
        msg: 'Cost must be a number'
      },
      min: {
        args: [0],
        msg: 'Cost cannot be negative'
      }
    }
  },
  dureeEstimee: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'dureeEstimee',
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
  tableName: 'Renovation',
  timestamps: false
});

module.exports = Renovation;