const { Sequelize, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Transaction = sequelize.define('Transaction', {
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
            onDelete: 'CASCADE',
        },

        reference: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true,
        },
        amount: {
            type: DataTypes.FLOAT,
            allowNull: false,
        },
        purpose: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM('pending', 'success', 'failed'),
            allowNull: false,
            defaultValue: 'pending',
        },
        method: {
            type: DataTypes.STRING, // e.g., 'paystack'
            allowNull: true,
        },
        currency: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: 'NGN',
        },

    }, {
        tableName: 'transactions',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    });

    Transaction.associate = (models) => {

        // Optional: associate directly with User
        Transaction.belongsTo(models.User, {
            foreignKey: 'user_id',
            as: 'user',
        });
    };

    return Transaction;
};
