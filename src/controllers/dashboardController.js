const { where } = require('sequelize');
const { User, Bookings, Transaction, Refunds, Court, Admin } = require('../models');

const dashboardController = {
    renderDashboard: async (req, res, next) => {
        try {
            const [
                totalUsers,
                totalBookings,
                privateBookings,
                publicBookings,
                totalTransactions,
                totalTransactionAmount,
                totalPaymentsPrivateBookings,
                totalPaymentsPublicBookings,
                totalPaymentsClasses,
                totalRefunds,
                totalRefundAmount,

            ] = await Promise.all([
                User.count(),
                Bookings.count(),
                Bookings.count({ where: { booking_type: 'private' } }),
                Bookings.count({ where: { booking_type: 'public' } }),
                Transaction.count(),
                Transaction.sum('amount'),
                Transaction.sum('amount', { where: { purpose: 'Book Private Match' } }),
                Transaction.sum('amount', { where: { purpose: 'Join Open Match' } }),
                Transaction.sum('amount', { where: { purpose: 'Join Class' } }),
                Refunds.count({ where: { status: 'pending' } }),
                Refunds.sum('refund_amount', { where: { status: 'refunded' } }),

            ]);

            const getPendingRefunds = await Refunds.findAll({
                where: { status: 'pending' }, limit: 10, order: [['created_at', 'DESC']],
                include: [
                    {
                        model: User,
                        as: 'user', // this alias must match how you defined the association
                        required: false
                    },

                ]
            });
            const getRecentBookings = await Bookings.findAll({
                limit: 10,
                order: [['created_at', 'DESC']], // make sure your model uses `createdAt`, not `created_at`
                include: [
                    {
                        model: User,
                        as: 'user', // this alias must match how you defined the association
                        required: false
                    },
                    { model: Court, as: 'court' },
                    { model: Admin, as: 'admin', required: false }
                ]
            });



            return res.render('dashboard', {
                title: 'Dashboard',
                admin: req.admin,
                totals: {
                    users: totalUsers,
                    bookings: totalBookings,
                    bookingsPrivate: privateBookings,
                    bookingsPublic: publicBookings,
                    transactions: totalTransactions,
                    transactionsAmount: totalTransactionAmount || 0,
                    bookingsTransactionsAmount: totalPaymentsPublicBookings + totalPaymentsPrivateBookings || 0,
                    classesTransactionsAmount: totalPaymentsClasses || 0,
                    refunds: totalRefunds,
                    totalAmountRefunded: totalRefundAmount || 0

                },
                getPendingRefunds,
                getRecentBookings
            });
        } catch (error) {
            next(error);
        }
    }
};

module.exports = dashboardController;

