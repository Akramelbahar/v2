
// 17. Audit Trail Implementation
// ets-reselec-backend/models/AuditLog.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  action: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      isIn: {
        args: [['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'ROLE_ASSIGNMENT', 'STATUS_CHANGE', 'EXPORT', 'IMPORT']],
        msg: 'Invalid audit action'
      }
    }
  },
  entity: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  entityId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  performedBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Utilisateur',
      key: 'id'
    }
  },
  changes: {
    type: DataTypes.JSON,
    allowNull: true
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  ipAddress: {
    type: DataTypes.STRING(45),
    allowNull: true
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false
  }
}, {
  tableName: 'AuditLog',
  timestamps: false,
  indexes: [
    {
      fields: ['performedBy']
    },
    {
      fields: ['entity', 'entityId']
    },
    {
      fields: ['timestamp']
    },
    {
      fields: ['action']
    }
  ]
});

module.exports = AuditLog;
