-- Script de création de la base de données pour l'application d'annonces
-- Exécuter ce script pour initialiser la base de données

-- Créer la base de données
CREATE DATABASE IF NOT EXISTS annonces_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE annonces_db;

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
                                     id INT PRIMARY KEY AUTO_INCREMENT,
                                     nom VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('annonceur', 'administrateur', 'acheteur') DEFAULT 'annonceur',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des annonces
CREATE TABLE IF NOT EXISTS annonces (
                                        id INT PRIMARY KEY AUTO_INCREMENT,
                                        titre VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    prix DECIMAL(10,2) NOT NULL,
    categorie VARCHAR(50),
    statut ENUM('visible', 'non-visible') DEFAULT 'visible',
    user_id INT NOT NULL,
    commentaire_admin TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_statut (statut),
    INDEX idx_categorie (categorie),
    INDEX idx_created_at (created_at),
    FULLTEXT INDEX idx_fulltext_search (titre, description)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des signalements
CREATE TABLE IF NOT EXISTS signalements (
                                            id INT PRIMARY KEY AUTO_INCREMENT,
                                            email VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    annonce_id INT NOT NULL,
    statut ENUM('nouveau', 'traite', 'rejete') DEFAULT 'nouveau',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (annonce_id) REFERENCES annonces(id) ON DELETE CASCADE,
    INDEX idx_annonce_id (annonce_id),
    INDEX idx_statut (statut)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des achats (pour future implémentation)
CREATE TABLE IF NOT EXISTS achats (
                                      id INT PRIMARY KEY AUTO_INCREMENT,
                                      annonce_id INT NOT NULL,
                                      acheteur_id INT NOT NULL,
                                      montant DECIMAL(10,2) NOT NULL,
    statut ENUM('en_attente', 'complete', 'annule') DEFAULT 'en_attente',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (annonce_id) REFERENCES annonces(id) ON DELETE CASCADE,
    FOREIGN KEY (acheteur_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_annonce_id (annonce_id),
    INDEX idx_acheteur_id (acheteur_id),
    INDEX idx_statut (statut)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertion d'un administrateur par défaut
-- Mot de passe : admin123 (à changer en production)
INSERT INTO users (nom, email, password, role) VALUES
    ('Administrateur', 'admin@annonces.com', '$2b$10$YourHashedPasswordHere', 'administrateur')
    ON DUPLICATE KEY UPDATE nom=nom;

-- Insertion de données de test (optionnel - commenté par défaut)
/*
INSERT INTO users (nom, email, password, role) VALUES
('Jean Dupont', 'jean@example.com', '$2b$10$SomeHashedPassword', 'annonceur'),
('Marie Martin', 'marie@example.com', '$2b$10$SomeHashedPassword', 'acheteur');

INSERT INTO annonces (titre, description, prix, categorie, user_id, statut) VALUES
('Vélo de montagne', 'Excellent état, peu utilisé', 250.00, 'Sports', 2, 'visible'),
('Ordinateur portable', 'MacBook Pro 2020, 16GB RAM', 1200.00, 'Informatique', 2, 'visible'),
('Canapé 3 places', 'Très confortable, tissu bleu', 350.00, 'Meubles', 2, 'visible');
*/

-- Afficher les tables créées
SHOW TABLES;