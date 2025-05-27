const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Section = sequelize.define('Section', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nom: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Section name is required'
      }
    }
  },
  type: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  responsable_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Utilisateur',
      key: 'id'
    }
  }
}, {
  tableName: 'Section',
  timestamps: false,
  indexes: [
    {
      fields: ['responsable_id']
    }
  ]
});

module.exports = Section;