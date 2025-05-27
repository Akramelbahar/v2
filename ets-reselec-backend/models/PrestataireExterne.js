const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PrestataireExterne = sequelize.define('PrestataireExterne', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nom: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Provider name is required'
      }
    }
  },
  contrat: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  rapportOperation: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'rapportOperation'
  },
  creer_par_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Utilisateur',
      key: 'id'
    },
    validate: {
      notEmpty: {
        msg: 'Creator is required'
      }
    }
  }
}, {
  tableName: 'PrestataireExterne',
  timestamps: false,
  indexes: [
    {
      fields: ['creer_par_id']
    }
  ]
});

module.exports = PrestataireExterne;