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
        website: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        phone: {
            type: DataTypes.STRING,
            allowNull: true,
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
        booking_info: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'JSON object containing booking details (available_slots and booked_slots)',
            defaultValue: () => ({
                available_slots: [],
                booked_slots: []
            })
            // Example structure:
            // {
            //   available_slots: ["09:00", "09:30", "10:00"],
            //   booked_slots: [
            //      { slot: "09:30", bookedBy: "user123", bookingDate: "2025-04-01T09:30:00.000Z" }
            //   ]
            // }
        },
        cover_image: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        session_price: {
            type: DataTypes.DECIMAL(10, 2), // Price field with 2 decimal places
            allowNull: false,
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

        SportsCenter.hasMany(models.Academy, {
            foreignKey: 'sports_center_id',
            as: 'academy'
        });

        SportsCenter.hasMany(models.Bookings, {
            foreignKey: 'sports_center_id',
            as: 'sportsCenter'
        });

        SportsCenter.hasMany(models.FavouriteSportsCenter, {
            foreignKey: 'sports_center_id',
            as: 'savedSportsCenter',
        });

    };


    return SportsCenter;
};