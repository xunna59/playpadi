'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('courts', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      court_name: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Name or identifier for the court'
      },
      activity: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'The type of activity for which the court is designed'
      },

      sports_center_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'sports_centers', // Ensure this matches the actual table name
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'Foreign key referencing the associated sports center'
      },
      booking_info: {
        type: Sequelize.JSON, // Store booked slots and other booking-related info
        allowNull: false,
        defaultValue: { booked_slots: [] } // Default empty array
      },
      status: {
        type: Sequelize.ENUM('available', 'unavailable'),
        allowNull: false,
        defaultValue: 'available'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('courts');
  }
};
