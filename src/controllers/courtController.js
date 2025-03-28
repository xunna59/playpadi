const { SportsCenter, Court } = require('../models');

const moment = require("moment");

const generateTimeSlots = () => {
    const startHour = 9;  // 9:00 AM
    const endHour = 19;   // 7:00 PM
    const interval = 30;  // 30-minute intervals
    const daysToGenerate = 90;  // Next 3 months
    const slots = [];

    for (let i = 0; i < daysToGenerate; i++) {
        const date = moment().add(i, 'days');
        if (date.day() === 1) continue; // Skip Mondays (Monday = 1 in moment.js)

        for (let hour = startHour; hour < endHour; hour++) {
            const ampmHour = hour > 12 ? hour - 12 : hour;
            const period = hour >= 12 ? "PM" : "AM";

            slots.push({
                date: date.format('YYYY-MM-DD'), // Store in YYYY-MM-DD format
                slot: `${ampmHour}:00 ${period}`
            });

            slots.push({
                date: date.format('YYYY-MM-DD'),
                slot: `${ampmHour}:30 ${period}`
            });
        }
    }

    return slots;
};


const courtController = {
    getCourtSlots: async (req, res, next) => {
        try {
            const sportsCenterId = req.params.id;
            const sportsCenter = await SportsCenter.findByPk(sportsCenterId);

            if (!sportsCenter) {
                return res.status(404).json({ message: 'Sports center not found' });
            }

            console.log("Booking Info from DB:", sportsCenter.booking_info);

            const bookingInfo = sportsCenter.booking_info || { booked_slots: [] };
            const allTimeSlots = generateTimeSlots();

            // Extract booked slots (ensure it's an array)
            const bookedSlots = Array.isArray(bookingInfo.booked_slots) ? bookingInfo.booked_slots : [];

            // Mark available/unavailable slots
            const formattedSlots = allTimeSlots.map(slotObj => ({
                slot: slotObj, // Keep { date, slot } format
                status: bookedSlots.some(b => b.date === slotObj.date && b.slot === slotObj.slot) ? "unavailable" : "available"
            }));

            return res.json({ formattedSlots });

        } catch (error) {
            next(error);
        }
    },

    getAvailableCourts: async (req, res, next) => {
        try {
            const { sportsCenterId, slot } = req.params;
            const { date } = req.query;

            if (!date || !moment(date, 'YYYY-MM-DD', true).isValid()) {
                return res.status(400).json({ message: "Invalid or missing date. Use format YYYY-MM-DD" });
            }

            const courts = await Court.findAll({ where: { sports_center_id: sportsCenterId } });

            if (!courts || courts.length === 0) {
                return res.status(404).json({ message: 'No courts found for this sports center' });
            }

            // Check which courts have this slot booked
            const availableCourts = courts.filter(court => {
                const bookedSlots = court.booking_info?.booked_slots || [];
                return !bookedSlots.some(b => b.date === date && b.slot === slot);
            });

            if (availableCourts.length === 0) {
                return res.status(404).json({ message: 'No courts available for this time slot' });
            }

            return res.json({ availableCourts });

        } catch (error) {
            next(error);
        }
    },


    // 🆕 Get all slots for a specific date
    getSlotsForDate: async (req, res, next) => {
        try {
            const sportsCenterId = req.params.id;
            const { date } = req.query;

            if (!date || !moment(date, 'YYYY-MM-DD', true).isValid()) {
                return res.status(400).json({ message: "Invalid or missing date. Use format YYYY-MM-DD" });
            }

            const sportsCenter = await SportsCenter.findByPk(sportsCenterId);

            if (!sportsCenter) {
                return res.status(404).json({ message: 'Sports center not found' });
            }

            // Ensure booking_info exists and booked_slots is always an array
            const bookingInfo = sportsCenter.booking_info || {};
            const bookedSlots = Array.isArray(bookingInfo.booked_slots) ? bookingInfo.booked_slots : [];

            const allTimeSlots = generateTimeSlots(date); // Ensure function name matches

            const formattedSlots = allTimeSlots.map(slot => ({
                date,
                slot,
                status: bookedSlots.some(b => b.date === date && b.slot === slot) ? "unavailable" : "available"
            }));

            return res.json({ date, formattedSlots });

        } catch (error) {
            next(error);
        }
    }

};
module.exports = courtController;
