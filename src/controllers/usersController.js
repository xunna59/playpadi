const { User } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');



const UsersController = {

    renderManageUsers: async (req, res, next) => {

        try {
            const page = parseInt(req.query.page, 10) || 1;
            const limit = 5;
            const offset = (page - 1) * limit;

            const { count, rows: users } = await User.findAndCountAll({
                limit,
                offset,
                order: [['created_at', 'DESC']],
            });

            const totalPages = Math.ceil(count / limit);

            res.render('users/index', {

                title: 'Manage Users',
                admin: req.admin,
                users,
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

    // Regular user registration
    register: async (req, res) => {
        try {
            const { first_name, last_name, email, phone, password } = req.body;
            // Check if user already exists
            const existingUser = await User.findOne({ where: { email } });
            if (existingUser) {
                return res.status(400).json({ message: 'User already exists' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = await User.create({
                first_name,
                last_name,
                email,
                phone,
                password: hashedPassword
            });

            res.status(201).json(newUser);
        } catch (error) {
            res.status(500).json({ message: 'Error registering user', error });
        }
    },

    // Regular user login
    login: async (req, res) => {
        try {
            const { email, password } = req.body;
            const user = await User.findOne({ where: { email } });
            if (!user) return res.status(404).json({ message: 'Invalid Sign In credentials' });

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) return res.status(401).json({ message: 'Invalid Sign In credentials' });

            const token = jwt.sign(
                { id: user.id, email: user.email },
                process.env.JWT_SECRET,
                { expiresIn: '1d' }
            );

            res.status(200).json({ message: 'Login successful', token });
        } catch (error) {
            res.status(500).json({ message: 'Error logging in', error });
        }
    },

    checkEmailExists: async (req, res) => {
        try {
            const { email } = req.body;
            const user = await User.findOne({ where: { email } });

            if (user) {
                return res.status(409).json({ message: 'An account already exists with this email.' });
            }

            return res.status(200).json({ message: 'Email is available.' });

        } catch (error) {
            res.status(500).json({ message: 'Error checking email', error });
        }
    },



    googleAuthCallback: (req, res) => {
        passport.authenticate('google', { session: false }, (err, user) => {
            if (err || !user) {
                return res.redirect('playpadi://auth?error=GoogleAuthFailed');
            }

            // Generate JWT for the authenticated user
            const token = jwt.sign(
                { id: user.id, email: user.email },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );

            // Redirect to Flutter app with the token
            return res.redirect(`playpadi://auth?token=${token}`);
        })(req, res);
    },

    // Apple OAuth callback handler
    appleAuthCallback: (req, res) => {
        passport.authenticate('apple', { session: false }, (err, user) => {
            if (err || !user) {
                return res.status(401).json({ message: 'Apple authentication failed', error: err });
            }
            // Generate JWT for the authenticated user
            const token = jwt.sign(
                { id: user.id, email: user.email },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );
            res.status(200).json({ message: 'Apple login successful', token });
        })(req, res);
    },


    getProfile: async (req, res) => {
        try {
            const userId = req.user.id;

            const user = await User.findByPk(userId, {
                attributes: { exclude: ['password', 'id', 'created_at', 'updated_at'] }
            });

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            const { ...sanitizedUser } = user.toJSON();

            sanitizedUser.preferences = sanitizedUser.preferences
                ? JSON.parse(sanitizedUser.preferences)
                : {};

            res.status(200).json({ user: sanitizedUser });

        } catch (error) {
            res.status(500).json({ message: 'Error retrieving profile', error });
        }
    },


    updateProfile: async (req, res) => {
        try {
            const userId = req.user.id;
            const {
                first_name,
                last_name,
                phone,
                gender,
                dob,
                bio,
                preferences,
                display_picture
            } = req.body;

            const user = await User.findByPk(userId);

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            user.first_name = first_name ?? user.first_name;
            user.last_name = last_name ?? user.last_name;
            user.phone = phone ?? user.phone;
            user.gender = gender ?? user.gender;
            user.dob = dob ?? user.dob;
            user.bio = bio ?? user.bio;
            user.preferences = preferences ? JSON.stringify(preferences) : user.preferences;
            user.display_picture = display_picture ?? user.display_picture;

            await user.save();


            const { password, id, created_at, updated_at, ...sanitizedUser } = user.toJSON();

            sanitizedUser.preferences = sanitizedUser.preferences
                ? JSON.parse(sanitizedUser.preferences)
                : {};

            res.status(200).json({
                message: 'Profile updated successfully',
                user: sanitizedUser
            });

        } catch (error) {
            res.status(500).json({ message: 'Error updating profile', error });
        }
    },


};

module.exports = UsersController;
