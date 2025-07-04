const { Sequelize, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const PaymentAuthorizationToken = sequelize.define(
        'PaymentAuthorizationToken',
        {
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
            token: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
            },
            last_four: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            cardType: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            expMonth: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            expYear: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
        },
        {
            tableName: 'authorization_tokens',
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
        }
    );

    return PaymentAuthorizationToken;
};
