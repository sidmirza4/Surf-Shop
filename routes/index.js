// If we don't specify any file name, then by default it's going to look for index.js file

// const indObj = require('../controllers/index');
// const postRegister = indObj.postRegister;
// In ES-6, we can use Object Destructuring, to get the value of keys directly.
// So the above 2 lines of code, is equivalent to what we have used.

const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
    storage
} = require('../cloudinary');
const upload = multer({
    storage
});

const {
    landingPage,
    getAbout,
    getRegister,
    postRegister,
    getLogin,
    postLogin,
    getLogout,
    getProfile,
    updateProfile,
    getForgotPw,
    putForgotPw,
    getReset,
    putReset
} = require('../controllers');
const {
    asyncErrorHandler,
    isLoggedIn,
    isValidPassword,
    changePassword
} = require('../middleware');


/* GET home/landing page. */
router.get('/', asyncErrorHandler(landingPage));

/* GET home/landing page. */
router.get('/about', getAbout);

/* GET /register */
router.get('/register', getRegister);

/* POST /register */
router.post('/register', upload.single('image'), asyncErrorHandler(postRegister));

/* GET /login */
router.get('/login', getLogin);

/* POST /login */
router.post('/login', asyncErrorHandler(postLogin));

/* GET /logout */
router.get('/logout', getLogout);

/* GET /profile */
router.get('/profile', isLoggedIn, asyncErrorHandler(getProfile));

/* PUT /profile */
router.put('/profile',
    isLoggedIn,
    upload.single('image'),
    asyncErrorHandler(isValidPassword),
    asyncErrorHandler(changePassword),
    asyncErrorHandler(updateProfile)
);

/* GET /forgot-password */
router.get('/forgot-password', getForgotPw);

/* PUT /forgot-password */
router.put('/forgot-password', asyncErrorHandler(putForgotPw));

/* GET /reset/:token */
router.get('/reset/:token', asyncErrorHandler(getReset));

/* PUT /reset/:token */
router.put('/reset/:token', asyncErrorHandler(putReset));

module.exports = router;