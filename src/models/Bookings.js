const { Sequelize, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Bookings = sequelize.define('Bookings', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        court_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: 'ID of the court that was booked',
            references: {
                model: 'courts',
                key: 'id'
            }
        },
        slot: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'Booked time slot, e.g., "09:00"'
        },
        booked_by: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'Identifier for the user or entity that booked the slot'
        },
        booking_date: {
            type: DataTypes.DATE,
            allowNull: false,
            comment: 'Date and time when the booking was made'
        }
    }, {
        tableName: 'bookings',
        timestamps: true
    });

    Bookings.associate = function (models) {
        // Each BookingHistory belongs to one Court.
        Bookings.belongsTo(models.Court, {
            foreignKey: 'court_id',
            as: 'court'
        });
    };

    return Bookings;
};
