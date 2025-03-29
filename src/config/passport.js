const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const AppleStrategy = require('passport-apple').Strategy;
const { User } = require('../models');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');




function generateRandomPassword(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let genpassword = '';
    for (let i = 0; i < length; i++) {
        genpassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return genpassword;
}

// Google OAuth Strategy
passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: '/auth/google/callback'
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                // Look up user by email provided in the Google profile
                let user = await User.findOne({ where: { email: profile.emails[0].value } });

                const rawPassword = generateRandomPassword(12);

                const hashedPassword = await bcrypt.hash(rawPassword, 10);

                // If user doesn't exist, create a new user
                if (!user) {
                    user = await User.create({
                        first_name: profile.name.givenName || '',
                        last_name: profile.name.familyName || '',
                        email: profile.emails[0].value,
                        password: hashedPassword, // OAuth users don't require a password
                        // Optionally, save google id if needed: google_id: profile.id
                    });
                }

                // Continue with the authenticated user
                return done(null, user);
            } catch (error) {
                return done(error, null);
            }
        }
    )
);

// Apple OAuth Strategy
passport.use(
    new AppleStrategy(
        {
            clientID: process.env.APPLE_CLIENT_ID,
            teamID: process.env.APPLE_TEAM_ID,
            keyID: process.env.APPLE_KEY_ID,
            privateKey: process.env.APPLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            callbackURL: '/auth/apple/callback',
            scope: ['email', 'name']
        },
        async (accessToken, refreshToken, idToken, profile, done) => {
            try {
                let user = await User.findOne({ where: { email: profile.email } });

                const rawPassword = generateRandomPassword(12);

                const hashedPassword = await bcrypt.hash(rawPassword, 10);


                if (!user) {
                    user = await User.create({
                        first_name: profile.name?.firstName || '',
                        last_name: profile.name?.lastName || '',
                        email: profile.email,
                        password: hashedPassword, // OAuth users don't require a password
                        // Optionally, save apple id if needed: apple_id: profile.id
                    });
                }

                return done(null, user);
            } catch (error) {
                return done(error, null);
            }
        }
    )
);

// (Optional) Serialize and deserialize user for session support.
// When using JWT and stateless sessions, these may not be necessary.
passport.serializeUser((user, done) => {
    done(null, user.id);
});
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findByPk(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

module.exports = passport;
