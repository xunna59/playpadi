const { Sequelize, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const UserNotification = sequelize.define('UserNotification', {
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        notification_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        read_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    }, {
        tableName: 'user_notifications',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: false,
    });

    UserNotification.associate = (models) => {
        UserNotification.belongsTo(models.User, { foreignKey: 'user_id' });
        UserNotification.belongsTo(models.Notification, { foreignKey: 'notification_id' });
    };

    return UserNotification;
};
