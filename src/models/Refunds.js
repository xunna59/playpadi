const { Sequelize, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Refunds = sequelize.define('Refunds', {
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
                key: 'id',
            },
        },
        booking_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'bookings',
                key: 'id',
            },
        },
        booking_reference: {
            type: DataTypes.STRING,
            allowNull: false,

        },
        eligible: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        refund_amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0.00,
        },
        status: {
            type: DataTypes.ENUM('pending', 'approved', 'rejected', 'refunded'),
            allowNull: false,
            defaultValue: 'pending',
        },
        reason: {
            type: DataTypes.STRING,
            allowNull: true,
        },
    }, {
        tableName: 'refunds',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    });

    Refunds.associate = function (models) {
        Refunds.belongsTo(models.User, {
            foreignKey: 'user_id',
            as: 'user',
        });

        Refunds.belongsTo(models.Bookings, {
            foreignKey: 'booking_id',
            as: 'booking',
        });
    };

    return Refunds;
};
