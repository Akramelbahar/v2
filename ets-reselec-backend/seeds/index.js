const bcrypt = require('bcryptjs');
const { 
  User, 
  Role, 
  Permission, 
  Section,
  Client,
  Equipment,
  Intervention,
  sequelize 
} = require('../models');

const seedDatabase = async () => {
  const transaction = await sequelize.transaction();
  
  try {
    console.log('🌱 Starting database seeding...');

    // Check if data already exists
    const existingUsers = await User.count();
    if (existingUsers > 0) {
      console.log('ℹ️  Database already contains data. Skipping seed.');
      return;
    }

    // Create Roles
    const roles = await Role.bulkCreate([
      { nom: 'Administrateur' },
      { nom: 'Chef de Section' },
      { nom: 'Technicien Senior' },
      { nom: 'Technicien Junior' },
      { nom: 'Observateur' }
    ], { transaction });

    console.log('✅ Roles created');

    // Create Permissions
    const permissions = await Permission.bulkCreate([
      // User permissions
      { module: 'utilisateurs', action: 'create', description: 'Créer des utilisateurs' },
      { module: 'utilisateurs', action: 'read', description: 'Voir les utilisateurs' },
      { module: 'utilisateurs', action: 'update', description: 'Modifier les utilisateurs' },
      { module: 'utilisateurs', action: 'delete', description: 'Supprimer des utilisateurs' },
      
      // Client permissions
      { module: 'clients', action: 'create', description: 'Créer des clients' },
      { module: 'clients', action: 'read', description: 'Voir les clients' },
      { module: 'clients', action: 'update', description: 'Modifier les clients' },
      { module: 'clients', action: 'delete', description: 'Supprimer des clients' },
      
      // Equipment permissions
      { module: 'equipements', action: 'create', description: 'Créer des équipements' },
      { module: 'equipements', action: 'read', description: 'Voir les équipements' },
      { module: 'equipements', action: 'update', description: 'Modifier les équipements' },
      { module: 'equipements', action: 'delete', description: 'Supprimer des équipements' },
      
      // Intervention permissions
      { module: 'interventions', action: 'create', description: 'Créer des interventions' },
      { module: 'interventions', action: 'read', description: 'Voir les interventions' },
      { module: 'interventions', action: 'update', description: 'Modifier les interventions' },
      { module: 'interventions', action: 'delete', description: 'Supprimer des interventions' },
      { module: 'interventions', action: 'validate', description: 'Valider les interventions' },
      
      // Report permissions
      { module: 'rapports', action: 'create', description: 'Créer des rapports' },
      { module: 'rapports', action: 'read', description: 'Voir les rapports' },
      { module: 'rapports', action: 'validate', description: 'Valider les rapports' }
    ], { transaction });

    console.log('✅ Permissions created');

    // Assign all permissions to Administrator role
    const adminRole = roles.find(r => r.nom === 'Administrateur');
    await adminRole.setPermissions(permissions, { transaction });

    // Create Sections
    const sections = await Section.bulkCreate([
      { nom: 'Maintenance Préventive', type: 'Opérationnelle' },
      { nom: 'Maintenance Corrective', type: 'Opérationnelle' },
      { nom: 'Rénovation', type: 'Opérationnelle' },
      { nom: 'Contrôle Qualité', type: 'Support' },
      { nom: 'Administration', type: 'Support' }
    ], { transaction });

    console.log('✅ Sections created');

    // Create Admin User
    const adminUser = await User.create({
      nom: 'Administrateur Système',
      section: 'Administration',
      username: 'admin',
      password: 'admin123', // Will be hashed by the hook
      role_id: adminRole.id,
      section_id: sections.find(s => s.nom === 'Administration').id
    }, { transaction });

    console.log('✅ Admin user created (username: admin, password: admin123)');

    // Create sample users
    const sampleUsers = await User.bulkCreate([
      {
        nom: 'Jean Dupont',
        section: 'Maintenance Préventive',
        username: 'jdupont',
        password: await bcrypt.hash('password123', 10),
        role_id: roles.find(r => r.nom === 'Chef de Section').id,
        section_id: sections.find(s => s.nom === 'Maintenance Préventive').id
      },
      {
        nom: 'Marie Martin',
        section: 'Maintenance Corrective',
        username: 'mmartin',
        password: await bcrypt.hash('password123', 10),
        role_id: roles.find(r => r.nom === 'Technicien Senior').id,
        section_id: sections.find(s => s.nom === 'Maintenance Corrective').id
      },
      {
        nom: 'Pierre Bernard',
        section: 'Rénovation',
        username: 'pbernard',
        password: await bcrypt.hash('password123', 10),
        role_id: roles.find(r => r.nom === 'Technicien Junior').id,
        section_id: sections.find(s => s.nom === 'Rénovation').id
      }
    ], { transaction });

    console.log('✅ Sample users created');

    // Create sample clients
    const sampleClients = await Client.bulkCreate([
      {
        nom_entreprise: 'Industries Maroc SA',
        secteur_activite: 'Industrie Manufacturière',
        adresse: '123 Zone Industrielle',
        ville: 'Casablanca',
        codePostal: '20000',
        tel: '+212 522 123456',
        email: 'contact@industries-maroc.ma',
        contact_principal: 'Ahmed Benali',
        poste_contact: 'Directeur Technique',
        telephone_contact: '+212 661 234567',
        email_contact: 'a.benali@industries-maroc.ma',
        forme_juridique: 'SA',
        cree_par_id: adminUser.id
      },
      {
        nom_entreprise: 'Textile Nord SARL',
        secteur_activite: 'Textile',
        adresse: '45 Rue des Fabricants',
        ville: 'Tanger',
        codePostal: '90000',
        tel: '+212 539 987654',
        email: 'info@textile-nord.ma',
        contact_principal: 'Fatima Alami',
        poste_contact: 'Responsable Maintenance',
        telephone_contact: '+212 662 345678',
        email_contact: 'f.alami@textile-nord.ma',
        forme_juridique: 'SARL',
        cree_par_id: adminUser.id
      },
      {
        nom_entreprise: 'Agro-Alimentaire Sud',
        secteur_activite: 'Agro-alimentaire',
        adresse: '78 Avenue Mohammed V',
        ville: 'Agadir',
        codePostal: '80000',
        tel: '+212 528 876543',
        email: 'contact@agrosud.ma',
        contact_principal: 'Rachid Tahiri',
        poste_contact: 'Ingénieur Production',
        telephone_contact: '+212 663 456789',
        email_contact: 'r.tahiri@agrosud.ma',
        forme_juridique: 'SA',
        cree_par_id: adminUser.id
      }
    ], { transaction });

    console.log('✅ Sample clients created');

    // Create sample equipment
    const sampleEquipment = await Equipment.bulkCreate([
      {
        nom: 'Moteur Principal Ligne 1',
        marque: 'Siemens',
        modele: '1LA7-315',
        type_equipement: 'MOTEUR_ELECTRIQUE',
        etatDeReception: 'Bon état général',
        valeur: '75000 MAD',
        cout: 75000,
        proprietaire_id: sampleClients[0].id,
        ajouterPar_id: adminUser.id
      },
      {
        nom: 'Transformateur 630 KVA',
        marque: 'Schneider Electric',
        modele: 'Trihal 630',
        type_equipement: 'TRANSFORMATEUR',
        etatDeReception: 'À réviser',
        valeur: '250000 MAD',
        cout: 250000,
        proprietaire_id: sampleClients[0].id,
        ajouterPar_id: adminUser.id
      },
      {
        nom: 'Compresseur Atlas Copco',
        marque: 'Atlas Copco',
        modele: 'GA 90',
        type_equipement: 'COMPRESSEUR',
        etatDeReception: 'Nécessite maintenance',
        valeur: '180000 MAD',
        cout: 180000,
        proprietaire_id: sampleClients[1].id,
        ajouterPar_id: sampleUsers[0].id
      },
      {
        nom: 'Pompe Centrifuge',
        marque: 'Grundfos',
        modele: 'NB 65-315',
        type_equipement: 'POMPE_INDUSTRIELLE',
        etatDeReception: 'Bon état',
        valeur: '45000 MAD',
        cout: 45000,
        proprietaire_id: sampleClients[2].id,
        ajouterPar_id: sampleUsers[1].id
      }
    ], { transaction });

    console.log('✅ Sample equipment created');

    // Create sample interventions
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    const lastMonth = new Date(today);
    lastMonth.setMonth(today.getMonth() - 1);

    const sampleInterventions = await Intervention.bulkCreate([
      {
        date: today,
        description: 'Maintenance préventive mensuelle du moteur principal',
        statut: 'EN_COURS',
        urgence: false,
        creerPar_id: sampleUsers[0].id,
        equipement_id: sampleEquipment[0].id
      },
      {
        date: nextWeek,
        description: 'Révision complète du transformateur - contrôle isolement',
        statut: 'PLANIFIEE',
        urgence: false,
        creerPar_id: sampleUsers[1].id,
        equipement_id: sampleEquipment[1].id
      },
      {
        date: today,
        description: 'Réparation urgente - fuite d\'huile compresseur',
        statut: 'EN_COURS',
        urgence: true,
        creerPar_id: sampleUsers[0].id,
        equipement_id: sampleEquipment[2].id
      },
      {
        date: lastMonth,
        description: 'Remplacement des roulements pompe centrifuge',
        statut: 'TERMINEE',
        urgence: false,
        creerPar_id: sampleUsers[2].id,
        equipement_id: sampleEquipment[3].id
      }
    ], { transaction });

    console.log('✅ Sample interventions created');

    // Commit transaction
    await transaction.commit();
    console.log('🎉 Database seeding completed successfully!');

    // Display login information
    console.log('\n📝 Login Information:');
    console.log('------------------------');
    console.log('Admin User:');
    console.log('  Username: admin');
    console.log('  Password: admin123');
    console.log('\nSample Users:');
    console.log('  Username: jdupont | Password: password123');
    console.log('  Username: mmartin | Password: password123');
    console.log('  Username: pbernard | Password: password123');
    console.log('------------------------\n');

  } catch (error) {
    await transaction.rollback();
    console.error('❌ Seeding failed:', error);
    throw error;
  }
};

// Run seeding if called directly
if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { seedDatabase };