'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('academy', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      sports_center_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'sports_centers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      court_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'courts',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      coach_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'coach',
          key: 'id'
        }
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      session_activity: {
        type: Sequelize.STRING,
        allowNull: false
      },
      session_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      session_duration: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      num_of_players: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      activity_date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      end_registration_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      category: {
        type: Sequelize.STRING,
        allowNull: true
      },
      academy_type: {
        type: Sequelize.STRING,
        allowNull: true
      },
      cover_image: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      availability_status: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },

      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('academy');
  }
};

