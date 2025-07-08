const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const { sequelize } = require('./src/models');
const errorHandler = require('./src/middleware/errorHandler');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');
const methodOverride = require('method-override');

const healthRoutes = require('./src/routes/healthRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const apiRoutes = require('./src/routes/apiRoutes');
const authRoutes = require('./src/routes/authRoutes');



const app = express();

const corsOptions = {
    origin: (origin, callback) => {
        const allowedOrigins = ['http://127.0.0.1', 'http://127.0.0.1:8080', 'http://localhost'];
        if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(methodOverride('_method'));

// // Debugging: Log every request method & URL
// app.use((req, res, next) => {
//     console.log(`[${req.method}] ${req.url}`);
//     next();
// });

app.use(cookieParser());

app.use(session({
    secret: '25b6e2d9f4c7e4d9f2b7e3d70b2fb6b83939qw',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

app.use(flash());
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    next();
});


app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'upload')));


app.set('views', './src/views');
app.set('view engine', 'ejs');


// routes
app.use('/health', healthRoutes);
app.use('/admin', adminRoutes);
app.use('/auth', authRoutes);
app.use('/api', apiRoutes);














app.use(errorHandler);

const start = async () => {
    try {
        await sequelize.sync();
        console.log("Database synced successfully.");

        app.listen(8080, () => {
            console.log("Server is running on http://127.0.0.1:8080");
        });

        process.on('SIGINT', () => {
            app.close(() => {
                console.log('Server closed');
                process.exit(0);
            });
        });

        process.on('SIGTERM', () => {
            app.close(() => {
                console.log('Server closed');
                process.exit(0);
            });
        });

    } catch (error) {
        console.error("Unable to sync database:", error);
    }
};

start();