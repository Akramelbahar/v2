const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Rapport = sequelize.define('Rapport', {
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
  contenu: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  validation: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  intervention_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Intervention',
      key: 'id'
    },
    validate: {
      notEmpty: {
        msg: 'Intervention is required'
      }
    }
  }
}, {
  tableName: 'Rapport',
  timestamps: false,
  indexes: [
    {
      fields: ['intervention_id']
    },
    {
      fields: ['dateCreation']
    }
  ]
});

module.exports = Rapport;