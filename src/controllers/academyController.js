const { Academy, SportsCenter, Court, YoutubeTutorial, Coach, AcademyStudents, User } = require('../models');
const flexibleUpload = require('../middleware/uploadMiddleware');
const UserActivityController = require('./userActivityController');


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

            const coaches = await Coach.findAll();


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
                coaches,
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
                    coach_id,
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
                    !coach_id ||
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
                    coach_id,
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

    // getAllAcademies: async (req, res, next) => {
    //     try {
    //         const userId = req.user.id;

    //         const academies = await Academy.findAll({
    //              where: {
    //             availability_status: true
    //         },
    //             include: [
    //                 {
    //                     model: Coach,
    //                     as: 'coach',
    //                     attributes: ['id', 'first_name', 'last_name', 'display_picture']
    //                 },
    //                 {
    //                     model: SportsCenter,
    //                     as: 'sportsCenter',
    //                     attributes: ['id', 'sports_center_name', 'sports_center_address']
    //                 },
    //                 {
    //                     model: AcademyStudents,
    //                     as: 'academy_students',
    //                     include: [
    //                         {
    //                             model: User,
    //                             as: 'user',
    //                             attributes: ['first_name', 'points', 'display_picture']
    //                         }
    //                     ]
    //                 }
    //             ],
    //             order: [['created_at', 'DESC']]
    //         });

    //         const data = await Promise.all(
    //             academies.map(async academy => {
    //                 // Check joinedStatus
    //                 let joinedStatus = false;
    //                 if (userId) {
    //                     const alreadyJoined = await AcademyStudents.findOne({
    //                         where: {
    //                             user_id: userId,
    //                             academy_id: academy.id
    //                         }
    //                     });
    //                     joinedStatus = !!alreadyJoined;
    //                 }

    //                 // Sanitize display_picture for each student
    //                 if (academy.academy && Array.isArray(academy.academy)) {
    //                     academy.academy.forEach(student => {
    //                         const dp = student.user?.display_picture;
    //                         if (typeof dp === 'string') {
    //                             let avatar = dp.trim();
    //                             if (
    //                                 (avatar.startsWith('"') && avatar.endsWith('"')) ||
    //                                 (avatar.startsWith("'") && avatar.endsWith("'"))
    //                             ) {
    //                                 avatar = avatar.substring(1, avatar.length - 1);
    //                             }
    //                             student.user.display_picture = avatar;
    //                         }
    //                     });
    //                 }

    //                 // Add joinedStatus to response
    //                 const academyData = academy.toJSON();
    //                 academyData.joinedStatus = joinedStatus;
    //                 return academyData;
    //             })
    //         );

    //         return res.status(200).json({
    //             message: 'Academies retrieved successfully',
    //             data
    //         });
    //     } catch (err) {
    //         console.error('getAllAcademies error:', err);
    //         next(err);
    //     }
    // },

getAllAcademies: async (req, res, next) => {
    try {
        const userId = req.user.id;

        const academies = await Academy.findAll({
            where: {
                availability_status: true
            },
            include: [
                {
                    model: Coach,
                    as: 'coach',
                    attributes: ['id', 'first_name', 'last_name', 'display_picture']
                },
                {
                    model: SportsCenter,
                    as: 'sportsCenter',
                    attributes: ['id', 'sports_center_name', 'sports_center_address', 'cover_image']
                },
                {
                    model: AcademyStudents,
                    as: 'academy_students',
                    include: [
                        {
                            model: User,
                            as: 'user',
                            attributes: ['first_name', 'points', 'display_picture']
                        }
                    ]
                }
            ],
            order: [['created_at', 'DESC']]
        });

        const data = await Promise.all(
            academies.map(async academy => {
                let joinedStatus = false;

                if (userId) {
                    const alreadyJoined = await AcademyStudents.findOne({
                        where: {
                            user_id: userId,
                            academy_id: academy.id
                        }
                    });
                    joinedStatus = !!alreadyJoined;
                }

                const academyData = academy.toJSON();

                if (typeof academyData.sportsCenter?.cover_image === 'string') {
    let image = academyData.sportsCenter.cover_image.trim();

    if (
        (image.startsWith('"') && image.endsWith('"')) ||
        (image.startsWith("'") && image.endsWith("'"))
    ) {
        image = image.slice(1, -1);
    }

    academyData.sportsCenter.cover_image = image;
}

                // Transform academy_students to desired flat structure
                academyData.academy_students = (academyData.academy_students || []).map(student => {
                    let avatar = student.user?.display_picture || '';
                    if (typeof avatar === 'string') {
                        avatar = avatar.trim();
                        if (
                            (avatar.startsWith('"') && avatar.endsWith('"')) ||
                            (avatar.startsWith("'") && avatar.endsWith("'"))
                        ) {
                            avatar = avatar.slice(1, -1);
                        }
                    }

                    return {
                        name: student.user?.first_name || 'Unknown',
                        image: avatar || 'https://i.pravatar.cc/150'
                    };
                });

                academyData.total_students = academyData.academy_students.length;
                academyData.joinedStatus = joinedStatus;
                return academyData;
            })
        );

        return res.status(200).json({
            message: 'Academies retrieved successfully',
            data
        });
    } catch (err) {
        console.error('getAllAcademies error:', err);
        next(err);
    }
},


    getAllYoutubeVideos: async (req, res, next) => {
        try {
            const youtubeVideos = await YoutubeTutorial.findAll({
                order: [['created_at', 'DESC']]
            });
            return res.status(200).json({
                message: 'Youtbube Video Retrieved successfully',
                data: youtubeVideos
            });
        } catch (err) {
            next(err);
        }
    },

    getAcademyById: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const academy = await Academy.findByPk(req.params.id, {
                include: [
                    {
                        model: Coach,
                        as: 'coach' // make sure the alias matches your model setup
                    },
                    {
                        model: SportsCenter,
                        as: 'sportsCenter',
                        attributes: ['id', 'sports_center_name', 'sports_center_address'] // select only the fields you need
                    },
                    {
                        model: AcademyStudents,
                        as: 'academy', // Alias from Academy.hasMany
                        include: [
                            {
                                model: User,
                                as: 'user', // Alias from AcademyStudents.belongsTo
                                attributes: ['first_name', 'points', 'display_picture']
                            }
                        ]
                    }
                ]
            });

            if (!academy) {
                return res.status(404).json({ message: 'Academy not found' });
            }

            // Check if current user already joined this booking
            let joinedStatus = false;
            if (userId) {
                const alreadyJoined = await AcademyStudents.findOne({
                    where: {
                        user_id: userId,
                        academy_id: academy.id
                    }
                });
                joinedStatus = !!alreadyJoined;
            }

            if (academy.academy && Array.isArray(academy.academy)) {
                academy.academy.forEach(student => {
                    if (student.user && typeof student.user.display_picture === 'string') {
                        let avatar = student.user.display_picture.trim();
                        if (
                            (avatar.startsWith('"') && avatar.endsWith('"')) ||
                            (avatar.startsWith("'") && avatar.endsWith("'"))
                        ) {
                            avatar = avatar.substring(1, avatar.length - 1);
                        }
                        student.user.display_picture = avatar;
                    }
                });
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
    },


    createCoach: async (req, res) => {

        flexibleUpload.single('display_picture')(req, res, async (err) => {
            if (err) {
                return res.status(400).json({ success: false, message: err.message });
            }
            if (!req.file) {
                return res.status(400).json({ success: false, message: 'Please upload an image' });
            }

            try {
                const coach = await Coach.create(req.body);
                return res.status(201).json(coach);
            } catch (error) {
                return res.status(400).json({ error: error.message });
            }

        });


    },

    // Get all coaches
    getAllCoaches: async (req, res) => {
        try {
            const coaches = await Coach.findAll();
            return res.status(200).json(coaches);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    },

    // Get a single coach by ID
    getCoachById: async (req, res) => {
        try {
            const { id } = req.params;
            const coach = await Coach.findByPk(id);
            if (!coach) {
                return res.status(404).json({ error: 'Coach not found' });
            }
            return res.status(200).json(coach);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    },

    // Update a coach by ID
    updateCoach: async (req, res) => {
        try {
            const { id } = req.params;
            const coach = await Coach.findByPk(id);
            if (!coach) {
                return res.status(404).json({ error: 'Coach not found' });
            }
            await coach.update(req.body);
            return res.status(200).json(coach);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    },

    // Delete a coach by ID
    deleteCoach: async (req, res) => {
        try {
            const { id } = req.params;
            const coach = await Coach.findByPk(id);
            if (!coach) {
                return res.status(404).json({ error: 'Coach not found' });
            }
            await coach.destroy();
            return res.status(204).send();
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    },

    joinAcademy: async (req, res) => {
        try {
            const { academyId } = req.params;
            const userId = req.user.id;

            const academy = await Academy.findByPk(academyId);

            if (!academy) {
                return res.status(404).json({ message: 'Academy not found' });
            }

            const alreadyJoined = await AcademyStudents.findOne({
                where: {
                    user_id: userId,
                    academy_id: academyId
                }
            });

            if (alreadyJoined) {
                return res.status(400).json({ message: 'You have already joined this academy' });
            }

            // Optional: Limit number of students if your Academy model has something like `num_of_players`
            // const currentStudentCount = await AcademyStudents.count({
            //     where: { academy_id: academyId }
            // });

            // if (academy.num_of_players && currentStudentCount >= academy.max_students) {
            //     return res.status(400).json({ message: 'Academy has reached its student limit' });
            // }

            const newStudent = await AcademyStudents.create({
                user_id: userId,
                academy_id: academyId
            });

            await UserActivityController.log({
                user_id: userId,
                activity_type: 'class',
                description: `You Joined ${academy.title} class`
            }, req);

            return res.status(201).json({
                message: 'Successfully joined the Academy',
                student: newStudent
            });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Server error', error });
        }
    }

};

module.exports = academyController;
