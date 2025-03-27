const { Sequelize, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Court = sequelize.define('Court', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        court_name: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'Name or identifier for the court'
        },
        activity: {
            // An ENUM restricts courts to specific activities.
            type: DataTypes.ENUM('paddle tennis', 'swimming', 'gym'),
            allowNull: false,
            comment: 'The type of activity for which the court is designed'
        },
        booking_info: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'JSON object containing booking details (available_slots and booked_slots)'
            // Example structure:
            // {
            //   available_slots: ["09:00", "09:30", "10:00"],
            //   booked_slots: [
            //      { slot: "09:30", bookedBy: "user123", bookingDate: "2025-04-01T09:30:00.000Z" }
            //   ]
            // }
        },
        sports_center_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: 'Foreign key referencing the associated sports center'
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
        // A Court has many BookingHistory records.
        Court.hasMany(models.Bookings, {
            foreignKey: 'court_id',
            as: 'bookings'
        });
    };

    return Court;
};
