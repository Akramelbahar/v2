const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Equipment = sequelize.define('Equipment', {
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
        msg: 'Equipment name is required'
      }
    }
  },
  marque: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  modele: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  type_equipement: {
    type: DataTypes.STRING(50),
    allowNull: true,
    validate: {
      isIn: {
        args: [[
          'MOTEUR_ELECTRIQUE',
          'TRANSFORMATEUR',
          'GENERATEUR',
          'POMPE_INDUSTRIELLE',
          'VENTILATEUR',
          'COMPRESSEUR',
          'AUTOMATE',
          'TABLEAU_ELECTRIQUE'
        ]],
        msg: 'Invalid equipment type'
      }
    },
    references: {
      model: 'TypeEquipement_enum',
      key: 'value'
    }
  },
  etatDeReception: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'etatDeReception'
  },
  valeur: {
    type: DataTypes.STRING(100),
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
  proprietaire_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Client',
      key: 'id'
    },
    validate: {
      notEmpty: {
        msg: 'Owner is required'
      }
    }
  },
  ajouterPar_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'ajouterPar_id',
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
  tableName: 'Equipement',
  timestamps: false,
  indexes: [
    {
      fields: ['proprietaire_id']
    },
    {
      fields: ['ajouterPar_id']
    },
    {
      fields: ['type_equipement']
    }
  ]
});

// Virtual field for display label
Equipment.prototype.getDisplayLabel = function() {
  return `${this.nom} - ${this.marque || 'N/A'} ${this.modele || ''}`.trim();
};

module.exports = Equipment;