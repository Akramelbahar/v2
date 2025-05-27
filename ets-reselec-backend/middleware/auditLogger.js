
// ets-reselec-backend/middleware/auditLogger.js
const AuditLog = require('../models/AuditLog');

const auditLogger = (action, entity) => {
  return async (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      // Log successful operations
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const logData = {
          action,
          entity,
          entityId: req.params.id || (typeof data === 'object' && data.data?.id) || null,
          performedBy: req.userId,
          changes: req.auditChanges || null,
          reason: req.body.reason || null,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent')
        };

        AuditLog.create(logData).catch(error => {
          console.error('Audit logging failed:', error);
        });
      }
      
      originalSend.call(res, data);
    };
    
    next();
  };
};

// Helper to track changes
const trackChanges = (oldData, newData) => {
  const changes = {};
  
  Object.keys(newData).forEach(key => {
    if (oldData[key] !== newData[key]) {
      changes[key] = {
        from: oldData[key],
        to: newData[key]
      };
    }
  });
  
  return Object.keys(changes).length > 0 ? changes : null;
};

module.exports = { auditLogger, trackChanges };
