const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

const authMiddleware = (req, res, next) => {
    if (!req.cookies || !req.cookies.token) {
        return res.redirect('/admin/admin-login');
    }

    try {
        // Verify the token and attach user data to req.admin
        const payload = jwt.verify(req.cookies.token, JWT_SECRET);
        req.admin = payload; // Attach admin data to request object


        next(); // Proceed to the next middleware or controller
    } catch (err) {
        console.error("JWT Verification Error:", err.message);
        return res.redirect('/admin/admin-login');
    }
};

module.exports = authMiddleware;
