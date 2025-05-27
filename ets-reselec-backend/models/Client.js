const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Client = sequelize.define('Client', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nom_entreprise: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Company name is required'
      }
    }
  },
  secteur_activite: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  adresse: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  ville: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  codePostal: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: 'codePostal' // Explicitly map to match exact column name
  },
  tel: {
    type: DataTypes.STRING(20),
    allowNull: true,
    validate: {
      is: {
        args: /^[\d\s\-\+\(\)\.]+$/i,
        msg: 'Invalid phone number format'
      }
    }
  },
  fax: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: {
      isEmail: {
        msg: 'Invalid email format'
      }
    }
  },
  siteWeb: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'siteWeb',
    validate: {
      isUrl: {
        msg: 'Invalid URL format'
      }
    }
  },
  contact_principal: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  poste_contact: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  telephone_contact: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  email_contact: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: {
      isEmail: {
        msg: 'Invalid contact email format'
      }
    }
  },
  registre_commerce: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  forme_juridique: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  cree_par_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Utilisateur',
      key: 'id'
    }
  }
}, {
  tableName: 'Client',
  timestamps: false,
  indexes: [
    {
      fields: ['cree_par_id']
    },
    {
      fields: ['nom_entreprise']
    }
  ]
});

// Virtual field for full address
Client.prototype.getFullAddress = function() {
  const parts = [this.adresse, this.ville, this.codePostal].filter(Boolean);
  return parts.join(', ');
};

module.exports = Client;