const { Sequelize, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const FavouriteSportsCenter = sequelize.define('FavouriteSportsCenter', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'users',
                key: 'id',
            },
        },
        sports_center_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'sports_centers',
                key: 'id',
            },
        },

    }, {
        tableName: 'favourite_sports_centers',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    });

    FavouriteSportsCenter.associate = (models) => {

        FavouriteSportsCenter.belongsTo(models.User, {
            foreignKey: 'user_id',
            constraints: false,
            as: 'user'
        });

        FavouriteSportsCenter.belongsTo(models.SportsCenter, {
            foreignKey: 'sports_center_id',
            constraints: false,
            as: 'sportsCenterSaved'
        });

    };


    return FavouriteSportsCenter;
};
