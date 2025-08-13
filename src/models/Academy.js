const { Sequelize, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Academy = sequelize.define('Academy', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        sports_center_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'sports_centers',
                key: 'id'
            }
        },
        // court_id: {
        //     type: DataTypes.INTEGER,
        //     allowNull: false,
        //     references: {
        //         model: 'courts',
        //         key: 'id'
        //     }
        // },

        coach_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'coach',
                key: 'id'
            }
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,

        },
        description: {
            type: DataTypes.TEXT,
            allowNull: false,

        },
        session_activity: {
            type: DataTypes.STRING, // paddle, snooker, darts
            allowNull: false,
        },
        session_price: {
            type: DataTypes.DECIMAL(10, 2), // Price field with 2 decimal places
            allowNull: false,
        },
        session_duration: {
            type: DataTypes.INTEGER, // e.g 60 mins
            allowNull: false,
        },
        num_of_players: {
            type: DataTypes.INTEGER, // e.g 4 
            allowNull: false,
        },
        activity_date: {
            type: DataTypes.DATE, // Stores full date and time: YYYY-MM-DD HH:mm:ss
            allowNull: false
        },
        time_slot: {
            type: DataTypes.STRING,
            allowNull: false,

        },
        end_registration_date: {
            type: DataTypes.DATE, // Stores full date and time: YYYY-MM-DD HH:mm:ss/
            allowNull: true
        },
        category: {
            type: DataTypes.STRING, // open, membership
            allowNull: true,
        },

        academy_type: {
            type: DataTypes.STRING, // public class, private class
            allowNull: true,
        },

        cover_image: {
            type: DataTypes.TEXT,
            allowNull: false,
        },

        availability_status: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        },


    }, {
        tableName: 'academy',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    });

    Academy.associate = function (models) {
        // Each BookingHistory belongs to one Court.
        Academy.belongsTo(models.SportsCenter, {
            foreignKey: 'sports_center_id',
            as: 'sportsCenter'
        });

        // Academy.belongsTo(models.Court, {
        //     foreignKey: 'court_id',
        //     as: 'court'
        // });


        Academy.belongsTo(models.Coach, {
            foreignKey: 'coach_id',
            as: 'coach'
        });

        Academy.hasMany(models.AcademyStudents, {
            foreignKey: 'academy_id',
            as: 'academy_students'
        });

    };

    return Academy;
};
