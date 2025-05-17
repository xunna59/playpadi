const { Sequelize, DataTypes } = require('sequelize');

module.exports = (sequelize) => {

    const Faqs = sequelize.define(
        'Faqs',

        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            question: {
                type: DataTypes.TEXT,
                allowNull: false,

            },
            answer: {
                type: DataTypes.TEXT,
                allowNull: false,
            },

        },
        {
            tableName: 'faqs',
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
        }
    );

    return Faqs;
};