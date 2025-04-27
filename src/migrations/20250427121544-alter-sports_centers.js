'use strict';

/** @type {import('sequelize-cli').Migration} */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('sports_centers', 'session_price', {
      type: Sequelize.DECIMAL(10, 2),  // Price with 2 decimal places
      allowNull: false,                // It cannot be null
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('sports_centers', 'session_price');
  }
};

