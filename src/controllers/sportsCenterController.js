const { SportsCenter, Court } = require('../models');

const flexibleUpload = require('../middleware/uploadMiddleware')

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

            const formattedCenters = sportsCenters.map(center => {
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

    renderViewSportsCenter: async (req, res, next) => {
        try {
            const { id } = req.params;
            const sportsCenter = await SportsCenter.findByPk(id, {
                include: [{ model: Court, as: 'courts' }]
            });
            if (!sportsCenter) {
                return res.status(404).json({ message: "Sports center not found" });
            }

            return res.render('sports-center/edit-sports-center', {
                title: 'View Sports Center',
                admin: req.admin,
                sportsCenter
            });
        } catch (error) {
            next(error);
        }
    },

    create: async (req, res) => {


        flexibleUpload.single('cover_photo')(req, res, async (err) => {
            if (err) {
                return res.status(400).json({ success: false, message: err.message });
            }
            if (!req.file) {
                return res.status(400).json({ success: false, message: 'Please upload an image' });
            }

            try {
                const {
                    sports_center_name,
                    sports_center_address,
                    latitude,
                    longitude,
                    //     openingHours,
                    sports_center_description,
                    session_price
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
                    cover_image: `${req.file.filename}`,
                    sports_center_description,
                    session_price
                });

                req.flash('success_msg', 'Sports Center Created Successfully');
                return res.redirect('/admin/sports-center/');
                // res.status(201).json({ message: "Sports center created successfully", data: sportsCenter });
            } catch (error) {
                res.status(500).json({ message: "Error creating sports center", error: error.message });
            }


        });

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

            if (!updated) {
                return res.status(404).json({ message: "Sports center not found or no changes made" });
            }
            req.flash('success_msg', 'Sports Center Updated Successfully');
            return res.redirect('/admin/sports-center/');
            //    res.status(200).json({ message: "Sports center updated successfully" });
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
    },


    // api area

    apiAllSportsCenters: async (req, res, next) => {
        try {
            const page = parseInt(req.query.page, 10) || 1;
            const limit = 5;
            const offset = (page - 1) * limit;

            const { count, rows: sportsCenters } = await SportsCenter.findAndCountAll({
                limit,
                offset,
                order: [['createdAt', 'DESC']],
                attributes: [ // ONLY these fields will be selected from DB

                    'id',
                    'sports_center_name',
                    'sports_center_address',

                    'sports_center_features',
                    'sports_center_games',
                    'cover_image',
                    'session_price',
                ],
            });

            const totalPages = Math.ceil(count / limit);

            const formattedCenters = sportsCenters.map(center => {
                const formattedCenter = { ...center.toJSON() };

                // Parse fields if needed
                if (typeof formattedCenter.sports_center_games === 'string') {
                    try {
                        formattedCenter.sports_center_games = JSON.parse(formattedCenter.sports_center_games);
                    } catch (err) {
                        formattedCenter.sports_center_games = [];
                    }
                }

                if (typeof formattedCenter.sports_center_features === 'string') {
                    try {
                        formattedCenter.sports_center_features = JSON.parse(formattedCenter.sports_center_features);
                    } catch (err) {
                        formattedCenter.sports_center_features = [];
                    }
                }

                return formattedCenter;
            });

            return res.status(200).json({
                message: 'Sports centers retrieved successfully',
                data: {
                    sportsCenters: formattedCenters,
                    pagination: {
                        totalItems: count,
                        currentPage: page,
                        totalPages,
                        limit,
                        offset
                    }
                }
            });
        } catch (error) {
            next(error);
        }
    },


    apiViewSportsCenters: async (req, res, next) => {
        try {
            const { id } = req.params;
            const sportsCenter = await SportsCenter.findByPk(id, {
                include: [{ model: Court, as: 'courts' }]
            });

            if (!sportsCenter) {
                return res.status(404).json({ message: "Sports center not found" });
            }

            const detailedCenter = { ...sportsCenter.toJSON() };

            if (typeof detailedCenter.sports_center_games === 'string') {
                try {
                    detailedCenter.sports_center_games = JSON.parse(detailedCenter.sports_center_games);
                } catch (err) {
                    detailedCenter.sports_center_games = [];
                }
            }

            if (typeof detailedCenter.sports_center_features === 'string') {
                try {
                    detailedCenter.sports_center_features = JSON.parse(detailedCenter.sports_center_features);
                } catch (err) {
                    detailedCenter.sports_center_features = [];
                }
            }

            if (typeof detailedCenter.openingHours === 'string') {
                try {
                    detailedCenter.openingHours = JSON.parse(detailedCenter.openingHours);
                } catch (err) {
                    detailedCenter.openingHours = {};
                }
            }

            if (typeof detailedCenter.booking_info === 'string') {
                try {
                    detailedCenter.booking_info = JSON.parse(detailedCenter.booking_info);
                } catch (err) {
                    detailedCenter.booking_info = {};
                }
            }

            return res.status(200).json({
                message: 'Sports center retrieved successfully',
                data: detailedCenter
            });
        } catch (error) {
            next(error);
        }
    },




};

module.exports = sportsCenterController;
