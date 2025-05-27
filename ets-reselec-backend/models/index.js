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

// User associations
User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });
User.belongsTo(Section, { foreignKey: 'section_id', as: 'sectionBelongsTo' });
User.hasMany(Client, { foreignKey: 'cree_par_id', as: 'clientsCrees' });
User.hasMany(Equipment, { foreignKey: 'ajouterPar_id', as: 'equipementsAjoutes' });
User.hasMany(Intervention, { foreignKey: 'creerPar_id', as: 'interventionsCrees' });
User.hasMany(PrestataireExterne, { foreignKey: 'creer_par_id', as: 'prestatairesCrees' });

// Role associations
Role.hasMany(User, { foreignKey: 'role_id', as: 'users' });
Role.belongsToMany(Permission, { 
  through: 'Role_Permission',
  foreignKey: 'role_id',
  otherKey: 'permission_id',
  as: 'permissions'
});

// Permission associations
Permission.belongsToMany(Role, { 
  through: 'Role_Permission',
  foreignKey: 'permission_id',
  otherKey: 'role_id',
  as: 'roles'
});

// Section associations
Section.belongsTo(User, { foreignKey: 'responsable_id', as: 'responsable' });
Section.hasMany(User, { foreignKey: 'section_id', as: 'utilisateurs' });
Section.belongsToMany(Intervention, {
  through: 'Section_Intervention',
  foreignKey: 'section_id',
  otherKey: 'intervention_id',
  as: 'interventionsGerees'
});
Section.belongsToMany(Intervention, {
  through: 'Intervention_Section',
  foreignKey: 'section_id',
  otherKey: 'intervention_id',
  as: 'interventionsEffectuees'
});

// Client associations
Client.belongsTo(User, { foreignKey: 'cree_par_id', as: 'creerPar' });
Client.hasMany(Equipment, { foreignKey: 'proprietaire_id', as: 'equipements' });

// Equipment associations
Equipment.belongsTo(Client, { foreignKey: 'proprietaire_id', as: 'proprietaire' });
Equipment.belongsTo(User, { foreignKey: 'ajouterPar_id', as: 'ajouterPar' });
Equipment.hasMany(Intervention, { foreignKey: 'equipement_id', as: 'interventions' });

// Intervention associations
Intervention.belongsTo(Equipment, { foreignKey: 'equipement_id', as: 'equipement' });
Intervention.belongsTo(User, { foreignKey: 'creerPar_id', as: 'creerPar' });
Intervention.hasOne(Diagnostic, { foreignKey: 'intervention_id', as: 'diagnostic' });
Intervention.hasOne(Planification, { foreignKey: 'intervention_id', as: 'planification' });
Intervention.hasOne(ControleQualite, { foreignKey: 'intervention_id', as: 'controleQualite' });
Intervention.hasOne(GestionAdministrative, { foreignKey: 'intervention_id', as: 'gestionAdministrative' });
Intervention.hasOne(Renovation, { foreignKey: 'intervention_id', as: 'renovation' });
Intervention.hasOne(Maintenance, { foreignKey: 'intervention_id', as: 'maintenance' });
Intervention.hasMany(Rapport, { foreignKey: 'intervention_id', as: 'rapports' });
Intervention.belongsToMany(Section, {
  through: 'Section_Intervention',
  foreignKey: 'intervention_id',
  otherKey: 'section_id',
  as: 'sectionsGerant'
});
Intervention.belongsToMany(Section, {
  through: 'Intervention_Section',
  foreignKey: 'intervention_id',
  otherKey: 'section_id',
  as: 'sectionsEffectuant'
});
Intervention.belongsToMany(PrestataireExterne, {
  through: 'Intervention_PrestataireExterne',
  foreignKey: 'intervention_id',
  otherKey: 'prestataire_id',
  as: 'prestataires'
});

// Diagnostic associations
Diagnostic.belongsTo(Intervention, { foreignKey: 'intervention_id', as: 'intervention' });

// Planification associations
Planification.belongsTo(Intervention, { foreignKey: 'intervention_id', as: 'intervention' });

// ControleQualite associations
ControleQualite.belongsTo(Intervention, { foreignKey: 'intervention_id', as: 'intervention' });

// PrestataireExterne associations
PrestataireExterne.belongsTo(User, { foreignKey: 'creer_par_id', as: 'creerPar' });
PrestataireExterne.belongsToMany(Intervention, {
  through: 'Intervention_PrestataireExterne',
  foreignKey: 'prestataire_id',
  otherKey: 'intervention_id',
  as: 'interventions'
});

// Rapport associations
Rapport.belongsTo(Intervention, { foreignKey: 'intervention_id', as: 'intervention' });
Rapport.belongsToMany(User, {
  through: 'Rapport_Utilisateur',
  foreignKey: 'rapport_id',
  otherKey: 'utilisateur_id',
  as: 'utilisateurs'
});

// Renovation associations
Renovation.belongsTo(Intervention, { foreignKey: 'intervention_id', as: 'intervention' });

// Maintenance associations
Maintenance.belongsTo(Intervention, { foreignKey: 'intervention_id', as: 'intervention' });

// GestionAdministrative associations
GestionAdministrative.belongsTo(Intervention, { foreignKey: 'intervention_id', as: 'intervention' });

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
  GestionAdministrative
};