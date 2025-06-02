// ets-reselec-backend/models/User.js
const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
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
        msg: 'Name is required'
      }
    }
  },
  // REMOVED: section field (now using section_id foreign key)
  username: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: {
      msg: 'Username already exists'
    },
    validate: {
      notEmpty: {
        msg: 'Username is required'
      },
      len: {
        args: [3, 100],
        msg: 'Username must be between 3 and 100 characters'
      }
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Password is required'
      },
      len: {
        args: [6],
        msg: 'Password must be at least 6 characters'
      }
    }
  },
  role_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Role',
      key: 'id'
    }
  },
  section_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // Can be made NOT NULL based on business requirements
    references: {
      model: 'Section',
      key: 'id'
    }
  }
}, {
  tableName: 'Utilisateur',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['username']
    },
    {
      fields: ['role_id']
    },
    {
      fields: ['section_id']
    }
  ],
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

// Instance methods
User.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

User.prototype.generateToken = function() {
  return jwt.sign(
    { 
      id: this.id,
      username: this.username,
      role_id: this.role_id,
      section_id: this.section_id
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

User.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  delete values.password;
  return values;
};

// Virtual field for full display name
User.prototype.getDisplayName = function() {
  return `${this.nom} (${this.username})`;
};

// Get user's section name
User.prototype.getSectionName = async function() {
  if (!this.section_id) return null;
  
  const section = await sequelize.models.Section.findByPk(this.section_id);
  return section ? section.nom : null;
};

// Check if user is section responsible
User.prototype.isSectionResponsible = async function() {
  if (!this.section_id) return false;
  
  const section = await sequelize.models.Section.findByPk(this.section_id);
  return section && section.responsable_id === this.id;
};

module.exports = User;