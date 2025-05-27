const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Role = sequelize.define('Role', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nom: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: {
      msg: 'Role name must be unique'
    },
    validate: {
      notEmpty: {
        msg: 'Role name is required'
      },
      len: {
        args: [2, 100],
        msg: 'Role name must be between 2 and 100 characters'
      }
    }
  }
}, {
  tableName: 'Role',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['nom']
    }
  ]
});

module.exports = Role;