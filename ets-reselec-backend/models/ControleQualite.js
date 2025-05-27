const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ControleQualite = sequelize.define('ControleQualite', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  dateControle: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'dateControle',
    defaultValue: DataTypes.NOW,
    validate: {
      notEmpty: {
        msg: 'Control date is required'
      }
    }
  },
  resultatsEssais: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'resultatsEssais'
  },
  analyseVibratoire: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'analyseVibratoire'
  },
  intervention_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Intervention',
      key: 'id'
    }
  }
}, {
  tableName: 'ControleQualite',
  timestamps: false,
  indexes: [
    {
      fields: ['intervention_id']
    },
    {
      fields: ['dateControle']
    }
  ]
});

module.exports = ControleQualite;