const { Sequelize, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Notification = sequelize.define('Notification', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        type: {
            type: DataTypes.ENUM('personal', 'general'),
            allowNull: false,
            defaultValue: 'personal',
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        data: {
            type: DataTypes.JSON,
            allowNull: true,
        },
    }, {
        tableName: 'notifications',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    });

    Notification.associate = (models) => {
        Notification.belongsToMany(models.User, {
            through: models.UserNotification,
            foreignKey: 'notification_id',
            as: 'recipients',
        });
    };

    return Notification;
};
