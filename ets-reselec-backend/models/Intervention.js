const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Intervention = sequelize.define('Intervention', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Date is required'
      },
      isDate: {
        msg: 'Invalid date format'
      }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  statut: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: 'PLANIFIEE',
    validate: {
      isIn: {
        args: [[
          'PLANIFIEE',
          'EN_ATTENTE_PDR',
          'EN_COURS',
          'EN_PAUSE',
          'TERMINEE',
          'ANNULEE',
          'ECHEC'
        ]],
        msg: 'Invalid intervention status'
      }
    },
    references: {
      model: 'StatusIntervention_enum',
      key: 'value'
    }
  },
  urgence: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  creerPar_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'creerPar_id',
    references: {
      model: 'Utilisateur',
      key: 'id'
    },
    validate: {
      notEmpty: {
        msg: 'Creator is required'
      }
    }
  },
  equipement_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Equipement',
      key: 'id'
    },
    validate: {
      notEmpty: {
        msg: 'Equipment is required'
      }
    }
  }
}, {
  tableName: 'Intervention',
  timestamps: false,
  indexes: [
    {
      fields: ['creerPar_id']
    },
    {
      fields: ['equipement_id']
    },
    {
      fields: ['statut']
    },
    {
      fields: ['date']
    }
  ]
});

// Virtual field for status badge color
Intervention.prototype.getStatusColor = function() {
  const colors = {
    'PLANIFIEE': 'blue',
    'EN_ATTENTE_PDR': 'orange',
    'EN_COURS': 'yellow',
    'EN_PAUSE': 'gray',
    'TERMINEE': 'green',
    'ANNULEE': 'red',
    'ECHEC': 'red'
  };
  return colors[this.statut] || 'gray';
};

module.exports = Intervention;