// ets-reselec-backend/models/index.js
const { sequelize, Sequelize } = require('../config/database');

// Import all models
const User = require('./User');
const Role = require('./Role');
const Permission = require('./Permission');
const Section = require('./Section');
const Client = require('./Client');
const Equipment = require('./Equipment');
const Intervention = require('./Intervention');
const Diagnostic = require('./Diagnostic');
const Planification = require('./Planification');
const ControleQualite = require('./ControleQualite');
const PrestataireExterne = require('./PrestataireExterne');
const Rapport = require('./Rapport');
const Renovation = require('./Renovation');
const Maintenance = require('./Maintenance');
const GestionAdministrative = require('./GestionAdministrative');

// Define all associations
console.log('🔗 Setting up model associations...');

try {
  // Role-Permission Many-to-Many Association
  Role.belongsToMany(Permission, { 
    through: 'Role_Permission',
    foreignKey: 'role_id',
    otherKey: 'permission_id',
    as: 'permissions'
  });

  Permission.belongsToMany(Role, { 
    through: 'Role_Permission',
    foreignKey: 'permission_id',
    otherKey: 'role_id',
    as: 'roles'
  });

  // User associations
  User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });
  User.belongsTo(Section, { foreignKey: 'section_id', as: 'sectionBelongsTo' });

  Role.hasMany(User, { foreignKey: 'role_id', as: 'users' });
  Section.hasMany(User, { foreignKey: 'section_id', as: 'utilisateurs' });

  // Section associations
  Section.belongsTo(User, { foreignKey: 'responsable_id', as: 'responsable' });

  // Client associations
  Client.belongsTo(User, { foreignKey: 'cree_par_id', as: 'creerPar' });
  User.hasMany(Client, { foreignKey: 'cree_par_id', as: 'clientsCrees' });

  // Equipment associations
  Equipment.belongsTo(Client, { foreignKey: 'proprietaire_id', as: 'proprietaire' });
  Equipment.belongsTo(User, { foreignKey: 'ajouterPar_id', as: 'ajouterPar' });
  
  Client.hasMany(Equipment, { foreignKey: 'proprietaire_id', as: 'equipements' });
  User.hasMany(Equipment, { foreignKey: 'ajouterPar_id', as: 'equipementsAjoutes' });

  // Intervention associations
  Intervention.belongsTo(Equipment, { foreignKey: 'equipement_id', as: 'equipement' });
  Intervention.belongsTo(User, { foreignKey: 'creerPar_id', as: 'creerPar' });
  
  Equipment.hasMany(Intervention, { foreignKey: 'equipement_id', as: 'interventions' });
  User.hasMany(Intervention, { foreignKey: 'creerPar_id', as: 'interventionsCrees' });

  // Workflow associations
  if (Diagnostic) {
    Intervention.hasOne(Diagnostic, { foreignKey: 'intervention_id', as: 'diagnostic' });
    Diagnostic.belongsTo(Intervention, { foreignKey: 'intervention_id', as: 'intervention' });
  }

  if (Planification) {
    Intervention.hasOne(Planification, { foreignKey: 'intervention_id', as: 'planification' });
    Planification.belongsTo(Intervention, { foreignKey: 'intervention_id', as: 'intervention' });
  }

  if (ControleQualite) {
    Intervention.hasOne(ControleQualite, { foreignKey: 'intervention_id', as: 'controleQualite' });
    ControleQualite.belongsTo(Intervention, { foreignKey: 'intervention_id', as: 'intervention' });
  }

  if (Rapport) {
    Intervention.hasMany(Rapport, { foreignKey: 'intervention_id', as: 'rapports' });
    Rapport.belongsTo(Intervention, { foreignKey: 'intervention_id', as: 'intervention' });
  }

  if (GestionAdministrative) {
    Intervention.hasOne(GestionAdministrative, { foreignKey: 'intervention_id', as: 'gestionAdministrative' });
    GestionAdministrative.belongsTo(Intervention, { foreignKey: 'intervention_id', as: 'intervention' });
  }

  if (Renovation) {
    Intervention.hasOne(Renovation, { foreignKey: 'intervention_id', as: 'renovation' });
    Renovation.belongsTo(Intervention, { foreignKey: 'intervention_id', as: 'intervention' });
  }

  if (Maintenance) {
    Intervention.hasOne(Maintenance, { foreignKey: 'intervention_id', as: 'maintenance' });
    Maintenance.belongsTo(Intervention, { foreignKey: 'intervention_id', as: 'intervention' });
  }

  // External provider associations
  if (PrestataireExterne) {
    PrestataireExterne.belongsTo(User, { foreignKey: 'creer_par_id', as: 'creerPar' });
    User.hasMany(PrestataireExterne, { foreignKey: 'creer_par_id', as: 'prestatairesCrees' });
  }

  console.log('✅ Model associations set up successfully');

} catch (error) {
  console.error('❌ Error setting up model associations:', error);
}
// ets-reselec-backend/models/index.js
const { 
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
  defineAssociations
} = require('./EnhancedModels');



// Export all models and sequelize instance
module.exports = {
  sequelize,
  Sequelize,
  User,
  Role,
  Permission,
  Section,
  Client,
  Equipment,
  Intervention,
  Diagnostic,
  Planification,
  ControleQualite,
  PrestataireExterne,
  Rapport,
  Renovation,
  Maintenance,
  GestionAdministrative , StatusHistory,
  WorkflowTemplate,
  init: () => {
    defineAssociations();
  }
};