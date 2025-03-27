const { Sequelize, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const SportsCenter = sequelize.define('SportsCenter', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        sports_center_name: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'Full name of sports center'
        },
        sports_center_address: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'Full address text for mobile map preview'
        },
        latitude: {
            type: DataTypes.DOUBLE,
            allowNull: true,
            comment: 'Latitude for geolocation'
        },
        longitude: {
            type: DataTypes.DOUBLE,
            allowNull: true,
            comment: 'Longitude for geolocation'
        },
        sports_center_features: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Array of features associated with the center (stored as JSON)'
        },
        sports_center_games: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Array of games associated with the center (stored as JSON)'
        },
        openingHours: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: {
                Tuesday: { open: "10:00 AM", close: "06:00 PM" },
                Wednesday: { open: "10:00 AM", close: "06:00 PM" },
                Thursday: { open: "10:00 AM", close: "06:00 PM" },
                Friday: { open: "10:00 AM", close: "06:00 PM" },
                Saturday: { open: "09:00 AM", close: "02:00 PM" },
                Sunday: { open: "10:00 AM", close: "04:00 PM" }
            },
            comment: 'JSON object holding opening and closing times per day (excluding Monday) in 12-hour format'
        },
        sports_center_description: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Full name of sports center'
        },
        sports_center_status: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        },
    }, {
        tableName: 'sports_centers',
        timestamps: true
    });

    SportsCenter.associate = function (models) {
        // A SportsCenter has many Courts.
        SportsCenter.hasMany(models.Court, {
            foreignKey: 'sports_center_id',
            as: 'courts'
        });
    };


    return SportsCenter;
};