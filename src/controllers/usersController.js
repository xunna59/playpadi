const { User } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');



const UsersController = {

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
            if (!user) return res.status(404).json({ message: 'User not found' });

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

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

    // Google OAuth callback handler
    googleAuthCallback: (req, res) => {
        passport.authenticate('google', { session: false }, (err, user) => {
            if (err || !user) {
                return res.status(401).json({ message: 'Google authentication failed', error: err });
            }
            // Generate JWT for the authenticated user
            const token = jwt.sign(
                { id: user.id, email: user.email },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );
            res.status(200).json({ message: 'Google login successful', user, token });
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
            res.status(200).json({ message: 'Apple login successful', user, token });
        })(req, res);
    }
};

module.exports = UsersController;
