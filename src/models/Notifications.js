const { Sequelize, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Notifications = sequelize.define('Notifications', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        },

        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },

        description: {
            type: DataTypes.TEXT,
            allowNull: false,
        },


    }, {
        tableName: 'notifications',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    });

    Notifications.associate = function (models) {



        Notifications.belongsTo(models.User, {
            foreignKey: 'user_id',
            as: 'user'
        });
    };

    return Notifications;
};
