const { Academy, SportsCenter, Court, YoutubeTutorial } = require('../models');
const flexibleUpload = require('../middleware/uploadMiddleware')


const academyController = {


    renderAllClasses: async (req, res, next) => {
        try {
            const page = parseInt(req.query.page, 10) || 1;
            const limit = 5;
            const offset = (page - 1) * limit;

            const { count, rows: classes } = await Academy.findAndCountAll({
                limit,
                offset,
                order: [['created_at', 'DESC']],
                include: [
                    { model: Court, as: 'court' },
                    { model: SportsCenter, as: 'sportsCenter' }
                ]
            });

            const youtubeVideos = await YoutubeTutorial.findAll({
                order: [['created_at', 'DESC']]
            });


            const sportsCenter = await SportsCenter.findAll();
            //    const courts = await Court.findAll();

            const totalPages = Math.ceil(count / limit);

            return res.render('academy/index', {
                title: 'Manage Classes',
                admin: req.admin,
                classes,
                count,
                currentPage: page,
                totalPages,
                limit,
                offset,
                sportsCenter,
                youtubeVideos,
                YOUTUBE_API_KEY: process.env.YOUTUBE_KEY
                //courts
            });
        } catch (error) {
            next(error);
        }
    },




    createAcademy: async (req, res, next) => {

        flexibleUpload.single('cover_photo')(req, res, async (err) => {
            if (err) {
                return res.status(400).json({ success: false, message: err.message });
            }
            if (!req.file) {
                return res.status(400).json({ success: false, message: 'Please upload an image' });
            }
            try {
                const {
                    sports_center_id,
                    court_id,
                    title,
                    description,
                    session_activity,
                    session_price,
                    session_duration,
                    num_of_players,
                    activity_date,
                    end_registration_date,
                    category,
                    academy_type
                } = req.body;

                // Basic validation
                if (
                    !sports_center_id ||
                    !court_id ||
                    !title ||
                    !description ||
                    !session_activity ||
                    !session_price ||
                    !session_duration ||
                    !num_of_players ||
                    !activity_date
                ) {
                    return res.status(400).json({ message: 'Required fields are missing' });
                }

                // Create new academy record
                const newAcademy = await Academy.create({
                    sports_center_id,
                    court_id,
                    title,
                    description,
                    session_activity,
                    session_price,
                    session_duration,
                    num_of_players,
                    activity_date,
                    end_registration_date,
                    category,
                    cover_image: `${req.file.filename}`,
                    academy_type
                });

                return res.status(201).json({
                    message: 'Academy created successfully',
                    data: newAcademy
                });

            } catch (err) {

                next(err);
            }

        });


    },



    uploadYoutubeTutorial: async (req, res, next) => {

        flexibleUpload.single('youtube_cover')(req, res, async (err) => {
            if (err) {
                return res.status(400).json({ success: false, message: err.message });
            }
            if (!req.file) {
                return res.status(400).json({ success: false, message: 'Please upload an image' });
            }
            try {
                const {
                    video_title,
                    youtube_url,
                    video_duration,
                    upload_date,

                } = req.body;

                // Basic validation
                if (
                    !video_title ||
                    !youtube_url ||
                    !video_duration ||
                    !upload_date
                ) {
                    return res.status(400).json({ message: 'Required fields are missing' });
                }

                // Create new academy record
                const newVideo = await YoutubeTutorial.create({
                    video_title,
                    youtube_url,
                    video_duration,
                    upload_date,
                    cover_image: `${req.file.filename}`,

                });

                return res.status(201).json({
                    message: 'Youtbube Video Uploaded successfully',
                    data: newVideo
                });

            } catch (err) {

                next(err);
            }

        });


    },

    getAllAcademies: async (req, res, next) => {
        try {
            const academies = await Academy.findAll();
            return res.status(200).json(academies);
        } catch (err) {
            next(err);
        }
    },

    getAcademyById: async (req, res, next) => {
        try {
            const academy = await Academy.findByPk(req.params.id);
            if (!academy) {
                return res.status(404).json({ message: 'Academy not found' });
            }
            return res.status(200).json(academy);
        } catch (err) {
            next(err);
        }
    },

    updateAcademy: async (req, res, next) => {
        try {
            const academy = await Academy.findByPk(req.params.id);
            if (!academy) {
                return res.status(404).json({ message: 'Academy not found' });
            }

            await academy.update(req.body);
            return res.status(200).json(academy);
        } catch (err) {
            next(err);
        }
    },

    deleteAcademy: async (req, res, next) => {
        try {
            const academy = await Academy.findByPk(req.params.id);
            if (!academy) {
                return res.status(404).json({ message: 'Academy not found' });
            }

            await academy.destroy();
            return res.status(200).json({ message: 'Academy deleted successfully' });
        } catch (err) {
            next(err);
        }
    }
};

module.exports = academyController;
