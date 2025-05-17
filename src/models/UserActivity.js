const { Sequelize, DataTypes } = require('sequelize');

module.exports = (sequelize) => {

    const UserActivity = sequelize.define('UserActivity', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        activity_type: {
            type: DataTypes.STRING,
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        ip_address: {
            type: DataTypes.STRING,
            allowNull: true
        },
        device: {
            type: DataTypes.STRING,
            allowNull: true
        },

    }, {
        tableName: 'user_activities',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',

    });

    UserActivity.associate = (models) => {
        UserActivity.belongsTo(models.User, {
            foreignKey: 'user_id',
            as: 'user'
        });
    };

    return UserActivity;
};