const { Sequelize, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const User = sequelize.define('User', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        first_name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        last_name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true,
            },
        },
        phone: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true,
            validate: {
                isNumeric: true,
                len: [10, 15], // Phone number should be between 10 to 15 characters
            },
        },
        gender: {
            type: DataTypes.ENUM('male', 'female'),
            allowNull: true,

        },
        dob: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        bio: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        points: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0.00
        },
        account_type: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'standard',
        },
        subsription_status: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        preferences: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: {} // Stores user preferences dynamically
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        updated_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        }
    }, {
        tableName: 'users',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    });

    User.associate = (models) => {
        // User.hasOne(models.Cart, { foreignKey: 'user_id', as: 'cart' }); // User has one Cart
        User.hasMany(models.Bookings, { foreignKey: 'user_id', as: 'bookings' }); // User has many Orders
    };

    return User;
};
