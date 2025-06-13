const { Notification, UserNotification, User } = require('../models');

const NotificationController = {
    // Fetch all notifications for a user (both general and personal)
    getAllNotifications: async (req, res) => {
        try {
            const userId = req.user.id;

            // Fetch general notifications
            const generalNotifications = await Notification.findAll({
                where: { type: 'general' },
                order: [['created_at', 'DESC']],
                raw: true,
            });

            // Fetch personalized notifications with read status
            const personalNotifications = await Notification.findAll({
                include: [
                    {
                        model: User,
                        as: 'recipients',
                        where: { id: userId },
                        attributes: [],
                        through: {
                            attributes: ['read_at'],
                        },
                    },
                ],
                order: [['created_at', 'DESC']],
            });

            // Add read: false for general notifications
            const formattedGeneral = generalNotifications.map((n) => ({
                ...n,
                read: false,
            }));

            // Add read: true/false based on read_at for personal notifications
            const formattedPersonal = personalNotifications.map((n) => {
                const json = n.toJSON();
                const readAt = json.recipients?.[0]?.UserNotification?.read_at;
                return {
                    ...json,
                    read: !!readAt,
                };
            });

            const allNotifications = [...formattedGeneral, ...formattedPersonal];

            return res.status(200).json({
                success: true,
                message: 'Notifications fetched successfully.',
                notifications: allNotifications,
            });
        } catch (error) {
            console.error('Error fetching notifications:', error);
            return res.status(500).json({ error: 'An error occurred while fetching notifications.' });
        }
    },

    // Send a general notification
    createGeneralNotification: async (req, res) => {
        try {
            const { title, description, data } = req.body;

            const notification = await Notification.create({
                type: 'general',
                title,
                description,
                data,
            });

            return res.status(201).json({
                success: true,
                message: 'General notification created.',
                notification,
            });
        } catch (error) {
            console.error('Error creating general notification:', error);
            return res.status(500).json({ error: 'An error occurred while creating the notification.' });
        }
    },

    // Send a personal notification to specific users
    sendPersonalNotification: async (req, res) => {
        try {
            const { title, description, data, userIds } = req.body;

            if (!Array.isArray(userIds) || userIds.length === 0) {
                return res.status(400).json({ error: 'At least one user ID is required.' });
            }

            const notification = await Notification.create({
                type: 'personal',
                title,
                description,
                data,
            });

            const userNotificationRecords = userIds.map((userId) => ({
                user_id: userId,
                notification_id: notification.id,
            }));

            await UserNotification.bulkCreate(userNotificationRecords);

            return res.status(201).json({
                success: true,
                message: 'Personal notification sent.',
                notification,
            });
        } catch (error) {
            console.error('Error sending personal notification:', error);
            return res.status(500).json({ error: 'An error occurred while sending the notification.' });
        }
    },

    // Mark a notification as read
    markAsRead: async (req, res) => {
        try {
            const userId = req.user.id;
            const { notificationId } = req.params;

            const record = await UserNotification.findOne({
                where: { user_id: userId, notification_id: notificationId },
            });

            if (!record) {
                return res.status(404).json({ error: 'Notification not found or not assigned to this user.' });
            }

            record.read_at = new Date();
            await record.save();

            return res.status(200).json({
                success: true,
                message: 'Notification marked as read.',
            });
        } catch (error) {
            console.error('Error marking notification as read:', error);
            return res.status(500).json({ error: 'An error occurred while marking the notification as read.' });
        }
    },
};


module.exports = NotificationController;