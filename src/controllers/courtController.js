const { SportsCenter, Court, Bookings } = require('../models');

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

function generateReference(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let genreference = '';
    for (let i = 0; i < length; i++) {
        genreference += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return genreference;
}


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
    },

    createCourt: async (req, res, next) => {
        try {

            const sports_center_id = req.params.id;

            const { court_name, court_location, court_type, activity, court_position, session_duration, session_price } = req.body;

            // Validate required fields
            if (!court_name || !court_location || !court_type || !activity || !court_position || !session_duration || !session_price) {
                return res.status(400).json({ message: "All fields are required" });
            }

            const sportsCenter = await SportsCenter.findByPk(sports_center_id);

            if (!sportsCenter) {
                return res.status(404).json({ message: 'Sports center not found' });
            }

            // Validate court_location
            const validLocations = ['Indoor', 'Outdoor'];
            if (!validLocations.includes(court_location)) {
                return res.status(400).json({ message: "Invalid court location" });
            }

            // Create court
            const newCourt = await Court.create({
                court_name,
                court_location,
                court_type,
                activity,
                court_position,
                sports_center_id,
                session_duration,
                session_price
            });

            req.flash('success_msg', 'Court Created Successfully');
            return res.redirect(`/admin/sports-center/edit-sports-center/${sports_center_id}`);

            return res.status(201).json({ message: "Court created successfully", court: newCourt });

        } catch (error) {
            next(error);
        }
    },

    bookCourt: async (req, res, next) => {
        try {

            if (!req.user || !req.user.id) {
                return res.status(401).json({ message: "Unauthorized" });
            }

            const { courtId } = req.params;
            const userId = req.user.id;

            const { date, slot } = req.body;

            // Validate inputs
            if (!date || !slot) {
                return res.status(400).json({ message: "Date and Slot are required" });
            }

            if (!moment(date, "YYYY-MM-DD", true).isValid()) {
                return res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD" });
            }

            // Check if the court exists
            const court = await Court.findByPk(courtId);
            if (!court) {
                return res.status(404).json({ message: "Court not found" });
            }

            // Check if the slot is already booked
            const existingBooking = await Bookings.findOne({
                where: { court_id: courtId, date, slot, status: "confirmed" }
            });

            if (existingBooking) {
                return res.status(400).json({ message: "This slot is already booked" });
            }

            const reference_code = generateReference(8);
            // Create the booking
            const newBooking = await Bookings.create({
                user_id: userId,
                court_id: courtId,
                booking_reference: reference_code,
                date,
                slot,
                status: "confirmed"
            });


            //     // Safely parse the booking_info field
            // let bookingInfo = { booked_slots: [] };

            // try {
            //     // If court.booking_info exists, parse it
            //     if (court.booking_info) {
            //         bookingInfo = JSON.parse(court.booking_info);
            //     }
            // } catch (error) {
            //     console.error('Error parsing booking_info:', error);
            //     return res.status(500).json({ message: "Error parsing booking information" });
            // }

            // // Ensure `booked_slots` is an array
            // if (!Array.isArray(bookingInfo.booked_slots)) {
            //     bookingInfo.booked_slots = [];
            // }

            // // Check if the slot is already booked
            // const isAlreadyBooked = bookingInfo.booked_slots.some(
            //     (b) => b.date === date && b.slot === slot
            // );

            // if (isAlreadyBooked) {
            //     return res.status(400).json({ message: "Slot is already booked." });
            // }

            // // Add the new booking
            // bookingInfo.booked_slots.push({ date, slot });

            // // Convert back to a string before saving
            // await court.update({ booking_info: JSON.stringify(bookingInfo) });

            return res.status(201).json({
                message: "Court booked successfully",
                booking: newBooking
            });

        } catch (error) {
            next(error);
        }
    },

    getCourtsBySportsCenter: async (req, res, next) => {
        try {
            const sportsCenterId = req.params.sportsCenterId;
            const courts = await Court.findAll({
                where: { sports_center_id: sportsCenterId },
            });

            return res.json(courts);
        } catch (error) {
            next(error);
        }
    }


};
module.exports = courtController;
