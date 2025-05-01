'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('youtube_tutorial', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      video_title: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      youtube_url: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      video_duration: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      upload_date: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      cover_image: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('youtube_tutorial');
  }
};
