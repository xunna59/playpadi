const { Sequelize, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const BookingPlayers = sequelize.define('BookingPlayers', {
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

        bookings_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'bookings',
                key: 'id'
            }
        },


    }, {
        tableName: 'booking_players',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    });

    BookingPlayers.associate = function (models) {

        BookingPlayers.belongsTo(models.Bookings, {
            foreignKey: 'bookings_id',
            as: 'bookings'
        });

        BookingPlayers.belongsTo(models.User, {
            foreignKey: 'user_id',
            as: 'user'
        });
    };

    return BookingPlayers;
};
