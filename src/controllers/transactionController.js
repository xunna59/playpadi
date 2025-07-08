const { Transaction } = require('../models');

const transactionController = {
    getUserTransactions: async (req, res, next) => {
        try {
            const userId = req.user.id;

            // Pagination params
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const offset = (page - 1) * limit;

            // Fetch paginated + filtered data
            const { count, rows: transactions } = await Transaction.findAndCountAll({
                where: { user_id: userId },
                order: [['created_at', 'DESC']],
                limit,
                offset,
                attributes: {
                    exclude: ['updated_at', 'method', 'currency'],
                },
            });

            return res.status(200).json({
                success: true,
                currentPage: page,
                totalPages: Math.ceil(count / limit),
                totalTransactions: count,
                transactions,
            });
        } catch (error) {
            next(error);
        }
    },
};

module.exports = transactionController;
