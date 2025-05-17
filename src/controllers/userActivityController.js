const { UserActivity } = require('../models');
const { addJob } = require('../utils/activityQueue');

const getClientIp = (req) => {
    return req?.headers['x-forwarded-for']?.split(',')[0]?.trim() || req?.ip || null;
};

const getUserAgent = (req) => {
    return req?.headers['user-agent'] || null;
};

const UserActivityController = {
    log: async (params = {}, req = null) => {
        const {
            user_id,
            activity_type,
            description = '',
            ip_address,
            device,
        } = params;

        if (!user_id || !activity_type) {
            console.warn('UserActivityController.log missing required fields');
            return;
        }

        const final_ip = ip_address || getClientIp(req);
        const final_device = device || getUserAgent(req);

        // Push to queue for async handling
        addJob(async () => {
            try {
                await UserActivity.create({
                    user_id,
                    activity_type,
                    description,
                    ip_address: final_ip,
                    device: final_device,
                });
            } catch (err) {
                console.error('Failed to log user activity:', err.message);
            }
        });
    },
};

module.exports = UserActivityController;
