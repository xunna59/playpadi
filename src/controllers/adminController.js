const { Admin } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// const sendEmail = require('./utils/sendEmail');
const { validationResult } = require('express-validator');

function generateRandomPassword(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let genpassword = '';
    for (let i = 0; i < length; i++) {
        genpassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return genpassword;
}

const adminAuthController = {


    renderLogin: (req, res) => {

        res.render('auth/login', { title: 'Admin Sign In' });

    },

    loginAdmin: async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }


        try {
            const { email, password } = req.body;

            const admin = await Admin.findOne({ where: { email } });

            if (!admin) {
                req.flash('error_msg', 'Invalid credentials');
                return res.redirect('/admin/login');
            }

            const isMatch = await bcrypt.compare(password, admin.password);

            if (!isMatch) {
                req.flash('error_msg', 'Invalid credentials');
                return res.redirect('/admin/login');
            }

            const payload = { id: admin.id, email: admin.email, username: admin.username, role: admin.role };

            const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

            res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });

            // Redirect to dashboard
            return res.redirect(303, '/admin/dashboard');

        } catch (error) {
            next(error);
        }
    },


    // Request password reset method 

    requestPasswordReset: async (req, res, next) => {
        try {
            const { email } = req.body;
            const user = await Admin.findOne({ where: { email } });

            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }

            // Generate a reset token
            const resetToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
            const resetLink = `${process.env.CLIENT_URL}/admin/reset-password?token=${resetToken}`;

            // Send reset email
            await sendEmail(user.email, 'Password Reset Request', 'resetPassword', user.firstname, resetLink);

            res.status(200).json({ success: true, message: 'Password reset email sent successfully' });
        } catch (error) {
            next(error);
        }
    },


    // reset password method

    resetPassword: async (req, res, next) => {
        try {
            const { token, newPassword } = req.body;

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await Admin.findByPk(decoded.id);

            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found or token is invalid' });
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);
            user.password = hashedPassword;

            await user.save();

            res.status(200).json({ success: true, message: 'Password has been reset successfully' });
        } catch (error) {

            if (error.name === 'TokenExpiredError') {

                return res.status(400).json({ success: false, message: 'Token expired. Please request a new password reset.' });

            }

            next(error);
        }
    },


    createAdmin: async (req, res, next) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array().map(err => ({
                    msg: err.msg,
                    key: err.path,
                })),
            });
        }

        const admin_role = req.admin.role;

        if (admin_role != 'super admin') {
            return res.status(404).json({ success: false, message: 'You are not authorised to create an admin' });
        }

        try {
            const { first_name, last_name, email } = req.body;

            // Check if the email already exists
            const existingAdmin = await Admin.findOne({ where: { email } });
            if (existingAdmin) {
                return res.status(400).json({
                    success: false,
                    message: "Email already exists. Please use a different email."
                });
            }

            // Generate username and raw password
            const username = `${first_name.toLowerCase()}.${last_name.toLowerCase()}`;
            const rawPassword = generateRandomPassword(12); // Generates a 12-character password

            // Hash the password using bcrypt
            const hashedPassword = await bcrypt.hash(rawPassword, 10);

            // Create the Admin with the new username and hashed password
            const new_admin = await Admin.create({
                first_name,
                last_name,
                email,
                username,
                password: hashedPassword
            });

            // Optionally, send the rawPassword via a secure channel (e.g., email) for the admin to log in
            await adminAuthController.sendVerificationEmail(new_admin);

            // Send the response with user data (excluding the password for security reasons)
            res.status(201).json({
                success: true,
                message: "Complete Registration Mail sent successfully",
                new_admin: {
                    first_name: new_admin.first_name,
                    last_name: new_admin.last_name,
                    phone: new_admin.phone,
                    email: new_admin.email,
                    username: new_admin.username,
                    // Avoid sending the password in the response
                },
                //  token
            });
        } catch (error) {
            next(error);
        }
    },

    sendVerificationEmail: async (new_admin) => {
        // Create a verification token
        const verificationToken = jwt.sign(
            { id: new_admin.id, route: 'complete-registration' },
            process.env.JWT_SECRET,
            { expiresIn: '1h' } // Token expires in 1 hour
        );

        // Generate a verification link
        const registerLink = `${process.env.CLIENT_URL}/admin/complete-registration?token=${verificationToken}`;



        await sendEmail(new_admin.email, 'Complete Registration', 'completeRegistration', new_admin.username, registerLink);
    },



    getAllAdmin: async (req, res, next) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false, errors: errors.array().map(err => ({
                    msg: err.msg,
                    key: err.path,
                })),
            });
        }
        try {
            const admin = await Admin.findAll({
                attributes: ['id', 'username', 'email', 'role', 'created_at', 'updated_at'],
                where: { role: 'admin' }
            });
            res.status(200).json({ success: true, message: "Admin Accounts", data: admin });
        } catch (error) {
            next(error);
        }
    },

    getAdminProfile: async (req, res, next) => {
        // Validate request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array().map(err => ({
                    msg: err.msg,
                    key: err.path,
                })),
            });
        }

        try {
            const adminId = req.admin.id; // Ensure `authMiddleware` sets `req.admin`

            // Fetch admin profile from database
            const admin = await Admin.findByPk(adminId, {
                attributes: ['username', 'email', 'role', 'createdAt', 'updatedAt'], // Use correct timestamp fields
            });

            if (!admin) {
                return res.status(404).json({ success: false, message: "Admin not found" });
            }

            return res.status(200).json({ success: true, admin });
        } catch (error) {
            next(error);
        }
    },


    logout: (req, res) => {
        res.clearCookie('token', { httpOnly: true, secure: process.env.NODE_ENV === 'production' });

        // Redirect to the login page after logging out
        return res.redirect('/admin/login');
    },

    updateAdminPassword: async (req, res, next) => {
        // Validate request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array().map(err => ({
                    msg: err.msg,
                    key: err.path,
                })),
            });
        }

        try {
            const adminId = req.admin.id; // Ensure `authMiddleware` sets `req.admin`
            const { currentPassword, newPassword } = req.body;

            // Fetch admin from database
            const admin = await Admin.findByPk(adminId, {
                attributes: ['id', 'password'], // Ensure password field is included
            });

            if (!admin) {
                return res.status(404).json({ success: false, message: "Admin not found" });
            }

            // Verify current password
            const isMatch = await bcrypt.compare(currentPassword, admin.password);
            if (!isMatch) {
                //  req.flash('error_msg', "Current password is incorrect");
                return res.status(400).json({ success: false, message: "Current password is incorrect" });
            }

            // Hash new password
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            // Update admin password
            await admin.update({ password: hashedPassword });


            req.flash('success_msg', "Password updated successfully");

            return res.redirect(303, `settings/account-settings`);

            //   return res.status(200).json({ success: true, message: "Password updated successfully" });
        } catch (error) {
            next(error);
        }
    }




}

module.exports = adminAuthController;