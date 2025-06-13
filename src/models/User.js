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
        subscription_status: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        preferences: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: () => ({
                best_hand: 'not set',
                court_position: 'not set',
                match_type: 'not set',
                play_time: 'not set'
            })
        },
        interests: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: () => ({
                player_interests: 'not set'
            })
        },


        display_picture: {
            type: DataTypes.JSON,
            allowNull: true,
        },
        user_type: {
            type: DataTypes.STRING, // e.g., 'User', 'Admin', 'System'
            allowNull: false,
            defaultValue: 'User',
        },

        fcm_token: {
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
        tableName: 'users',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    });

    User.associate = (models) => {
        // User.hasOne(models.Cart, { foreignKey: 'user_id', as: 'cart' }); // User has one Cart
        User.hasMany(models.Bookings, { foreignKey: 'user_id', as: 'bookings' });
        User.hasMany(models.BookingPlayers, { foreignKey: 'user_id', as: 'bookingplayers' });
        //    User.hasMany(models.Notifications, { foreignKey: 'user_id', as: 'notifications' });
        User.hasMany(models.AcademyStudents, { foreignKey: 'user_id', as: 'academy_students' });
        User.hasMany(models.FavouriteSportsCenter, {
            foreignKey: 'user_id',
            as: 'userFavouriteSportsCenter',
        });
        User.belongsToMany(models.Notification, {
            through: models.UserNotification,
            foreignKey: 'user_id',
            as: 'notifications',
        });

    };

    return User;
};
