// ets-reselec-backend/seeds/index.js
const { sequelize } = require('../config/database');
const { 
  User, 
  Role, 
  Permission, 
  Section, 
  Client, 
  Equipment 
} = require('../models');

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Create Roles
    console.log('Creating roles...');
    const roles = await Role.bulkCreate([
      { nom: 'Administrateur' },
      { nom: 'Technicien' },
      { nom: 'Superviseur' },
      { nom: 'Utilisateur' }
    ], { 
      ignoreDuplicates: true,
      returning: true 
    });

    // Create Permissions
    console.log('Creating permissions...');
    const permissions = await Permission.bulkCreate([
      // Client permissions
      { module: 'clients', action: 'read', description: 'Voir les clients' },
      { module: 'clients', action: 'create', description: 'Créer des clients' },
      { module: 'clients', action: 'update', description: 'Modifier les clients' },
      { module: 'clients', action: 'delete', description: 'Supprimer les clients' },
      
      // Equipment permissions
      { module: 'equipment', action: 'read', description: 'Voir les équipements' },
      { module: 'equipment', action: 'create', description: 'Créer des équipements' },
      { module: 'equipment', action: 'update', description: 'Modifier les équipements' },
      { module: 'equipment', action: 'delete', description: 'Supprimer les équipements' },
      
      // Intervention permissions
      { module: 'interventions', action: 'read', description: 'Voir les interventions' },
      { module: 'interventions', action: 'create', description: 'Créer des interventions' },
      { module: 'interventions', action: 'update', description: 'Modifier les interventions' },
      { module: 'interventions', action: 'delete', description: 'Supprimer les interventions' },
      
      // Report permissions
      { module: 'reports', action: 'read', description: 'Voir les rapports' },
      { module: 'reports', action: 'create', description: 'Créer des rapports' },
      
      // Analytics permissions
      { module: 'analytics', action: 'read', description: 'Voir les analyses' },
      
      // Admin permissions
      { module: 'users', action: 'read', description: 'Voir les utilisateurs' },
      { module: 'users', action: 'create', description: 'Créer des utilisateurs' },
      { module: 'users', action: 'update', description: 'Modifier les utilisateurs' },
      { module: 'users', action: 'delete', description: 'Supprimer les utilisateurs' },
      { module: 'roles', action: 'read', description: 'Voir les rôles' },
      { module: 'roles', action: 'create', description: 'Créer des rôles' },
      { module: 'roles', action: 'update', description: 'Modifier les rôles' }
    ], { 
      ignoreDuplicates: true,
      returning: true 
    });

    // Get or find admin role
    let adminRole = roles.find(r => r.nom === 'Administrateur');
    if (!adminRole) {
      adminRole = await Role.findOne({ where: { nom: 'Administrateur' } });
    }
    
    // Assign all permissions to Admin role
    console.log('Assigning permissions to roles...');
    if (adminRole) {
      await adminRole.setPermissions(permissions);
    }

    // Assign basic permissions to Technicien role
    let technicienRole = roles.find(r => r.nom === 'Technicien');
    if (!technicienRole) {
      technicienRole = await Role.findOne({ where: { nom: 'Technicien' } });
    }
    
    if (technicienRole) {
      const techPermissions = permissions.filter(p => 
        ['clients:read', 'equipment:read', 'equipment:update', 'interventions:read', 'interventions:create', 'interventions:update', 'reports:read'].includes(`${p.module}:${p.action}`)
      );
      await technicienRole.setPermissions(techPermissions);
    }

    // Create Sections
    console.log('Creating sections...');
    const sections = await Section.bulkCreate([
      { nom: 'Administration', type: 'Administrative' },
      { nom: 'Maintenance', type: 'Technique' },
      { nom: 'Commercial', type: 'Commercial' },
      { nom: 'Technique', type: 'Technique' }
    ], { 
      ignoreDuplicates: true,
      returning: true 
    });

    // Get or find admin section
    let adminSection = sections.find(s => s.nom === 'Administration');
    if (!adminSection) {
      adminSection = await Section.findOne({ where: { nom: 'Administration' } });
    }

    // Create Admin User
    console.log('Creating admin user...');
    const [adminUser, created] = await User.findOrCreate({
      where: { username: 'admin' },
      defaults: {
        nom: 'Administrateur Système',
        username: 'admin',
        password: 'Admin123!', // This will be hashed by the model hook
        section: 'Administration',
        role_id: adminRole?.id,
        section_id: adminSection?.id
      }
    });

    if (created) {
      console.log('✅ Admin user created:');
      console.log('   Username: admin');
      console.log('   Password: Admin123!');
      console.log('   ⚠️  Please change the password after first login!');
    } else {
      console.log('ℹ️  Admin user already exists');
    }

    // Create sample client
    console.log('Creating sample data...');
    const [sampleClient] = await Client.findOrCreate({
      where: { nom_entreprise: 'Société Test SARL' },
      defaults: {
        nom_entreprise: 'Société Test SARL',
        secteur_activite: 'Industrie',
        adresse: '123 Rue de l\'Industrie',
        ville: 'Casablanca',
        codePostal: '20000',
        tel: '+212 522 123 456',
        email: 'contact@societetest.ma',
        contact_principal: 'Mohamed ALAMI',
        telephone_contact: '+212 661 123 456',
        email_contact: 'mohamed.alami@societetest.ma',
        cree_par_id: adminUser.id
      }
    });

    // Create sample equipment
    const existingEquipment = await Equipment.findOne({
      where: { nom: 'Moteur Électrique Principal' }
    });

    if (!existingEquipment) {
      await Equipment.create({
        nom: 'Moteur Électrique Principal',
        marque: 'Siemens',
        modele: 'M1234',
        type_equipement: 'MOTEUR_ELECTRIQUE',
        etatDeReception: 'Bon état',
        valeur: '50000 MAD',
        cout: 45000,
        proprietaire_id: sampleClient.id,
        ajouterPar_id: adminUser.id
      });
    }

    console.log('✅ Database seeding completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   - Roles and permissions configured`);
    console.log(`   - Sections created`);
    console.log('   - Admin user ready');
    console.log('   - Sample data created');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
};

module.exports = { seedDatabase };