const cron = require("node-cron");
const { Bookings } = require("../models");
const { Op, literal } = require("sequelize");

// Run every 5 minutes
cron.schedule("*/5 * * * *", async () => {
    try {
        const graceMinutes = 5;

        const [affectedCount] = await Bookings.update(
            { status: "elapsed" },
            {
                where: {
                    status: "pending",
                    booking_type: "private",
                    [Op.and]: [
                        literal(`
              NOW() > (
                STR_TO_DATE(CONCAT(date, ' ', slot), '%Y-%m-%d %h:%i %p')
                + INTERVAL session_duration MINUTE
                + INTERVAL ${graceMinutes} MINUTE
              )
            `),
                    ],
                },
            }
        );

        if (affectedCount > 0) {
            console.log(`[CRON] Marked ${affectedCount} bookings as elapsed`);
        } else {
            console.log("[CRON] No expired bookings to mark");
        }
    } catch (err) {
        console.error("[CRON] Error expiring bookings:", err);
    }
});
