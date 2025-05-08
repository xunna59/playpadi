'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('courts', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      sports_center_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'sports_centers', // Ensure this matches your SportsCenter table name
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      court_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      court_location: {
        type: Sequelize.ENUM('Indoor', 'Outdoor'),
        allowNull: false,
      },
      court_type: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      activity: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      // session_price: {
      //     type: DataTypes.DECIMAL(10, 2), // Price field with 2 decimal places
      //     allowNull: false,
      // },
      // session_duration: {
      //     type: DataTypes.INTEGER, // e.g 60 mins
      //     allowNull: false,
      // },
      court_data: {
        type: Sequelize.JSON,
        allowNull: false
      },
      court_position: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      booking_info: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: JSON.stringify({ booked_slots: [] }),
      },
      status: {
        type: Sequelize.ENUM('available', 'unavailable'),
        allowNull: false,
        defaultValue: 'available',
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('courts');
  }
};