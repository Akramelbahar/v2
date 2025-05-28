// Enhanced model files for workflow support

// ets-reselec-backend/models/StatusHistory.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const StatusHistory = sequelize.define('StatusHistory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  intervention_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Intervention',
      key: 'id'
    }
  },
  old_status: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  new_status: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  changed_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Utilisateur',
      key: 'id'
    }
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'StatusHistory',
  timestamps: false,
  indexes: [
    {
      fields: ['intervention_id']
    },
    {
      fields: ['timestamp']
    }
  ]
});

// ets-reselec-backend/models/WorkflowTemplate.js
const WorkflowTemplate = sequelize.define('WorkflowTemplate', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  type_equipement: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  diagnostic_template: {
    type: DataTypes.JSON,
    allowNull: true
  },
  planification_template: {
    type: DataTypes.JSON,
    allowNull: true
  },
  controle_template: {
    type: DataTypes.JSON,
    allowNull: true
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Utilisateur',
      key: 'id'
    }
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'WorkflowTemplate',
  timestamps: true,
  indexes: [
    {
      fields: ['type_equipement']
    },
    {
      fields: ['is_active']
    }
  ]
});

// Enhanced Diagnostic model
// ets-reselec-backend/models/EnhancedDiagnostic.js
const EnhancedDiagnostic = sequelize.define('Diagnostic', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  dateCreation: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'dateCreation',
    defaultValue: DataTypes.NOW
  },
  observationsGenerales: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'observationsGenerales'
  },
  tempsEstime: {
    type: DataTypes.INTEGER, // in minutes
    allowNull: true,
    field: 'tempsEstime',
    validate: {
      min: {
        args: [1],
        msg: 'Estimated time must be positive'
      }
    }
  },
  risquesIdentifies: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'risquesIdentifies'
  },
  completed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  intervention_id: {
    type: DataTypes.INTEGER,
    unique: true,
    allowNull: true,
    references: {
      model: 'Intervention',
      key: 'id'
    }
  }
}, {
  tableName: 'Diagnostic',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['intervention_id']
    }
  ]
});

// Diagnostic Work Items
const DiagnosticTravail = sequelize.define('DiagnosticTravail', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  diagnostic_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Diagnostic',
      key: 'id'
    }
  },
  description: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  priorite: {
    type: DataTypes.ENUM('HAUTE', 'NORMALE', 'BASSE'),
    defaultValue: 'NORMALE'
  },
  duree_estimee: {
    type: DataTypes.INTEGER, // in minutes
    allowNull: true
  },
  completed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  ordre: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  }
}, {
  tableName: 'DiagnosticTravail',
  timestamps: false
});

// Spare Parts Needs
const DiagnosticPDR = sequelize.define('DiagnosticPDR', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  diagnostic_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Diagnostic',
      key: 'id'
    }
  },
  piece: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  quantite: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    validate: {
      min: 1
    }
  },
  fournisseur: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  delai_livraison: {
    type: DataTypes.INTEGER, // in days
    allowNull: true
  },
  cout_estime: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  disponible: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'DiagnosticPDR',
  timestamps: false
});

// Enhanced Planification model
const EnhancedPlanification = sequelize.define('Planification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  dateCreation: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'dateCreation',
    defaultValue: DataTypes.NOW
  },
  datePrevisionnelle: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'datePrevisionnelle'
  },
  dureeEstimee: {
    type: DataTypes.INTEGER, // in hours
    allowNull: true,
    field: 'dureeEstimee'
  },
  capaciteExecution: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'capaciteExecution',
    validate: {
      min: 0,
      max: 100
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
  contraintesSpeciales: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'contraintesSpeciales'
  },
  validated: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
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
    },
    {
      fields: ['datePrevisionnelle']
    }
  ]
});

// Planning Resources
const PlanificationRessource = sequelize.define('PlanificationRessource', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  planification_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Planification',
      key: 'id'
    }
  },
  type_ressource: {
    type: DataTypes.ENUM('TECHNICIEN', 'OUTIL', 'VEHICULE', 'EQUIPEMENT_SPECIAL'),
    allowNull: false
  },
  description: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  quantite: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  disponible: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  date_prevue: {
    type: DataTypes.DATEONLY,
    allowNull: true
  }
}, {
  tableName: 'PlanificationRessource',
  timestamps: false
});

// Enhanced Quality Control model
const EnhancedControleQualite = sequelize.define('ControleQualite', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  dateControle: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'dateControle',
    defaultValue: DataTypes.NOW
  },
  resultatsEssais: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'resultatsEssais'
  },
  analyseVibratoire: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'analyseVibratoire'
  },
  conformiteNormes: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'conformiteNormes'
  },
  validationTechnique: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'validationTechnique'
  },
  observationsQualite: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'observationsQualite'
  },
  score_qualite: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'score_qualite',
    validate: {
      min: 0,
      max: 100
    }
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
  tableName: 'ControleQualite',
  timestamps: false,
  indexes: [
    {
      fields: ['intervention_id']
    },
    {
      fields: ['dateControle']
    }
  ]
});

// Quality Control Tests
const ControleQualiteTest = sequelize.define('ControleQualiteTest', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  controle_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'ControleQualite',
      key: 'id'
    }
  },
  nom_test: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  type_test: {
    type: DataTypes.ENUM('VISUEL', 'FONCTIONNEL', 'ELECTRIQUE', 'MECANIQUE', 'VIBRATOIRE'),
    defaultValue: 'FONCTIONNEL'
  },
  valeur_mesuree: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  valeur_attendue: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  unite: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  conforme: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  observations: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'ControleQualiteTest',
  timestamps: false
});

// Enhanced Intervention model with workflow methods
const EnhancedIntervention = sequelize.define('Intervention', {
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
    }
  },
  urgence: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  type_intervention: {
    type: DataTypes.ENUM('MAINTENANCE_PREVENTIVE', 'MAINTENANCE_CORRECTIVE', 'REPARATION', 'RENOVATION', 'INSPECTION'),
    defaultValue: 'MAINTENANCE_CORRECTIVE'
  },
  priorite: {
    type: DataTypes.ENUM('CRITIQUE', 'HAUTE', 'NORMALE', 'BASSE'),
    defaultValue: 'NORMALE'
  },
  date_debut_reelle: {
    type: DataTypes.DATE,
    allowNull: true
  },
  date_fin_reelle: {
    type: DataTypes.DATE,
    allowNull: true
  },
  duree_reelle: {
    type: DataTypes.INTEGER, // in minutes
    allowNull: true
  },
  cout_total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  satisfaction_client: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 5
    }
  },
  creerPar_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'creerPar_id',
    references: {
      model: 'Utilisateur',
      key: 'id'
    }
  },
  equipement_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Equipement',
      key: 'id'
    }
  },
  template_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'WorkflowTemplate',
      key: 'id'
    }
  }
}, {
  tableName: 'Intervention',
  timestamps: true, // Enable timestamps for workflow tracking
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
    },
    {
      fields: ['urgence']
    },
    {
      fields: ['type_intervention']
    }
  ]
});

// Instance methods for workflow management
EnhancedIntervention.prototype.canTransitionTo = function(newStatus) {
  const validTransitions = {
    'PLANIFIEE': ['EN_ATTENTE_PDR', 'ANNULEE'],
    'EN_ATTENTE_PDR': ['EN_COURS', 'ANNULEE'],
    'EN_COURS': ['EN_PAUSE', 'TERMINEE', 'ECHEC'],
    'EN_PAUSE': ['EN_COURS', 'ANNULEE'],
    'TERMINEE': [],
    'ANNULEE': [],
    'ECHEC': ['EN_COURS']
  };
  
  return validTransitions[this.statut]?.includes(newStatus) || false;
};

EnhancedIntervention.prototype.getWorkflowPhase = function() {
  const phases = {
    'PLANIFIEE': 'DIAGNOSTIC',
    'EN_ATTENTE_PDR': 'PLANIFICATION',
    'EN_COURS': 'EXECUTION',
    'EN_PAUSE': 'EXECUTION',
    'TERMINEE': 'COMPLETE',
    'ANNULEE': 'CANCELLED',
    'ECHEC': 'FAILED'
  };
  
  return phases[this.statut] || 'UNKNOWN';
};

EnhancedIntervention.prototype.calculateDuration = function() {
  if (this.date_debut_reelle && this.date_fin_reelle) {
    const start = new Date(this.date_debut_reelle);
    const end = new Date(this.date_fin_reelle);
    return Math.round((end - start) / (1000 * 60)); // minutes
  }
  return null;
};

EnhancedIntervention.prototype.isOverdue = function() {
  if (this.statut === 'TERMINEE' || this.statut === 'ANNULEE') {
    return false;
  }
  
  const now = new Date();
  const interventionDate = new Date(this.date);
  const daysDifference = (now - interventionDate) / (1000 * 60 * 60 * 24);
  
  // Consider overdue if more than 7 days for normal, 3 days for urgent
  const overdueThreshold = this.urgence ? 3 : 7;
  return daysDifference > overdueThreshold;
};

// Define associations for enhanced models
module.exports = {
  StatusHistory,
  WorkflowTemplate,
  EnhancedDiagnostic,
  DiagnosticTravail,
  DiagnosticPDR,
  EnhancedPlanification,
  PlanificationRessource,
  EnhancedControleQualite,
  ControleQualiteTest,
  EnhancedIntervention,
  
  // Define all associations
  defineAssociations: () => {
    // StatusHistory associations
    StatusHistory.belongsTo(EnhancedIntervention, { foreignKey: 'intervention_id', as: 'intervention' });
    StatusHistory.belongsTo(require('./User'), { foreignKey: 'changed_by', as: 'changedBy' });
    
    // Enhanced Intervention associations
    EnhancedIntervention.hasMany(StatusHistory, { foreignKey: 'intervention_id', as: 'statusHistory' });
    EnhancedIntervention.belongsTo(WorkflowTemplate, { foreignKey: 'template_id', as: 'template' });
    
    // Diagnostic associations
    EnhancedDiagnostic.hasMany(DiagnosticTravail, { foreignKey: 'diagnostic_id', as: 'travaux' });
    EnhancedDiagnostic.hasMany(DiagnosticPDR, { foreignKey: 'diagnostic_id', as: 'piecesDR' });
    DiagnosticTravail.belongsTo(EnhancedDiagnostic, { foreignKey: 'diagnostic_id', as: 'diagnostic' });
    DiagnosticPDR.belongsTo(EnhancedDiagnostic, { foreignKey: 'diagnostic_id', as: 'diagnostic' });
    
    // Planification associations
    EnhancedPlanification.hasMany(PlanificationRessource, { foreignKey: 'planification_id', as: 'ressources' });
    PlanificationRessource.belongsTo(EnhancedPlanification, { foreignKey: 'planification_id', as: 'planification' });
    
    // Quality Control associations
    EnhancedControleQualite.hasMany(ControleQualiteTest, { foreignKey: 'controle_id', as: 'tests' });
    ControleQualiteTest.belongsTo(EnhancedControleQualite, { foreignKey: 'controle_id', as: 'controle' });
    
    // Template associations
    WorkflowTemplate.belongsTo(require('./User'), { foreignKey: 'created_by', as: 'creator' });
    WorkflowTemplate.hasMany(EnhancedIntervention, { foreignKey: 'template_id', as: 'interventions' });
  }
};