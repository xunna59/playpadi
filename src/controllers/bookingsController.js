const { Bookings, Court, User } = require('../models');

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
                    { model: Court, as: 'court' }, // Include the Court model
                    { model: User, as: 'user' }     // Include the User model
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


}

module.exports = bookingsController;