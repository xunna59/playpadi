'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('bookings', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,

      },
      court_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'courts',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      sports_center_id: {
        type: Sequelize.INTEGER,
        allowNull: false,

      },
      session_price: {
        type: Sequelize.DECIMAL(10, 2), // Price field with 2 decimal places
        allowNull: false,
      },
      session_duration: {
        type: Sequelize.INTEGER, // e.g 60 mins
        allowNull: false,
      },
      booking_reference: {
        type: Sequelize.STRING,
        allowNull: false,

      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      slot: {
        type: Sequelize.STRING,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('confirmed', 'cancelled', 'pending', 'elapsed'),
        allowNull: false,
        defaultValue: 'pending'
      },
      gender_allowed: {
        type: Sequelize.STRING, // e.g., male, female, mixed 
        allowNull: false
      },
      booking_type: {
        type: Sequelize.STRING, // e.g., private, public, academy
        allowNull: false
      },
      user_type: {
        type: Sequelize.STRING, // e.g., User, System
        allowNull: false
      },
      game_type: {
        type: Sequelize.STRING, // e.g., padle, dart, snooker
        allowNull: false
      },
      total_players: {
        type: Sequelize.INTEGER, // 4 for padel, 2 for snooker and dart
        allowNull: false
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
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('bookings');
  }
};
