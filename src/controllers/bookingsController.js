const { Bookings, Court, User, SportsCenter, BookingPlayers } = require('../models');

function generateBookingReference() {
    const prefix = 'BK';
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
    const random = Math.floor(1000 + Math.random() * 9000); // 4-digit random
    return `${prefix}-${date}-${random}`;
}

const bookingsController = {

    renderAllBookings: async (req, res, next) => {
        try {
            const page = parseInt(req.query.page, 10) || 1;
            const limit = 5;
            const offset = (page - 1) * limit;

            const { count, rows: bookings } = await Bookings.findAndCountAll({
                limit,
                offset,
                order: [['created_at', 'DESC']],
                include: [
                    { model: Court, as: 'court' },
                    { model: User, as: 'user' }
                ]
            });


            const totalPages = Math.ceil(count / limit);



            return res.render('bookings/index', {
                title: 'Manage Bookings',
                admin: req.admin,
                bookings,
                count,
                currentPage: page,
                totalPages,
                limit,
                offset,
            });
        } catch (error) {
            next(error);
        }
    },


    apiBookingById: async (req, res, next) => {
        try {
            const booking = await Bookings.findByPk(req.params.id, {
                include: [
                    { model: User, as: 'user' },
                    { model: Court, as: 'court' },
                    { model: SportsCenter, as: 'sportsCenter' }
                ]
            });

            if (!booking) {
                return res.status(404).json({ message: 'Booking not found' });
            }

            return res.status(200).json(booking);
        } catch (error) {
            console.error(error);
            next(error);
        }
    },


    apiCreateBooking: async (req, res, next) => {
        try {
            const {
                date,
                slot,
                gender_allowed,
                booking_type,
                game_type
            } = req.body;

            const { id: user_id } = req.user;

            const user_type = req.user.user_type;

            const { court_id, sports_center_id } = req.params;

            const court = await Court.findByPk(court_id);
            if (!court) {
                return res.status(404).json({ message: 'Court not found' });
            }

            const sportsCenter = await SportsCenter.findByPk(sports_center_id);
            if (!sportsCenter) {
                return res.status(404).json({ message: 'Sports center not found' });
            }

            const existingBooking = await Bookings.findOne({
                where: {
                    date,
                    slot,
                    game_type
                }
            });

            if (existingBooking) {
                return res.status(409).json({
                    message: 'A booking already exists for this date, slot, and game type'
                });
            }

            const booking_reference = generateBookingReference();

            const booking = await Bookings.create({
                user_id,
                court_id,
                sports_center_id,
                booking_reference,
                date,
                slot,
                gender_allowed,
                booking_type,
                user_type,
                game_type
            });

            await BookingPlayers.create({
                user_id,
                bookings_id: booking.id
            });

            return res.status(201).json({ message: 'Booking created successfully', booking });
        } catch (error) {
            console.error(error);
            next(error);
        }
    },



    apiUpdateBooking: async (req, res, next) => {
        try {
            const { id } = req.params;
            const updated = await Bookings.update(req.body, {
                where: { id }
            });

            if (updated[0] === 0) {
                return res.status(404).json({ message: 'Booking not found or no changes made' });
            }

            return res.status(200).json({ message: 'Booking updated successfully' });
        } catch (error) {
            console.error(error);
            next(error);
        }
    },



}

module.exports = bookingsController;