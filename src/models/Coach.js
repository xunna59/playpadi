const { Sequelize, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Coach = sequelize.define('Coach', {
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

        },
        gender: {
            type: DataTypes.ENUM('male', 'female'),
            allowNull: true,

        },
        address: {
            type: DataTypes.TEXT,
            allowNull: true,
        },

        display_picture: {
            type: DataTypes.TEXT,
            allowNull: true,
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
        tableName: 'coach',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    });

    Coach.associate = (models) => {
        // Coach.hasMany(models.Bookings, { foreignKey: 'user_id', as: 'bookings' });

    };

    return Coach;
};
