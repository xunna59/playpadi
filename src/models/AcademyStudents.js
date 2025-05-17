const { Sequelize, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const AcademyStudents = sequelize.define('AcademyStudents', {
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

        academy_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'academy',
                key: 'id'
            }
        },


    }, {
        tableName: 'academy_students',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    });

    AcademyStudents.associate = function (models) {

        AcademyStudents.belongsTo(models.Academy, {
            foreignKey: 'academy_id',
            as: 'academy'
        });

        AcademyStudents.belongsTo(models.User, {
            foreignKey: 'user_id',
            as: 'user'
        });
    };

    return AcademyStudents;
};
