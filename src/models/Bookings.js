const { Sequelize, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Bookings = sequelize.define('Bookings', {
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
        court_id: {
            type: DataTypes.INTEGER,
            allowNull: false,

            references: {
                model: 'courts',
                key: 'id'
            }
        },
        sports_center_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'SportsCenter',
                key: 'id'
            }
        },
        booking_reference: {
            type: DataTypes.STRING,
            allowNull: false,

        },
        date: {
            type: DataTypes.DATEONLY, // Stores date in YYYY-MM-DD format
            allowNull: false
        },
        slot: {
            type: DataTypes.STRING, // e.g., "10:30 AM"
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM('confirmed', 'cancelled', 'pending', 'elapsed'),
            allowNull: false,
            defaultValue: 'pending'
        }
    }, {
        tableName: 'bookings',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    });

    Bookings.associate = function (models) {

        Bookings.belongsTo(models.SportsCenter, {
            foreignKey: 'sports_center_id',
            as: 'sportsCenter'
        });

        // Each BookingHistory belongs to one Court.
        Bookings.belongsTo(models.Court, {
            foreignKey: 'court_id',
            as: 'court'
        });

        Bookings.belongsTo(models.User, {
            foreignKey: 'user_id',
            as: 'user'
        });
    };

    return Bookings;
};
