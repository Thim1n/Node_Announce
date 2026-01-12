'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up (queryInterface, Sequelize) {
        const t = await queryInterface.sequelize.transaction();
        try {
            await queryInterface.createTable('Users', {
                id: {
                    type: Sequelize.DataTypes.INTEGER,
                    allowNull: false,
                    autoIncrement: true,
                    primaryKey: true
                },
                firstname: {
                    type: Sequelize.DataTypes.STRING,
                    allowNull: false,
                },
                lastname: {
                    type: Sequelize.DataTypes.STRING,
                    allowNull: false,
                },
                profil_picture: {
                    type: Sequelize.DataTypes.STRING,
                    allowNull: true,
                },
                phone_number: {
                    type: Sequelize.DataTypes.STRING,
                    allowNull: true,
                },
                address: {
                    type: Sequelize.DataTypes.STRING,
                    allowNull: true,
                },
                zip_code: {
                    type: Sequelize.DataTypes.STRING,
                    allowNull: true,
                },
                city: {
                    type: Sequelize.DataTypes.STRING,
                    allowNull: true,
                },
                token: {
                    type: Sequelize.DataTypes.TEXT,
                    allowNull: true,
                },
                role: {
                    type: Sequelize.DataTypes.ENUM,
                    allowNull: false,
                    values: ['admin', 'seller'],
                    defaultValue: 'seller'
                },
                createdAt: {
                    allowNull: false,
                    type: Sequelize.DataTypes.DATE,
                    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
                },
                updatedAt: {
                    allowNull: false,
                    type: Sequelize.DataTypes.DATE,
                    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
                }
            }, { transaction: t });
            await queryInterface.addColumn('Annonces', 'user_id', {
                type: Sequelize.DataTypes.INTEGER,
                references: {
                    model: 'Users',
                    key: 'id'
                }
            }, { transaction: t })
            await t.commit();
        } catch(error) {
            await t.rollback();
            throw error;
        }
    },

    async down (queryInterface, Sequelize) {
        const t = await queryInterface.sequelize.transaction();
        try {
            await queryInterface.removeColumn('Annonces', 'user_id', { transaction: t });
            await queryInterface.dropTable('Users', { transaction: t });
            await t.commit();
        } catch (error) {
            await t.rollback();
            throw error;
        }
    }
};