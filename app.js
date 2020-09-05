// require('dotenv').config();
const createError = require('http-errors');
const express = require('express');
const engine = require('ejs-mate');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const passport = require('passport');
const session = require('express-session');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const favicon = require('serve-favicon');
const app = express();
const seedPosts = require('./seeds');

// Executing the function and Creating the Posts
// seedPosts();

// Require Models
const User = require('./models/user');

// Require routes
const indexRouter = require('./routes/index');
const postRouter = require('./routes/posts');
const reviewRouter = require('./routes/reviews');

// Connecting to the Database
// var url = process.env.DATABASE_URL || 'mongodb://localhost:27017/surf_shop';
var url = process.env.DATABASE_URL;
mongoose.connect(url, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useFindAndModify: false,
    useCreateIndex: true
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Connection Error!'));
db.once('open', () => {
    console.log('We are connected!');
});

// Set Favicon Path
app.use(favicon(path.join(__dirname, 'public/images', 'favicon.ico')));

// Use ejs-locals for all EJS templates
app.engine('ejs', engine);

// View Engine Setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Set Public Assets Directory
app.use(express.static('public'));

app.use(logger('dev'));
app.use(express.json());
app.use(
    express.urlencoded({
        extended: true
    })
);
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(methodOverride('_method'));

// Add moment to every view
app.locals.moment = require('moment');

// Configuring Passport & Sessions
// We must configure Sessions before Passport, as Passport depends on it.
app.use(
    session({
        secret: 'hang ten dude!',
        resave: false,
        saveUninitialized: true
    })
);
app.use(passport.initialize());
app.use(passport.session());
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Set Local Variables Middleware
app.use(function(req, res, next) {
    // req.user = {
    //     // '_id': '5eea52b0b39efc6bc196c952',
    //     // '_id': '5eeb0c96cfa2252398018ba1',
    //     '_id': '5eec5ec988a5822779059a33',
    //     'username': 'elemento3'
    // };
    res.locals.currentUser = req.user;
    // Set Default Page Title
    res.locals.title = 'Surf Shop';
    // Set Success Flash Message
    res.locals.success = req.session.success || '';
    delete req.session.success;
    // Set Error Flash Message
    res.locals.error = req.session.error || '';
    delete req.session.error;
    // Continue onto next funtion in Middleware Chain
    next();
});

// Configuring / Mounting Routes
app.use('/', indexRouter);
app.use('/posts', postRouter);
app.use('/posts/:id/reviews', reviewRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404));
});

// Error Handler
app.use(function(err, req, res, next) {
    // // set locals, only providing error in development
    // res.locals.message = err.message;
    // res.locals.error = req.app.get('env') === 'development' ? err : {};

    // // render the error page
    // res.status(err.status || 500);
    // res.render('error');
    console.log(err);
    req.session.error = err.message;
    res.redirect('back');
});

module.exports = app;