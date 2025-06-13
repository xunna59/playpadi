const { User, BookingPlayers, SportsCenter, FavouriteSportsCenter } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const UserActivityController = require('./userActivityController');
const flexibleUpload = require('../middleware/uploadMiddleware');
const sendPushNotification = require('../utils/notification');
const { Op } = require('sequelize');



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

  // Regular user login
  login: async (req, res) => {
    try {
      const { email, password } = req.body;
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
        description: 'You Recently Logged into your Account.'
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



  googleAuthCallback: (req, res) => {
    passport.authenticate('google', { session: false }, (err, user) => {
      if (err || !user) {
        return res.redirect('playpadi://auth?error=GoogleAuthFailed');
      }

      // Generate JWT for the authenticated user
      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '180d' }
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
      try {
        sanitizedUser.preferences = JSON.parse(sanitizedUser.preferences || '{}');
      } catch (err) {
        sanitizedUser.preferences = {};
      }

      sanitizedUser.preferences = {
        best_hand: sanitizedUser.preferences.best_hand ?? 'not set',
        court_position: sanitizedUser.preferences.court_position ?? 'not set',
        match_type: sanitizedUser.preferences.match_type ?? 'not set',
        play_time: sanitizedUser.preferences.play_time ?? 'not set'
      };

      // Parse and default interests
      try {
        sanitizedUser.interests = JSON.parse(sanitizedUser.interests || '{}');
      } catch (err) {
        sanitizedUser.interests = {};
      }

      sanitizedUser.interests = {
        player_interests: sanitizedUser.interests.player_interests ?? 'not set'
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

      // Basic updates
      user.first_name = first_name ?? user.first_name;
      user.last_name = last_name ?? user.last_name;
      user.phone = phone ?? user.phone;
      user.gender = gender ?? user.gender;
      user.dob = dob ?? user.dob;
      user.bio = bio ?? user.bio;
      user.points = points ?? user.points;
      //  user.display_picture = display_picture ?? user.display_picture;

      // Merge preferences (TEXT field stored as JSON string)
      if (preferences) {
        let currentPrefs = {};
        try {
          currentPrefs = JSON.parse(user.preferences || '{}');
        } catch (err) {
          console.error('Invalid existing preferences JSON:', err);
        }

        const mergedPrefs = {
          ...currentPrefs,
          ...preferences
        };

        user.preferences = JSON.stringify(mergedPrefs);
      }

      // Merge interests (TEXT field stored as JSON string)
      if (interests) {
        let currentInterests = {};
        try {
          currentInterests = JSON.parse(user.interests || '{}');
        } catch (err) {
          console.error('Invalid existing interests JSON:', err);
        }

        const mergedInterests = {
          ...currentInterests,
          ...interests
        };

        user.interests = JSON.stringify(mergedInterests);
      }

      await user.save();

      const { password, id, created_at, updated_at, ...sanitizedUser } = user.toJSON();

      // Parse preferences and apply defaults
      try {
        sanitizedUser.preferences = JSON.parse(sanitizedUser.preferences || '{}');
      } catch (err) {
        sanitizedUser.preferences = {};
      }

      sanitizedUser.preferences = {
        best_hand: sanitizedUser.preferences.best_hand ?? 'not set',
        court_position: sanitizedUser.preferences.court_position ?? 'not set',
        match_type: sanitizedUser.preferences.match_type ?? 'not set',
        play_time: sanitizedUser.preferences.play_time ?? 'not set'
      };

      // Parse interests and apply defaults
      try {
        sanitizedUser.interests = JSON.parse(sanitizedUser.interests || '{}');
      } catch (err) {
        sanitizedUser.interests = {};
      }

      sanitizedUser.interests = {
        player_interests: sanitizedUser.interests.player_interests ?? 'not set'
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
      const sportsCenterId = req.params.id;

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











};

module.exports = UsersController;
