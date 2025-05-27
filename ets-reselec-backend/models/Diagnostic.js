const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Diagnostic = sequelize.define('Diagnostic', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  dateCreation: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'dateCreation',
    defaultValue: DataTypes.NOW,
    validate: {
      notEmpty: {
        msg: 'Creation date is required'
      }
    }
  },
  intervention_id: {
    type: DataTypes.INTEGER,
    unique: true,
    allowNull: true,
    references: {
      model: 'Intervention',
      key: 'id'
    }
  }
}, {
  tableName: 'Diagnostic',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['intervention_id']
    }
  ]
});

module.exports = Diagnostic;