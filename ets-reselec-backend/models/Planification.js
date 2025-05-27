const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Planification = sequelize.define('Planification', {
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
  capaciteExecution: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'capaciteExecution',
    validate: {
      isInt: {
        msg: 'Capacity must be an integer'
      },
      min: {
        args: [0],
        msg: 'Capacity cannot be negative'
      }
    }
  },
  urgencePrise: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'urgencePrise'
  },
  disponibilitePDR: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'disponibilitePDR'
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
  tableName: 'Planification',
  timestamps: false,
  indexes: [
    {
      fields: ['intervention_id']
    }
  ]
});

module.exports = Planification;