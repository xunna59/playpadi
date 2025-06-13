'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      first_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      last_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true,
      },
      gender: {
        type: Sequelize.ENUM('male', 'female'),
        allowNull: true,
      },
      dob: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      bio: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      points: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
      },
      account_type: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'standard',
      },
      subscription_status: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      preferences: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: () => ({
          best_hand: 'not set',
          court_position: 'not set',
          match_type: 'not set',
          play_time: 'not set'
        })
      },
      interests: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: () => ({
          player_interests: 'not set'
        })
      },
      display_picture: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      user_type: {
        type: Sequelize.STRING, // e.g., 'User', 'Admin', 'System'
        allowNull: false,
        defaultValue: 'User',
      },
      fcm_token: {
        type: Sequelize.TEXT,
        allowNull: true,

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
    await queryInterface.dropTable('users');
  }
};
