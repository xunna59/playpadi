const { User, BookingPlayers, SportsCenter, FavouriteSportsCenter, UserActivity, Bookings, Court, AcademyStudents, Academy } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const UserActivityController = require('./userActivityController');
const flexibleUpload = require('../middleware/uploadMiddleware');
const sendPushNotification = require('../utils/notification');
const { Op } = require('sequelize');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const { validationResult } = require('express-validator');
const sendEmail = require('../utils/sendEmail');




function generateRandomPassword(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let genpassword = '';
  for (let i = 0; i < length; i++) {
    genpassword += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return genpassword;
}


const UsersController = {

  renderManageUsers: async (req, res, next) => {

    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = 20;
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


  renderViewUser: async (req, res, next) => {
    try {
      const { userid } = req.params;
      const page = parseInt(req.query.page) || 1;
      const academyPage = parseInt(req.query.academyPage) || 1;
      const limit = 15;

      const [user, publicMatchCount, privateMatchCount] = await Promise.all([
        User.findByPk(userid),
        BookingPlayers.count({ where: { user_id: userid } }),
        Bookings.count({ where: { user_id: userid, booking_type: 'private' } })
      ]);

      if (!user) return res.status(404).json({ message: "User not found" });

      const total_matches_played = publicMatchCount + privateMatchCount;

      const sanitizeDisplayPicture = (pic) => {
        if (typeof pic === 'string') return pic.trim().replace(/^"|"$/g, '');
        return '';
      };

      const parsePrefs = (input, fallback = {}) => {
        try {
          let data = typeof input === 'string' ? JSON.parse(input) : input;
          if (typeof data === 'string') data = JSON.parse(data);
          return typeof data === 'object' && data !== null ? data : fallback;
        } catch {
          return fallback;
        }
      };

      const sanitizedUser = {
        ...user.toJSON(),
        display_picture: sanitizeDisplayPicture(user.display_picture),
        preferences: {
          best_hand: 'not set',
          court_position: 'not set',
          match_type: 'not set',
          play_time: 'not set',
          ...parsePrefs(user.preferences)
        },
        total_matches_played
      };

      // Fetch private and joined public bookings concurrently
      const [privateBookings, joinedBookingLinks] = await Promise.all([
        Bookings.findAll({
          where: { user_id: userid, booking_type: 'private' },
          include: [{ model: User, as: 'user' }, { model: Court, as: 'court' }]
        }),
        BookingPlayers.findAll({ where: { user_id: userid } })
      ]);

      const joinedBookingIds = joinedBookingLinks.map(link => link.bookings_id);

      const publicBookings = joinedBookingIds.length > 0
        ? await Bookings.findAll({
          where: {
            id: joinedBookingIds,
            booking_type: 'public',

          },
          include: [{ model: User, as: 'user' }, { model: Court, as: 'court' }]
        })
        : [];

      const combinedBookings = [...privateBookings, ...publicBookings].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );

      const bookingOffset = (page - 1) * limit;
      const paginatedBookings = combinedBookings.slice(bookingOffset, bookingOffset + limit);
      const totalBookingPages = Math.ceil(combinedBookings.length / limit);

      // Fetch Academy Students
      const academyOffset = (academyPage - 1) * limit;
      const academyData = await AcademyStudents.findAndCountAll({
        where: { user_id: userid },
        include: [{ model: Academy, as: 'academy' }],
        limit,
        offset: academyOffset,
        order: [['created_at', 'DESC']]
      });

      const totalAcademyPages = Math.ceil(academyData.count / limit);


      const activities = await UserActivity.findAll({
        where: { user_id: userid },
        order: [['created_at', 'DESC']],
        limit: 10, // Always return only the latest 10
        attributes: {
          exclude: ['updated_at'],
        },
      });

      const formattedActivities = activities.map(activity => {
        const {
          id,
          user_id,
          activity_type,
          description,
          ip_address,
          device,
          created_at,
        } = activity.toJSON();

        const base = {
          id,
          user_id,
          activity_type,
          description,
          ip_address,
          created_at,
        };

        // Only include device if activity_type is login
        if (activity_type === 'login') {
          base.device = device || 'Unknown';
        }

        return base;
      });


      return res.render('users/manage-user', {
        title: `Manage ${user.first_name}`,
        admin: req.admin,
        user: sanitizedUser,
        bookings: paginatedBookings,
        pagination: {
          offset: bookingOffset,
          total: combinedBookings.length,
          totalPages: totalBookingPages,
          currentPage: page,
          baseUrl: `/admin/manage-user/${userid}`
        },
        academyStudents: academyData.rows,
        activities: formattedActivities,
        academyPagination: {
          offset: academyOffset,
          total: academyData.count,
          totalPages: totalAcademyPages,
          currentPage: academyPage,
          baseUrl: `/admin/manage-user/${userid}`
        }
      });
    } catch (error) {
      console.error("Error in renderViewUser:", error);
      next(error);
    }
  },





  renderManageUsersJson: async (req, res, next) => {
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

      res.status(200).json({
        success: true,
        message: 'Users retrieved successfully',
        data: {
          users,
          count,
          currentPage: page,
          totalPages,
          limit,
          offset,
        },
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

      const existingphone = await User.findOne({ where: { phone } });

      if (existingphone) {
        return res.status(409).json({ message: 'An account already exists with this Phone Number.' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await User.create({
        first_name,
        last_name,
        email,
        phone,
        password: hashedPassword
      });

      const payload = { id: user.id, email: user.email, user_type: 'User' };
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '180d' });

      await UsersController.sendVerificationEmail(user);



      return res.status(201).json({
        success: true,
        message: "User created successfully",
        // user: {
        //     firstname: user.first_name,
        //     lastname: user.last_name,
        //     phone_number: user.phone,
        //     email: user.email,

        // },
        token

      });

    } catch (error) {
      return res.status(500).json({ message: 'Error registering user', error });
    }
  },

  sendVerificationEmail: async (user, res) => {
    // Create a verification token
    const verificationToken = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' } // Token expires in 1 hour
    );

    // Generate a verification link
    const verificationLink = `https://app.playpadi.com/auth/verify-account?token=${verificationToken}`;

    await sendEmail(user.email, 'Email Verification', 'verification', user.firstname, verificationLink);



  },


  resendVerificationEmail: async (req, res, next) => {
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
      const email = req.body.email || req.user.email;

      if (!email) {
        return res.status(400).json({ success: false, message: 'Email is required' });
      }

      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      if (user.email_verified) {
        return res.status(400).json({ success: false, message: 'Email is already verified' });
      }

      // Call the sendVerificationEmail function to generate a token and send the email
      await UsersController.sendVerificationEmail(user);

      res.status(200).json({ success: true, message: 'Verification email sent successfully' });
    } catch (error) {
      next(error);
    }
  },

  // Regular user login
  login: async (req, res) => {
    try {
      const { email, password, device_type, device_name } = req.body;
      const user = await User.findOne({ where: { email } });
      if (!user) return res.status(404).json({ message: 'Invalid Sign In credentials' });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(401).json({ message: 'Invalid Sign In credentials' });

      const token = jwt.sign(
        { id: user.id, email: user.email, user_type: 'User' },
        process.env.JWT_SECRET,
        { expiresIn: '180d' }
      );

      await UserActivityController.log({
        user_id: user.id,
        activity_type: 'login',
        description: 'You Recently Logged into your Account.',
        device: `${device_type || 'Unknown'} - ${device_name || 'Unknown Device'}`
      }, req);

      return res.status(200).json({ message: 'Login successful', token, });
    } catch (error) {
      return res.status(500).json({ message: 'Error logging in', error });
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
      return res.status(500).json({ message: 'Error checking email', error });
    }
  },


  googleAuthenticate: async (req, res) => {
    const { idToken } = req.body;

    try {
      const ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID, // same as web client ID used in Flutter
      });

      const payload = ticket.getPayload();
      const email = payload.email;

      let user = await User.findOne({ where: { email } });

      if (!user) {
        const rawPassword = generateRandomPassword(12);
        const hashedPassword = await bcrypt.hash(rawPassword, 10);

        user = await User.create({
          first_name: payload.given_name || '',
          last_name: payload.family_name || '',
          email: email,
          password: hashedPassword,
          email_verified: true
        });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '180d' }
      );

      return res.json({ token, user });
    } catch (error) {
      console.error('Google auth failed:', error);
      return res.status(401).json({ error: 'Invalid Google token' });
    }
  },


  // googleAuthCallback: (req, res) => {
  //   passport.authenticate('google', { session: false }, (err, user) => {
  //     if (err || !user) {
  //       return res.redirect('playpadi://auth?error=GoogleAuthFailed');
  //     }

  //     // Generate JWT for the authenticated user
  //     const token = jwt.sign(
  //       { id: user.id, email: user.email },
  //       process.env.JWT_SECRET,
  //       { expiresIn: '180d' }
  //     );

  //     // Redirect to Flutter app with the token
  //     return res.redirect(`playpadi://auth?token=${token}`);
  //   })(req, res);
  // },

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
        { expiresIn: '180d' }
      );
      return res.status(200).json({ message: 'Apple login successful', token });
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

      const total_matches_played = await BookingPlayers.count({ where: { user_id: userId } });



      const sanitizedUser = user.toJSON();


      if (sanitizedUser.display_picture && typeof sanitizedUser.display_picture === 'string') {
        sanitizedUser.display_picture = sanitizedUser.display_picture.trim();
        if (
          sanitizedUser.display_picture.startsWith('"') &&
          sanitizedUser.display_picture.endsWith('"')
        ) {
          sanitizedUser.display_picture = sanitizedUser.display_picture.slice(1, -1);
        }
      }

      // Parse and default preferences
      const safeParse = (input, defaultVal = {}) => {
        try {
          if (!input) return defaultVal;

          let parsed = input;

          if (typeof parsed === 'string') {
            parsed = JSON.parse(parsed);
            if (typeof parsed === 'string') {
              parsed = JSON.parse(parsed); // handle double-stringified
            }
          }

          return typeof parsed === 'object' && parsed !== null ? parsed : defaultVal;
        } catch (err) {
          console.error('Safe parse failed:', err);
          return defaultVal;
        }
      };

      // Use safe parser for preferences
      const parsedPrefs = safeParse(sanitizedUser.preferences);
      sanitizedUser.preferences = {
        best_hand: parsedPrefs.best_hand ?? 'not set',
        court_position: parsedPrefs.court_position ?? 'not set',
        match_type: parsedPrefs.match_type ?? 'not set',
        play_time: parsedPrefs.play_time ?? 'not set'
      };

      // Use safe parser for interests
      const parsedInterests = safeParse(sanitizedUser.interests);
      sanitizedUser.interests = {
        player_interests: parsedInterests.player_interests ?? 'not set'
      };




      sanitizedUser.total_matches_played = total_matches_played;

      return res.status(200).json({ user: sanitizedUser });

    } catch (error) {
      console.error('Get profile error:', error);
      return res.status(500).json({ message: 'Error retrieving profile', error });
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
        interests,
        points,
        // display_picture
      } = req.body;

      const user = await User.findByPk(userId);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Apply basic profile updates
      user.first_name = first_name ?? user.first_name;
      user.last_name = last_name ?? user.last_name;
      user.phone = phone ?? user.phone;
      user.gender = gender ?? user.gender;
      user.dob = dob ?? user.dob;
      user.bio = bio ?? user.bio;
      user.points = points ?? user.points;

      // Safe JSON parser for raw, stringified, or double-stringified JSON
      const safeParse = (input, defaultVal = {}) => {
        try {
          if (!input) return defaultVal;

          let parsed = input;

          if (typeof input === 'string') {
            parsed = JSON.parse(input);
            if (typeof parsed === 'string') {
              parsed = JSON.parse(parsed); // double-stringified
            }
          }

          return typeof parsed === 'object' && parsed !== null ? parsed : defaultVal;
        } catch (err) {
          console.error('Failed to safely parse input:', input, err);
          return defaultVal;
        }
      };

      // Debug logs (optional)
      // console.log('RAW preferences:', preferences);
      // console.log('RAW interests:', interests);

      // Merge preferences
      const currentPrefs = safeParse(user.preferences, {});
      const newPrefs = safeParse(preferences, {});
      const mergedPrefs = { ...currentPrefs, ...newPrefs };
      user.preferences = JSON.stringify(mergedPrefs);

      // Merge interests
      const currentInterests = safeParse(user.interests, {});
      const newInterests = safeParse(interests, {});
      const mergedInterests = { ...currentInterests, ...newInterests };
      user.interests = JSON.stringify(mergedInterests);

      // Save updated user
      await user.save();

      // Sanitize user object
      const {
        password,
        id,
        created_at,
        updated_at,
        ...sanitizedUser
      } = user.toJSON();

      // Parse and apply default values to preferences
      const parsedPrefs = safeParse(sanitizedUser.preferences, {});
      sanitizedUser.preferences = {
        best_hand: parsedPrefs.best_hand ?? 'not set',
        court_position: parsedPrefs.court_position ?? 'not set',
        match_type: parsedPrefs.match_type ?? 'not set',
        play_time: parsedPrefs.play_time ?? 'not set'
      };

      // Parse and apply default values to interests
      const parsedInterests = safeParse(sanitizedUser.interests, {});
      sanitizedUser.interests = {
        player_interests: parsedInterests.player_interests ?? 'not set'
      };

      return res.status(200).json({
        message: 'Profile updated successfully',
        user: sanitizedUser
      });

    } catch (error) {
      console.error('Update profile error:', error);
      return res.status(500).json({ message: 'Error updating profile', error });
    }
  },



  update_dp: async (req, res) => {
    flexibleUpload.single('display_picture')(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }

      if (!req.file) {
        return res.status(400).json({ success: false, message: 'Please upload an image' });
      }

      try {
        const userId = req.user.id;

        const user = await User.findByPk(userId);
        if (!user) {
          return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Update user's display picture
        user.display_picture = req.file.filename;
        await user.save();

        res.status(200).json({
          success: true,
          message: "Profile picture updated successfully",
          data: { display_picture: user.display_picture }
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: "Error updating profile picture",
          error: error.message
        });
      }
    });
  },





  updateFCMToken: async (req, res) => {
    try {
      const userId = req.user.id;
      const { fcm_token } = req.body;

      if (!fcm_token) {
        return res.status(400).json({ message: 'FCM token is required.' });
      }

      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found.' });
      }

      user.fcm_token = fcm_token;
      await user.save();

      return res.status(200).json({ message: 'FCM token updated successfully.' });
    } catch (error) {
      console.error('Error updating FCM token:', error);
      return res.status(500).json({ message: 'Error updating FCM token', error });
    }
  },

  getFCMToken: async (req, res) => {
    try {
      const userId = req.user.id;

      const user = await User.findByPk(userId, {
        attributes: ['fcm_token']
      });

      if (!user) {
        return res.status(404).json({ message: 'User not found.' });
      }

      return res.status(200).json({ fcm_token: user.fcm_token });
    } catch (error) {
      console.error('Error retrieving FCM token:', error);
      return res.status(500).json({ message: 'Error retrieving FCM token', error });
    }
  },

  notifyUser: async (req, res) => {

    const { userId, title, body } = req.body;

    try {
      const user = await User.findByPk(userId);

      if (!user || !user.fcm_token) {
        return res.status(404).json({ message: 'User or FCM token not found' });
      }

      const result = await sendPushNotification(user.fcm_token, title, body);

      if (result.success) {
        return res.status(200).json({ message: 'Notification sent' });
      } else {
        return res.status(500).json({ message: 'Failed to send notification', error: result.error });
      }

    } catch (error) {
      return res.status(500).json({ message: 'Server error', error });
    }
  },


  notifyAllUsers: async (req, res) => {
    const { title, body } = req.body;

    try {
      const users = await User.findAll({
        where: {
          fcm_token: { [Op.ne]: null }, // Users with non-null FCM tokens
        },
      });

      if (users.length === 0) {
        return res.status(404).json({ message: 'No users with FCM tokens found' });
      }

      const results = await Promise.all(users.map(user =>
        sendPushNotification(user.fcm_token, title, body)
      ));

      const failures = results.filter(result => !result.success);

      if (failures.length > 0) {
        return res.status(207).json({
          message: `Sent with ${failures.length} failure(s)`,
          failures
        });
      }

      return res.status(200).json({ message: 'Notifications sent successfully' });

    } catch (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  },



  addToFavouriteSportsCenter: async (req, res) => {
    try {

      const userId = req.user.id;

      const user = await User.findByPk(userId);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const { sports_center_id } = req.body;

      // Validate input
      if (!sports_center_id) {
        return res.status(400).json({ error: 'sports_center_id is required.' });
      }

      // Check if the  exists
      const sportsCenter = await SportsCenter.findByPk(sports_center_id);
      if (!sportsCenter) {
        return res.status(404).json({ error: 'Sports Center not found.' });
      }

      const savedCenter = await FavouriteSportsCenter.findOne({
        where: {
          user_id: userId,
          sports_center_id: sports_center_id,
        },
      });

      if (savedCenter) {
        return res.status(404).json({ success: false, message: 'Sports Center already exist in Favourite List' });
      }

      // Add to saved 
      const savedSportsCenter = await FavouriteSportsCenter.create({
        user_id: userId,
        sports_center_id: sports_center_id,
      });




      return res.status(201).json({ success: true, message: 'Sports Center added to Favourite List.', data: savedSportsCenter });
    } catch (error) {
      return res.status(500).json({ error: 'An error occurred while saving the Sports Center.' });
    }
  },


  getFavouriteSportsCenter: async (req, res) => {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;
      const offset = (page - 1) * limit;
      const userId = req.user.id;

      // Fetch total count for pagination
      const total = await FavouriteSportsCenter.count({ where: { user_id: userId } });

      // Fetch saved sports centers with pagination
      const savedSportsCenters = await FavouriteSportsCenter.findAll({
        where: { user_id: userId },
        include: [
          {
            model: SportsCenter,
            as: 'sportsCenterSaved',
            attributes: [
              'id',
              'sports_center_name',
              'sports_center_address',
              'sports_center_features',
              'sports_center_games',
              'cover_image',
              'session_price',
            ],
          },
        ],
        limit,
        offset,
      });

      const formattedCenters = savedSportsCenters.map(item => {
        const center = item.sportsCenterSaved?.toJSON() || {};

        // Parse JSON fields safely
        ['sports_center_games', 'sports_center_features'].forEach(field => {
          if (typeof center[field] === 'string') {
            try {
              center[field] = JSON.parse(center[field]);
            } catch {
              center[field] = [];
            }
          }
        });

        return center;
      });

      return res.status(200).json({
        success: true,
        message: 'All Saved Sports Centers.',
        sportsCenters: formattedCenters,
        pagination: {
          total,
          page,
          totalPages: Math.ceil(total / limit),
          limit,
        },
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        error: 'An error occurred while retrieving saved Sports Centers.',
      });
    }
  },


  removeFromSavedSportsCenter: async (req, res) => {
    try {
      const userId = req.user.id;
      const sportsCenterId = req.params.sportsCenterId;

      // Validate input
      if (!sportsCenterId) {
        return res.status(400).json({ error: 'sportsCenterId is required.' });
      }

      // Check if the saved sports center exists
      const savedCenter = await FavouriteSportsCenter.findOne({
        where: {
          user_id: userId,
          sports_center_id: sportsCenterId,
        },
      });

      if (!savedCenter) {
        return res.status(404).json({ error: 'Saved sports center not found.' });
      }

      // Remove saved sports center
      await savedCenter.destroy();

      return res.status(200).json({
        success: true,
        message: 'Sports center removed from favourite list successfully.',
      });
    } catch (error) {
      console.error('Error removing sports center from favourite list:', error);
      return res.status(500).json({
        error: 'An error occurred while removing the sports center.',
      });
    }
  },



  getUserActivities: async (req, res) => {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;
      const offset = (page - 1) * limit;
      const userId = req.user.id;

      const total = await UserActivity.count({ where: { user_id: userId } });

      const activities = await UserActivity.findAll({
        where: { user_id: userId },
        order: [['created_at', 'DESC']],
        limit,
        offset,
        attributes: {
          exclude: ['updated_at'],
        },
      });

      const formattedActivities = activities.map(activity => {
        const {
          id,
          user_id,
          activity_type,
          description,
          ip_address,
          device,
          created_at,
        } = activity.toJSON();

        const base = {
          id,
          user_id,
          activity_type,
          description,
          ip_address,
          created_at,
        };

        // Only include device if activity_type is login
        if (activity_type === 'login') {
          base.device = device || 'Unknown';
        }

        return base;
      });

      return res.status(200).json({
        success: true,
        message: 'User Activities fetched successfully.',
        activities: formattedActivities,
        pagination: {
          total,
          page,
          totalPages: Math.ceil(total / limit),
          limit,
        },
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        error: 'An error occurred while retrieving user activities.',
      });
    }
  },


  deleteUser: async (req, res) => {
    try {
      const { id } = req.params;

      // Find and delete
      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      await user.destroy();
      req.flash('success_msg', 'User Deleted successfully');
      // Redirect back after delete
      return res.redirect('/admin/manage-users/');
    } catch (error) {
      console.error('Error deleting users:', error);
      return res.status(500).json({ error: 'An error occurred while deleting the user.' });
    }
  },


  requestPasswordReset: async (req, res, next) => {
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
      const { email } = req.body;
      const user = await User.findOne({ where: { email } });

      if (!user) {
        return res.status(200).json({
          success: true,
          message: 'If an account with this email exists, you will receive a password reset email shortly.'
        });
      }

      // Generate a reset token
      const resetToken = jwt.sign({ id: user.id, route: 'password-reset' }, process.env.JWT_SECRET, { expiresIn: '1h' });
      const resetLink = `${process.env.CLIENT_URL}/auth/reset-password?token=${resetToken}`;

      // Send reset email
      await sendEmail(user.email, 'Password Reset Request', 'resetPassword', user.firstname, resetLink);

      res.status(200).json({ success: true, message: 'Password reset email sent successfully' });
    } catch (error) {
      next(error);
    }
  },


  resetPassword: async (req, res, next) => {
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
      const { token, newPassword } = req.body;

      // Verify the reset token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.id);

      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found or token is invalid' });
      }

      // Hash the new password and save it
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;

      await user.save();

      res.status(200).json({ success: true, message: 'Password has been reset successfully' });
    } catch (error) {
      // Check for expired token
      if (error.name === 'TokenExpiredError') {
        return res.status(400).json({ success: false, message: 'Token expired. Please request a new password reset.' });
      }
      next(error);
    }
  },




};

module.exports = UsersController;
