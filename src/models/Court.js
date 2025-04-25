const { Sequelize, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Court = sequelize.define('Court', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        sports_center_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        court_name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        court_location: {
            type: DataTypes.ENUM('Indoor', 'Outdoor'),
            allowNull: false,
        },
        court_type: {
            type: DataTypes.STRING, // court, table, board
            allowNull: false,
        },
        activity: {
            type: DataTypes.STRING, // paddle, snooker, darts
            allowNull: false,
        },
        session_price: {
            type: DataTypes.DECIMAL(10, 2), // Price field with 2 decimal places
            allowNull: false,
        },
        session_duration: {
            type: DataTypes.INTEGER, // e.g 60 mins
            allowNull: false,
        },
        court_position: {
            type: DataTypes.STRING, // left, right, center, n/a
            allowNull: false,
        },
        booking_info: {
            type: DataTypes.JSON, // Store booked slots and other booking-related info
            allowNull: false,
            defaultValue: { booked_slots: [] }
        },
        status: {
            type: DataTypes.ENUM('available', 'unavailable'),
            allowNull: false,
            defaultValue: 'available'
        }
    }, {
        tableName: 'courts',
        timestamps: true
    });

    Court.associate = function (models) {
        // Each Court belongs to one SportsCenter.
        Court.belongsTo(models.SportsCenter, {
            foreignKey: 'sports_center_id',
            as: 'sportsCenter'
        });

        Court.hasMany(models.Bookings, {
            foreignKey: 'court_id',
            as: 'bookings'
        });

        Court.hasMany(models.Academy, {
            foreignKey: 'court_id',
            as: 'academy'
        });
    };

    return Court;
};
