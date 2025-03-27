'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('admins', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true, // Auto-incrementing ID
        allowNull: false,
      },
      username: {
        type: Sequelize.STRING,
        allowNull: false, // Username is required
      },
      email: {
        type: Sequelize.STRING,
        unique: true,     // Email should be unique
        allowNull: false, // Email is required
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false, // Password is required
      },
      role: {
        type: Sequelize.STRING,
        allowNull: false,    // Role is required
        defaultValue: 'admin', // Default value for the role
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false, // Automatically handled by Sequelize
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false, // Automatically handled by Sequelize
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('admins');
  }
};
