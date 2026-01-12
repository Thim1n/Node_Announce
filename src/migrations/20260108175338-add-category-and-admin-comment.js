'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up (queryInterface, Sequelize) {
        const transaction = await queryInterface.sequelize.transaction();
        try {
            // Créer la table Categories
            await queryInterface.createTable('Categories', {
                id: {
                    type: Sequelize.INTEGER,
                    primaryKey: true,
                    autoIncrement: true,
                    allowNull: false
                },
                name: {
                    type: Sequelize.STRING,
                    allowNull: false,
                    unique: true
                },
                slug: {
                    type: Sequelize.STRING,
                    allowNull: false,
                    unique: true
                },
                description: {
                    type: Sequelize.TEXT,
                    allowNull: true
                },
                createdAt: {
                    type: Sequelize.DATE,
                    allowNull: false,
                    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
                },
                updatedAt: {
                    type: Sequelize.DATE,
                    allowNull: false,
                    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
                }
            }, { transaction });

            // Ajouter le champ category_id à la table Annonces
            await queryInterface.addColumn('Annonces', 'category_id', {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: 'Categories',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            }, { transaction });

            // Ajouter le champ admin_comment à la table Annonces
            await queryInterface.addColumn('Annonces', 'admin_comment', {
                type: Sequelize.TEXT,
                allowNull: true
            }, { transaction });

            // Insérer quelques catégories par défaut
            await queryInterface.bulkInsert('Categories', [
                {
                    name: 'Électronique',
                    slug: 'electronique',
                    description: 'Ordinateurs, téléphones, tablettes et accessoires',
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                {
                    name: 'Véhicules',
                    slug: 'vehicules',
                    description: 'Voitures, motos, vélos et accessoires',
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                {
                    name: 'Immobilier',
                    slug: 'immobilier',
                    description: 'Appartements, maisons, terrains',
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                {
                    name: 'Mode',
                    slug: 'mode',
                    description: 'Vêtements, chaussures, accessoires',
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                {
                    name: 'Maison & Jardin',
                    slug: 'maison-jardin',
                    description: 'Meubles, décoration, jardinage',
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            ], { transaction });

            await transaction.commit();
        } catch(error) {
            await transaction.rollback();
            throw error;
        }
    },

    async down (queryInterface, Sequelize) {
        const transaction = await queryInterface.sequelize.transaction();
        try {
            // Supprimer les colonnes de la table Annonces
            await queryInterface.removeColumn('Annonces', 'admin_comment', { transaction });
            await queryInterface.removeColumn('Annonces', 'category_id', { transaction });

            // Supprimer la table Categories
            await queryInterface.dropTable('Categories', { transaction });

            await transaction.commit();
        } catch(error) {
            await transaction.rollback();
            throw error;
        }
    }
};