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
    postIndex,
    postNew,
    postCreate,
    postShow,
    postEdit,
    postUpdate,
    postDestroy
} = require('../controllers/posts');
const {
    asyncErrorHandler,
    isLoggedIn,
    isAuthor,
    searchAndFilterPosts
} = require('../middleware');

/* GET posts index '/posts' */
router.get('/', asyncErrorHandler(searchAndFilterPosts), asyncErrorHandler(postIndex));

/* GET posts new '/posts/new' */
router.get('/new', isLoggedIn, postNew);

/* POST posts create '/posts' */
router.post('/', isLoggedIn, upload.array('images', 4), asyncErrorHandler(postCreate));

/* GET posts show '/posts/:id' */
router.get('/:id', asyncErrorHandler(postShow));

/* GET posts edit '/posts/:id/edit' */
router.get('/:id/edit', asyncErrorHandler(isLoggedIn), asyncErrorHandler(isAuthor), postEdit);

/* PUT posts update '/posts/:id' */
router.put('/:id', asyncErrorHandler(isLoggedIn), asyncErrorHandler(isAuthor), upload.array('images', 4), asyncErrorHandler(postUpdate));

/* DELETE posts destroy '/posts/:id' */
router.delete('/:id', asyncErrorHandler(isLoggedIn), asyncErrorHandler(isAuthor), asyncErrorHandler(postDestroy));

module.exports = router;