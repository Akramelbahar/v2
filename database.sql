-- ETS RESELEC Database Schema
-- MySQL Implementation based on UML diagram

-- Create database
CREATE DATABASE IF NOT EXISTS ets_reselec;
USE ets_reselec;

-- Enum tables for storing enum values
CREATE TABLE TypeEquipement_enum (
    value VARCHAR(50) PRIMARY KEY
);

INSERT INTO TypeEquipement_enum (value) VALUES 
    ('MOTEUR_ELECTRIQUE'),
    ('TRANSFORMATEUR'),
    ('GENERATEUR'),
    ('POMPE_INDUSTRIELLE'),
    ('VENTILATEUR'),
    ('COMPRESSEUR'),
    ('AUTOMATE'),
    ('TABLEAU_ELECTRIQUE');

CREATE TABLE TypeOperation_enum (
    value VARCHAR(50) PRIMARY KEY
);

INSERT INTO TypeOperation_enum (value) VALUES 
    ('Diagnostic'),
    ('Planification'),
    ('ControleQualite');

CREATE TABLE StatusIntervention_enum (
    value VARCHAR(50) PRIMARY KEY
);

INSERT INTO StatusIntervention_enum (value) VALUES 
    ('PLANIFIEE'),
    ('EN_ATTENTE_PDR'),
    ('EN_COURS'),
    ('EN_PAUSE'),
    ('TERMINEE'),
    ('ANNULEE'),
    ('ECHEC');

-- Client table
CREATE TABLE Client (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom_entreprise VARCHAR(255) NOT NULL,
    secteur_activite VARCHAR(255),
    adresse VARCHAR(255),
    ville VARCHAR(100),
    codePostal VARCHAR(20),
    tel VARCHAR(20),
    fax VARCHAR(20),
    email VARCHAR(100),
    siteWeb VARCHAR(255),
    contact_principal VARCHAR(100),
    poste_contact VARCHAR(100),
    telephone_contact VARCHAR(20),
    email_contact VARCHAR(100),
    registre_commerce VARCHAR(100),
    forme_juridique VARCHAR(100),
    cree_par_id INT,
    INDEX idx_client_cree_par (cree_par_id)
);

-- Role table
CREATE TABLE Role (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL UNIQUE
);

-- Permission table
CREATE TABLE Permission (
    id INT AUTO_INCREMENT PRIMARY KEY,
    module VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    description TEXT
);

-- Role_Permission junction table (many-to-many)
CREATE TABLE Role_Permission (
    role_id INT NOT NULL,
    permission_id INT NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES Role(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES Permission(id) ON DELETE CASCADE
);

-- Section table
CREATE TABLE Section (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    type VARCHAR(100),
    responsable_id INT,
    INDEX idx_section_responsable (responsable_id)
);

-- Utilisateur table
CREATE TABLE Utilisateur (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    section VARCHAR(100),
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role_id INT,
    section_id INT,
    FOREIGN KEY (role_id) REFERENCES Role(id),
    FOREIGN KEY (section_id) REFERENCES Section(id),
    INDEX idx_utilisateur_role (role_id),
    INDEX idx_utilisateur_section (section_id)
);

-- Add foreign key constraints after Utilisateur table is created
ALTER TABLE Client 
    ADD FOREIGN KEY (cree_par_id) REFERENCES Utilisateur(id);

ALTER TABLE Section 
    ADD FOREIGN KEY (responsable_id) REFERENCES Utilisateur(id);

-- Equipement table
CREATE TABLE Equipement (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    marque VARCHAR(100),
    modele VARCHAR(100),
    type_equipement VARCHAR(50),
    etatDeReception VARCHAR(255),
    valeur VARCHAR(100),
    cout DOUBLE,
    proprietaire_id INT NOT NULL,
    ajouterPar_id INT NOT NULL,
    FOREIGN KEY (type_equipement) REFERENCES TypeEquipement_enum(value),
    FOREIGN KEY (proprietaire_id) REFERENCES Client(id),
    FOREIGN KEY (ajouterPar_id) REFERENCES Utilisateur(id),
    INDEX idx_equipement_proprietaire (proprietaire_id),
    INDEX idx_equipement_ajouterpar (ajouterPar_id)
);

-- Intervention table
CREATE TABLE Intervention (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    description TEXT,
    statut VARCHAR(50),
    urgence BOOLEAN DEFAULT FALSE,
    creerPar_id INT NOT NULL,
    equipement_id INT NOT NULL,
    FOREIGN KEY (statut) REFERENCES StatusIntervention_enum(value),
    FOREIGN KEY (creerPar_id) REFERENCES Utilisateur(id),
    FOREIGN KEY (equipement_id) REFERENCES Equipement(id),
    INDEX idx_intervention_creerpar (creerPar_id),
    INDEX idx_intervention_equipement (equipement_id)
);

-- Intervention_TypeOperation junction table (many-to-many)
CREATE TABLE Intervention_TypeOperation (
    intervention_id INT NOT NULL,
    typeOperation VARCHAR(50) NOT NULL,
    PRIMARY KEY (intervention_id, typeOperation),
    FOREIGN KEY (intervention_id) REFERENCES Intervention(id) ON DELETE CASCADE,
    FOREIGN KEY (typeOperation) REFERENCES TypeOperation_enum(value)
);

-- Diagnostic table
CREATE TABLE Diagnostic (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dateCreation DATE NOT NULL,
    intervention_id INT UNIQUE,
    FOREIGN KEY (intervention_id) REFERENCES Intervention(id)
);

-- Diagnostic_travailRequis table (one-to-many)
CREATE TABLE Diagnostic_travailRequis (
    diagnostic_id INT NOT NULL,
    travail VARCHAR(255) NOT NULL,
    PRIMARY KEY (diagnostic_id, travail),
    FOREIGN KEY (diagnostic_id) REFERENCES Diagnostic(id) ON DELETE CASCADE
);

-- Diagnostic_besoinPDR table (one-to-many)
CREATE TABLE Diagnostic_besoinPDR (
    diagnostic_id INT NOT NULL,
    besoin VARCHAR(255) NOT NULL,
    PRIMARY KEY (diagnostic_id, besoin),
    FOREIGN KEY (diagnostic_id) REFERENCES Diagnostic(id) ON DELETE CASCADE
);

-- Diagnostic_chargesRealisees table (one-to-many)
CREATE TABLE Diagnostic_chargesRealisees (
    diagnostic_id INT NOT NULL,
    charge VARCHAR(255) NOT NULL,
    PRIMARY KEY (diagnostic_id, charge),
    FOREIGN KEY (diagnostic_id) REFERENCES Diagnostic(id) ON DELETE CASCADE
);

-- Planification table
CREATE TABLE Planification (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dateCreation DATE NOT NULL,
    capaciteExecution INT,
    urgencePrise BOOLEAN DEFAULT FALSE,
    disponibilitePDR BOOLEAN DEFAULT FALSE,
    intervention_id INT,
    FOREIGN KEY (intervention_id) REFERENCES Intervention(id),
    INDEX idx_planification_intervention (intervention_id)
);

-- Renovation table (inherits from Intervention)
CREATE TABLE Renovation (
    intervention_id INT PRIMARY KEY,
    objectif TEXT,
    cout DOUBLE,
    dureeEstimee INT,
    FOREIGN KEY (intervention_id) REFERENCES Intervention(id) ON DELETE CASCADE
);

-- Maintenance table (inherits from Intervention)
CREATE TABLE Maintenance (
    intervention_id INT PRIMARY KEY,
    typeMaintenance VARCHAR(100),
    duree INT,
    FOREIGN KEY (intervention_id) REFERENCES Intervention(id) ON DELETE CASCADE
);

-- Maintenance_pieces table (one-to-many)
CREATE TABLE Maintenance_pieces (
    maintenance_id INT NOT NULL,
    piece VARCHAR(255) NOT NULL,
    PRIMARY KEY (maintenance_id, piece),
    FOREIGN KEY (maintenance_id) REFERENCES Maintenance(intervention_id) ON DELETE CASCADE
);

-- ControleQualite table
CREATE TABLE ControleQualite (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dateControle DATE NOT NULL,
    resultatsEssais TEXT,
    analyseVibratoire TEXT,
    intervention_id INT,
    FOREIGN KEY (intervention_id) REFERENCES Intervention(id),
    INDEX idx_controlequalite_intervention (intervention_id)
);

-- Rapport table
CREATE TABLE Rapport (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dateCreation DATE NOT NULL,
    contenu TEXT,
    validation BOOLEAN DEFAULT FALSE,
    intervention_id INT NOT NULL,
    FOREIGN KEY (intervention_id) REFERENCES Intervention(id),
    INDEX idx_rapport_intervention (intervention_id)
);

-- PrestataireExterne table
CREATE TABLE PrestataireExterne (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    contrat TEXT,
    rapportOperation TEXT,
    creer_par_id INT NOT NULL,
    FOREIGN KEY (creer_par_id) REFERENCES Utilisateur(id),
    INDEX idx_prestataire_creerpar (creer_par_id)
);

-- GestionAdministrative table
CREATE TABLE GestionAdministrative (
    id INT AUTO_INCREMENT PRIMARY KEY,
    commandeAchat TEXT,
    facturation TEXT,
    validation BOOLEAN DEFAULT FALSE,
    intervention_id INT UNIQUE,
    FOREIGN KEY (intervention_id) REFERENCES Intervention(id)
);

-- Junction tables for many-to-many relationships

-- Section gère Intervention (many-to-many)
CREATE TABLE Section_Intervention (
    section_id INT NOT NULL,
    intervention_id INT NOT NULL,
    PRIMARY KEY (section_id, intervention_id),
    FOREIGN KEY (section_id) REFERENCES Section(id) ON DELETE CASCADE,
    FOREIGN KEY (intervention_id) REFERENCES Intervention(id) ON DELETE CASCADE
);

-- Intervention effectuée par Section (many-to-many)
CREATE TABLE Intervention_Section (
    intervention_id INT NOT NULL,
    section_id INT NOT NULL,
    PRIMARY KEY (intervention_id, section_id),
    FOREIGN KEY (intervention_id) REFERENCES Intervention(id) ON DELETE CASCADE,
    FOREIGN KEY (section_id) REFERENCES Section(id) ON DELETE CASCADE
);

-- Intervention réalisée par PrestataireExterne (many-to-many)
CREATE TABLE Intervention_PrestataireExterne (
    intervention_id INT NOT NULL,
    prestataire_id INT NOT NULL,
    PRIMARY KEY (intervention_id, prestataire_id),
    FOREIGN KEY (intervention_id) REFERENCES Intervention(id) ON DELETE CASCADE,
    FOREIGN KEY (prestataire_id) REFERENCES PrestataireExterne(id) ON DELETE CASCADE
);

-- Rapport rédigé et validé par Utilisateur (many-to-many)
CREATE TABLE Rapport_Utilisateur (
    rapport_id INT NOT NULL,
    utilisateur_id INT NOT NULL,
    PRIMARY KEY (rapport_id, utilisateur_id),
    FOREIGN KEY (rapport_id) REFERENCES Rapport(id) ON DELETE CASCADE,
    FOREIGN KEY (utilisateur_id) REFERENCES Utilisateur(id) ON DELETE CASCADE
);

-- Indices for performance optimization
CREATE INDEX idx_equipement_type ON Equipement(type_equipement);
CREATE INDEX idx_intervention_date ON Intervention(date);
CREATE INDEX idx_intervention_statut ON Intervention(statut);
CREATE INDEX idx_diagnostic_date ON Diagnostic(dateCreation);
CREATE INDEX idx_planification_date ON Planification(dateCreation);
CREATE INDEX idx_controlequalite_date ON ControleQualite(dateControle);
CREATE INDEX idx_rapport_date ON Rapport(dateCreation);

-- Views for common queries
CREATE VIEW v_interventions_en_cours AS
SELECT i.*, e.nom as equipement_nom, e.marque, e.modele, u.nom as createur_nom
FROM Intervention i
JOIN Equipement e ON i.equipement_id = e.id
JOIN Utilisateur u ON i.creerPar_id = u.id
WHERE i.statut = 'EN_COURS';

CREATE VIEW v_equipements_par_client AS
SELECT c.nom_entreprise, e.*, u.nom as ajoute_par
FROM Equipement e
JOIN Client c ON e.proprietaire_id = c.id
JOIN Utilisateur u ON e.ajouterPar_id = u.id;

-- Stored procedures for common operations
DELIMITER //

CREATE PROCEDURE sp_create_intervention(
    IN p_date DATE,
    IN p_description TEXT,
    IN p_statut VARCHAR(50),
    IN p_urgence BOOLEAN,
    IN p_creerPar_id INT,
    IN p_equipement_id INT
)
BEGIN
    INSERT INTO Intervention (date, description, statut, urgence, creerPar_id, equipement_id)
    VALUES (p_date, p_description, p_statut, p_urgence, p_creerPar_id, p_equipement_id);
    
    SELECT LAST_INSERT_ID() as intervention_id;
END //

CREATE PROCEDURE sp_update_intervention_status(
    IN p_intervention_id INT,
    IN p_new_status VARCHAR(50)
)
BEGIN
    UPDATE Intervention 
    SET statut = p_new_status 
    WHERE id = p_intervention_id;
END //

DELIMITER ;

-- Triggers for audit trail
DELIMITER //

CREATE TRIGGER tr_intervention_status_change
AFTER UPDATE ON Intervention
FOR EACH ROW
BEGIN
    IF OLD.statut != NEW.statut THEN
        -- You could log this change to an audit table
        -- For now, we'll just ensure the status is valid
        IF NEW.statut NOT IN (SELECT value FROM StatusIntervention_enum) THEN
            SIGNAL SQLSTATE '45000' 
            SET MESSAGE_TEXT = 'Invalid intervention status';
        END IF;
    END IF;
END //

DELIMITER ;
