const { Court } = require('../models');


const courtController = {


    getCourtSlots: async (req, res, next) => {
        try {
            const courtId = req.params.id;
            const court = await Court.findByPk(courtId);
            if (!court) {
                return res.status(404).json({ message: 'Court not found' });
            }
            const bookingInfo = court.booking_info || { available_slots: [], booked_slots: [] };
            return res.json(bookingInfo);
        } catch (error) {
            next(error);
        }
    },


    bookCourtSlot: async (req, res, next) => {
        try {
            const courtId = req.params.id;
            const { slot, bookedBy } = req.body;
            if (!slot) {
                return res.status(400).json({ message: 'Slot is required' });
            }
            const court = await Court.findByPk(courtId);
            if (!court) {
                return res.status(404).json({ message: 'Court not found' });
            }

            // Retrieve current booking_info from the database
            let bookingInfo = court.booking_info || { available_slots: [], booked_slots: [] };
            let availableSlots = bookingInfo.available_slots || [];
            let bookedSlots = bookingInfo.booked_slots || [];

            // Check if the requested slot is available
            if (!availableSlots.includes(slot)) {
                return res.status(400).json({ message: 'Slot not available' });
            }

            // Remove the slot from availableSlots
            availableSlots = availableSlots.filter(s => s !== slot);

            // Add to bookedSlots
            bookedSlots.push({
                slot,
                bookedBy: bookedBy || 'Anonymous',
                bookingDate: new Date().toISOString()
            });

            // Update bookingInfo and save
            bookingInfo.available_slots = availableSlots;
            bookingInfo.booked_slots = bookedSlots;
            await court.update({ booking_info: bookingInfo });

            return res.json({
                message: 'Slot booked successfully',
                booking_info: bookingInfo
            });
        } catch (error) {
            next(error);
        }
    }





}

module.exports = courtController;
