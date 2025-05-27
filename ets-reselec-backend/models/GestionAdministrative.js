const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const GestionAdministrative = sequelize.define('GestionAdministrative', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  commandeAchat: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'commandeAchat'
  },
  facturation: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  validation: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
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
  tableName: 'GestionAdministrative',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['intervention_id']
    }
  ]
});

module.exports = GestionAdministrative;