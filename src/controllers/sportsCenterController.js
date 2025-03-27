const { SportsCenter } = require('../models');

const sportsCenterController = {

    renderAllSportsCenter: async (req, res, next) => {
        try {
            const page = parseInt(req.query.page, 10) || 1;
            const limit = 5;
            const offset = (page - 1) * limit;

            const { count, rows: sportsCenters } = await SportsCenter.findAndCountAll({
                limit,
                offset,
                order: [['createdAt', 'DESC']],
            });


            const totalPages = Math.ceil(count / limit);

            // Convert JSON strings to arrays if needed
            const formattedCenters = sportsCenters.map(center => {
                // If it's a string, parse it
                if (typeof center.sports_center_games === 'string') {
                    center.sports_center_games = JSON.parse(center.sports_center_games);
                }
                return center;
            });

            return res.render('sports-center/index', {
                title: 'Manage Sports Center',
                admin: req.admin,
                sportsCenters: formattedCenters,
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


    renderAddSportsCenter: async (req, res, next) => {
        try {
            return res.render('sports-center/add-sports-center', {
                title: 'Add Sports Center',
                admin: req.admin,
            });
        } catch (error) {
            next(error);
        }
    },

    // Create a new sports center
    create: async (req, res) => {
        try {
            const {
                sports_center_name,
                sports_center_address,
                latitude,
                longitude,
                //     openingHours,
                sports_center_description
            } = req.body;

            const features = JSON.parse(req.body.sports_center_features);
            const games = JSON.parse(req.body.sports_center_games);

            const sportsCenter = await SportsCenter.create({
                sports_center_name,
                sports_center_address,
                latitude,
                longitude,
                sports_center_features: features,
                sports_center_games: games,
                //  openingHours,
                sports_center_description
            });

            req.flash('success_msg', 'Sports Center Created Successfully');
            return res.redirect('/admin/sports-center/');
            // res.status(201).json({ message: "Sports center created successfully", data: sportsCenter });
        } catch (error) {
            res.status(500).json({ message: "Error creating sports center", error: error.message });
        }
    },

    // Get all sports centers
    getAll: async (req, res) => {
        try {
            const sportsCenters = await SportsCenter.findAll();
            res.status(200).json(sportsCenters);
        } catch (error) {
            res.status(500).json({ message: "Error fetching sports centers", error: error.message });
        }
    },

    // Get a single sports center by ID
    getOne: async (req, res) => {
        try {
            const { id } = req.params;
            const sportsCenter = await SportsCenter.findByPk(id);

            if (!sportsCenter) {
                return res.status(404).json({ message: "Sports center not found" });
            }

            res.status(200).json(sportsCenter);
        } catch (error) {
            res.status(500).json({ message: "Error fetching sports center", error: error.message });
        }
    },

    // Update a sports center
    update: async (req, res) => {
        try {
            const { id } = req.params;
            const updated = await SportsCenter.update(req.body, { where: { id } });

            if (!updated[0]) {
                return res.status(404).json({ message: "Sports center not found or no changes made" });
            }

            res.status(200).json({ message: "Sports center updated successfully" });
        } catch (error) {
            res.status(500).json({ message: "Error updating sports center", error: error.message });
        }
    },

    // Delete a sports center
    delete: async (req, res) => {
        try {
            const { id } = req.params;
            const deleted = await SportsCenter.destroy({ where: { id } });

            if (!deleted) {
                return res.status(404).json({ message: "Sports center not found" });
            }

            res.status(200).json({ message: "Sports center deleted successfully" });
        } catch (error) {
            res.status(500).json({ message: "Error deleting sports center", error: error.message });
        }
    }


};

module.exports = sportsCenterController;
