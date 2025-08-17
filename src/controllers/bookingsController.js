const { Bookings, Court, User, SportsCenter, BookingPlayers, Refunds, Admin } = require('../models');
const UserActivityController = require('./userActivityController');
const sendEmail = require('../utils/sendEmail');
const { Op } = require('sequelize');
const dayjs = require('dayjs');
const customParseFormat = require('dayjs/plugin/customParseFormat');
dayjs.extend(customParseFormat);

function isRefundEligible(booking) {
    const matchDateTime = dayjs(`${booking.date} ${booking.slot}`, 'YYYY-MM-DD hh:mm A');
    const bookingTime = dayjs(booking.created_at);
    const now = dayjs();

    const daysBeforeMatch = matchDateTime.diff(bookingTime, 'day');

    if (daysBeforeMatch >= 7) {
        const latestCancelTime = matchDateTime.subtract(72, 'hour');
        return now.isBefore(latestCancelTime);
    } else {
        const latestCancelTime = matchDateTime.subtract(24, 'hour');
        return now.isBefore(latestCancelTime);
    }
}




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
                    { model: User, as: 'user', required: false },
                    { model: Admin, as: 'admin', required: false }
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
                game_type,
                session_price,
                session_duration
            } = req.body;

            const missingFields = [];

            if (!date) missingFields.push('date');
            if (!slot) missingFields.push('slot');
            if (!gender_allowed) missingFields.push('gender_allowed');
            if (!booking_type) missingFields.push('booking_type');
            if (!game_type) missingFields.push('game_type');
            if (!session_price) missingFields.push('session_price');
            if (!session_duration) missingFields.push('session_duration');

            if (missingFields.length > 0) {
                return res.status(400).json({
                    error: 'Validation Error',
                    message: `The following fields are required: ${missingFields.join(', ')}`
                });
            }

            const { id: user_id, user_type, } = req.user;
            const { court_id, sports_center_id } = req.params;


            const user = await User.findByPk(user_id);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

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
                    game_type,
                    court_id
                }
            });

            if (existingBooking) {
                return res.status(409).json({
                    message: 'A booking already exists for this date, slot, and game type'
                });
            }

            const booking_reference = generateBookingReference();

            let total_players;

            const normalizedGameType = game_type.toLowerCase();

            const gameTypePlayerMap = {
                padel: 4,
                snooker: 2,
                darts: 2
            };

            if (!gameTypePlayerMap[normalizedGameType]) {
                return res.status(400).json({
                    message: `Unsupported game_type '${game_type}'.`
                });
            }

            switch (booking_type.toLowerCase()) {
                case 'public':
                case 'private':
                case 'academy':
                    total_players = gameTypePlayerMap[normalizedGameType];
                    break;
                default:
                    return res.status(400).json({
                        message: `Invalid booking_type '${booking_type}'. Must be 'public', 'private', or 'academy'.`
                    });
            }

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
                game_type,
                total_players,
                session_price,
                session_duration
            });

            // only add to booking players if it is an open match

            if (booking_type.toLowerCase() === 'public') {

                await BookingPlayers.create({
                    user_id,
                    bookings_id: booking.id
                });

                await UserActivityController.log({
                    user_id: user_id,
                    activity_type: 'match',
                    description: 'You Created a new Open Match'
                }, req);
            } else {

                await UserActivityController.log({
                    user_id: user_id,
                    activity_type: 'match',
                    description: 'You Created a new Private Match'
                }, req);

            }


            await sendEmail(user.email, 'Booking Confirmed', 'booking', user.first_name, game_type, date, slot,);


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

    getPublicBookings: async (req, res) => {
        try {
            const userId = req.user.id;

            // Get page & limit from query or use defaults
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const offset = (page - 1) * limit;

            // Fetch all public bookings
            const allPublicBookings = await Bookings.findAll({
                where: { booking_type: 'public', user_type: 'User' },
                include: [
                    {
                        model: BookingPlayers,
                        as: 'players',
                        include: [
                            {
                                model: User,
                                as: 'user',
                                attributes: ['first_name', 'points', 'display_picture']
                            }
                        ]
                    },
                    {
                        model: Court,
                        as: 'court',
                        attributes: ['court_name'],
                        include: [
                            {
                                model: SportsCenter,
                                as: 'sportsCenter',
                                attributes: ['sports_center_name', 'cover_image']
                            }
                        ]
                    }
                ],
                order: [['created_at', 'DESC']]
            });

            // Filter out bookings where date and slot have already passed
            const now = new Date();
            const upcomingBookings = allPublicBookings.filter(booking => {
                try {
                    const date = booking.date; // 'YYYY-MM-DD'
                    const time = booking.slot; // '10:00 AM'
                    const dateTimeString = `${date} ${time}`;
                    const bookingDateTime = new Date(dateTimeString);
                    return bookingDateTime > now;
                } catch (e) {
                    return false;
                }
            });

            // Paginate manually
            const paginatedBookings = upcomingBookings.slice(offset, offset + limit);
            const hasMore = offset + limit < upcomingBookings.length;

            // Format results
            const formattedBookings = await Promise.all(paginatedBookings.map(async booking => {
                const bookingData = booking.toJSON();

                // Check if user already joined
                const alreadyJoined = await BookingPlayers.findOne({
                    where: {
                        user_id: userId,
                        bookings_id: bookingData.id
                    }
                });

                const players = bookingData.players.map(p => {
                    let avatar = p.user?.display_picture || null;

                    if (avatar && typeof avatar === 'string') {
                        avatar = avatar.trim();
                        if (avatar.startsWith('"') && avatar.endsWith('"')) {
                            avatar = avatar.slice(1, -1);
                        }
                    }

                    return {
                        name: p.user?.first_name || '',
                        rating: p.user?.points || 0.0,
                        avatarUrl: avatar
                    };
                });


                const placeholdersToAdd = bookingData.total_players - players.length;
                for (let i = 0; i < placeholdersToAdd; i++) {
                    players.push({
                        name: 'Available',
                        rating: null,
                        avatarUrl: null
                    });
                }

                return {
                    ...bookingData,
                    players,
                    court: undefined,
                    courtName: booking.court?.court_name || 'Unknown Court',
                    sportsCenterName: booking.court?.sportsCenter?.sports_center_name || 'Unknown Center',
                    cover_image: booking.court?.sportsCenter?.cover_image || 'image.png',
                    joinedStatus: !!alreadyJoined
                };
            }));

            return res.status(200).json({
                message: 'Public bookings retrieved successfully',
                data: formattedBookings,
                hasMore
            });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Server error', error });
        }
    },







    joinPublicBookings: async (req, res) => {
        try {
            const { bookingId } = req.params;
            const userId = req.user.id;

            const booking = await Bookings.findOne({
                where: {
                    id: bookingId,
                    booking_type: 'public'
                }
            });

            if (!booking) {
                return res.status(404).json({ message: 'Open Match not found' });
            }

            const alreadyJoined = await BookingPlayers.findOne({
                where: {
                    user_id: userId,
                    bookings_id: bookingId
                }
            });

            if (alreadyJoined) {
                return res.status(400).json({ message: 'You have already joined this match' });
            }

            const currentPlayerCount = await BookingPlayers.count({
                where: {
                    bookings_id: bookingId
                }
            });

            if (currentPlayerCount >= booking.total_players) {
                return res.status(400).json({ message: 'Maximum Number of players have been reached for this match.' });
            }

            const newPlayer = await BookingPlayers.create({
                user_id: userId,
                bookings_id: bookingId
            });

            await UserActivityController.log({
                user_id: userId,
                activity_type: 'match',
                description: 'You Joined an Open Match'
            }, req);

            return res.status(201).json({
                message: 'Successfully joined the Match',
                player: newPlayer
            });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Server error', error });
        }
    },


    apiCancelBooking: async (req, res) => {
        try {
            const { bookingId } = req.params;
            const userId = req.user.id;

            const booking = await Bookings.findOne({ where: { id: bookingId, user_id: userId } });

            if (!booking) {
                return res.status(404).json({ message: 'Booking not found' });
            }

            if (booking.status === 'cancelled') {
                return res.status(400).json({ message: 'Booking already cancelled' });
            }

            const refundEligible = isRefundEligible(booking);

            booking.status = 'cancelled';
            await booking.save();

            await Refunds.create({
                user_id: req.user.id,
                booking_id: booking.id,
                eligible: refundEligible,
                refund_amount: refundEligible ? booking.session_price : 0,
                reason: refundEligible
                    ? 'Cancelled within eligible window'
                    : 'Cancelled after refund deadline',
                status: 'pending'
            });


            return res.status(200).json({
                message: 'Booking cancelled successfully',
                refund: refundEligible,
                refundNote: refundEligible
                    ? 'You are eligible for a full refund.'
                    : 'You cancelled too late for a refund.'
            });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Server error', error });
        }
    },

    apiLeavePublicBooking: async (req, res) => {
        try {
            const { bookingId } = req.params;
            const userId = req.user.id;

            const booking = await Bookings.findOne({
                where: { id: bookingId, booking_type: 'public' }
            });

            if (!booking) {
                return res.status(404).json({ message: 'Match not found' });
            }

            const playerEntry = await BookingPlayers.findOne({
                where: {
                    bookings_id: bookingId,
                    user_id: userId
                }
            });

            if (!playerEntry) {
                return res.status(404).json({ message: 'You are not part of this match' });
            }

            // Calculate refund eligibility
            const refundEligible = isRefundEligible(booking);

            // Define game type player distribution
            const gameTypePlayerMap = {
                padel: 4,
                snooker: 2,
                darts: 2
            };

            const normalizedGameType = booking.game_type.toLowerCase();
            const totalPlayers = gameTypePlayerMap[normalizedGameType] || 1;
            const perPlayerRefund = parseFloat(booking.session_price) / totalPlayers;

            // Remove player from match
            await playerEntry.destroy();

            // Record refund entry
            await Refunds.create({
                user_id: userId,
                booking_id: booking.id,
                eligible: refundEligible,
                refund_amount: refundEligible ? perPlayerRefund.toFixed(2) : 0,
                reason: refundEligible
                    ? 'Left within eligible window'
                    : 'Left after refund deadline',
                status: 'pending'
            });

            // Log activity
            await UserActivityController.log({
                user_id: userId,
                activity_type: 'match',
                description: 'You left a public match'
            }, req);

            return res.status(200).json({
                message: 'You have successfully left the match',
                refund: refundEligible,
                refundAmount: refundEligible ? perPlayerRefund.toFixed(2) : 0,
                refundNote: refundEligible
                    ? 'You are eligible for a refund.'
                    : 'You left too late for a refund.'
            });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Server error', error });
        }
    }








}

module.exports = bookingsController;