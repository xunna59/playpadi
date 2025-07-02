const { SportsCenter, Court, Bookings } = require('../models');

const dayjs = require("dayjs");

const generateTimeSlots = (daysToGenerate) => {
    const startHour = 9;   // 9:00 AM
    const endHour = 19;    // 7:00 PM
    const interval = 30;   // 30-minute intervals
    //  const daysToGenerate = 90;  // Next 3 months
    const slots = [];

    for (let i = 0; i < daysToGenerate; i++) {
        const date = dayjs().add(i, 'day');
        if (date.day() === 1) continue; // Skip Mondays

        const availableTimes = [];

        for (let hour = startHour; hour < endHour; hour++) {
            for (let minute = 0; minute < 60; minute += interval) {
                const time = date.hour(hour).minute(minute);
                const timeFormatted = time.format('h:mm A'); // 12-hour format with AM/PM
                availableTimes.push(timeFormatted);
            }
        }

        slots.push({
            weekday: date.format('ddd').toUpperCase(), // 'TUE'
            day: date.format('DD'),                    // '04'
            month: date.format('MMM'),                 // 'Feb'
            date: date.format('YYYY-MM-DD'),           // '2025-02-04'
            availableTimes: availableTimes
        });
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


    getSlots: async (req, res, next) => {
        try {
            const sportsCenterId = req.params.id;
            const sports_center = await SportsCenter.findByPk(sportsCenterId);
            if (!sports_center) {
                return res.status(404).json({ message: "Sports Center not found" });
            }

            const userId = req.user.id;
            const user = await User.findByPk(userId); // Make sure you fetch user details

            let daysToGenerate = 7; // Default to standard (1 week)

            const accountType = (user.account_type || '').toLowerCase();

            if (accountType === 'premium') {
                daysToGenerate = 90; // 3 months for premium
            } else if (accountType === 'standard') {
                daysToGenerate = 30; // 1 month for standard
            }

            const days = generateTimeSlots(daysToGenerate);

            // 2) fetch all actual bookings for this court
            const bookings = await Bookings.findAll({
                where: { sports_center_id: sportsCenterId },
                attributes: ["date", "slot"]
            });
            const bookedSlots = new Set(
                bookings.map(b => `${b.date}#${b.slot}`)   // e.g. "2025-05-11#09:00"
            );

            // 3) for each day, map its availableTimes → times: [{time,status},…]
            const slots = days.map(dayObj => {
                const { weekday, day, month, date, availableTimes } = dayObj;

                const times = availableTimes.map(time => {
                    const key = `${date}#${time}`;           // must match how you stored slot in DB
                    return {
                        time,
                        status: bookedSlots.has(key)
                            ? "unavailable"
                            : "available"
                    };
                });

                return { weekday, day, month, date, times };
            });

            // 4) send back the new per-day array
            return res.json({ slots });

        } catch (error) {
            next(error);
        }
    },


    getCourtSlots: async (req, res, next) => {
        try {
            const courtId = req.params.id;
            const court = await Court.findByPk(courtId);
            if (!court) {
                return res.status(404).json({ message: "Court not found" });
            }

            const userId = req.user.id;
            const user = await User.findByPk(userId); // Make sure you fetch user details

            let daysToGenerate = 7; // Default to standard (1 week)

            const accountType = (user.account_type || '').toLowerCase();

            if (accountType === 'premium') {
                daysToGenerate = 90; // 3 months for premium
            } else if (accountType === 'standard') {
                daysToGenerate = 30; // 1 month for standard
            }

            const days = generateTimeSlots(daysToGenerate);

            // 2) fetch all actual bookings for this court
            const bookings = await Bookings.findAll({
                where: { court_id: courtId },
                attributes: ["date", "slot"]
            });
            const bookedSlots = new Set(
                bookings.map(b => `${b.date}#${b.slot}`)   // e.g. "2025-05-11#09:00"
            );

            // 3) for each day, map its availableTimes → times: [{time,status},…]
            const slots = days.map(dayObj => {
                const { weekday, day, month, date, availableTimes } = dayObj;

                const times = availableTimes.map(time => {
                    const key = `${date}#${time}`;           // must match how you stored slot in DB
                    return {
                        time,
                        status: bookedSlots.has(key)
                            ? "unavailable"
                            : "available"
                    };
                });

                return { weekday, day, month, date, times };
            });

            // 4) send back the new per-day array
            return res.json({ slots });

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

            const bookingInfo = sportsCenter.booking_info || {};
            const bookedSlots = Array.isArray(bookingInfo.booked_slots) ? bookingInfo.booked_slots : [];

            const allTimeSlots = generateTimeSlots(date);

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

            const { court_name, court_location, court_type, activity, court_position, court_price_duration } = req.body;

            // Validate required fields
            if (!court_name || !court_location || !court_type || !activity || !court_position) {
                return res.status(400).json({ message: "All fields are required" });
            }

            const sportsCenter = await SportsCenter.findByPk(sports_center_id);

            if (!sportsCenter) {
                return res.status(404).json({ message: 'Sports center not found' });
            }

            //      const court_price_duration = JSON.parse(req.body.court_price_duration);

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
                court_data: court_price_duration
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
