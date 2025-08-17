const { Sequelize, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Admin = sequelize.define('Admin', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        username: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false,
            validate: {
                isEmail: true,
            },
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        role: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'admin',
        },
    }, {

        tableName: 'admins',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    });


    Admin.associate = (models) => {

        Admin.hasMany(models.Bookings, { foreignKey: 'user_id', as: 'bookings' });


    };

    return Admin;
};
