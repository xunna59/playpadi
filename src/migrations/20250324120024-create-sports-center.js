'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('sports_centers', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.INTEGER,
        autoIncrement: true,
      },
      sports_center_name: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Full name of sports center'
      },
      sports_center_address: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Full address text for mobile map preview'
      },
      website: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      latitude: {
        type: Sequelize.DOUBLE,
        allowNull: true,
        comment: 'Latitude for geolocation'
      },
      longitude: {
        type: Sequelize.DOUBLE,
        allowNull: true,
        comment: 'Longitude for geolocation'
      },
      sports_center_features: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Array of features associated with the center (stored as JSON)'
      },
      sports_center_games: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Array of games associated with the center (stored as JSON)'
      },
      openingHours: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: {
          Tuesday: { open: "10:00 AM", close: "06:00 PM" },
          Wednesday: { open: "10:00 AM", close: "06:00 PM" },
          Thursday: { open: "10:00 AM", close: "06:00 PM" },
          Friday: { open: "10:00 AM", close: "06:00 PM" },
          Saturday: { open: "09:00 AM", close: "02:00 PM" },
          Sunday: { open: "10:00 AM", close: "04:00 PM" }
        },
        comment: 'JSON object holding opening and closing times per day (excluding Monday) in 12-hour format'
      },
      sports_center_description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Full name of sports center'
      },
      sports_center_status: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      booking_info: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'JSON object containing booking details (available_slots and booked_slots)'
      },
      cover_image: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      session_price: {
        type: Sequelize.DECIMAL(10, 2), // Price field with 2 decimal places
        allowNull: false,
      },

      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('sports_centers');
  }
};
