'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up (queryInterface, Sequelize) {
        const transaction = await queryInterface.sequelize.transaction();
        try {
            await queryInterface.changeColumn('Users', 'username', {
                type: Sequelize.DataTypes.STRING,
                allowNull: false,
                unique: true
            }, { transaction });
            await transaction.commit();
        } catch(error) {
            await transaction.rollback();
            throw error;
        }
    },

    async down (queryInterface, Sequelize) {
        const transaction = await queryInterface.sequelize.transaction();
        try {
            await queryInterface.changeColumn('Users', 'username', {
                type: Sequelize.DataTypes.STRING,
                allowNull: false,
                unique: false
            }, { transaction });
            await transaction.commit();
        } catch(error) {
            await transaction.rollback();
            throw error;
        }
    }
};