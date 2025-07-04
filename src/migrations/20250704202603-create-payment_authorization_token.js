'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('authorization_tokens', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      token: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      last_four: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      cardType: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      expMonth: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      expYear: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('authorization_tokens');
  },
};
