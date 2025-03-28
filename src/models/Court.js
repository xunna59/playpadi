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
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'The type of activity for which the court is designed'
        },

        sports_center_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: 'Foreign key referencing the associated sports center'
        },
        booking_info: {
            type: DataTypes.JSON, // Store booked slots and other booking-related info
            allowNull: false,
            defaultValue: { booked_slots: [] } // Default empty array
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
    };

    return Court;
};
