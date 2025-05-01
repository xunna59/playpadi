const { Sequelize, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const YoutubeTutorial = sequelize.define('YoutubeTutorial', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },

        video_title: {
            type: DataTypes.STRING,
            allowNull: false,

        },
        youtube_url: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        video_duration: {
            type: DataTypes.STRING,
            allowNull: false,
        },

        upload_date: {
            type: DataTypes.STRING,
            allowNull: false,
        },

        cover_image: {
            type: DataTypes.TEXT,
            allowNull: false,
        },


    }, {
        tableName: 'youtube_tutorial',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    });



    return YoutubeTutorial;
};
