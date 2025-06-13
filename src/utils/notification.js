const admin = require('../config/firebase');

/**
 * Send push notification to one or multiple FCM tokens.
 * @param {string|string[]} fcmTokens - A single FCM token or an array of tokens
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Optional custom data
 */
const sendPushNotification = async (fcmTokens, title, body, data = {}) => {
    const notification = {
        title,
        body,
    };

    if (Array.isArray(fcmTokens)) {
        // Multicast (up to 500 tokens)
        const message = {
            notification,
            data,
            tokens: fcmTokens,
        };

        try {
            const response = await admin.messaging().sendMulticast(message);
            console.log('Multicast response:', response);
            return {
                success: true,
                successCount: response.successCount,
                failureCount: response.failureCount,
                responses: response.responses,
            };
        } catch (error) {
            console.error('Error sending multicast message:', error);
            return { success: false, error };
        }

    } else {
        // Single message
        const message = {
            token: fcmTokens,
            notification,
            data,
        };

        try {
            const response = await admin.messaging().send(message);
            console.log('Successfully sent message:', response);
            return { success: true, response };
        } catch (error) {
            console.error('Error sending message:', error);
            return { success: false, error };
        }
    }
};

module.exports = sendPushNotification;
