const Post = require('../models/post');
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapBoxToken = process.env.MAPBOX_TOKEN;

const {
    cloudinary
} = require('../cloudinary');
const geocodingClient = mbxGeocoding({
    accessToken: mapBoxToken
});


// If we want to sort the posts, we can either pass an object inside sort property, or a shorter way ...
// ... is to pass a string of the field that you want to sort by. Mongoose will automatically sort by ...
// ... that field, in Ascending Order, and if we want to sort in Descending order, we can ...
// ... put a negative sign in front of the field name inside the Quotes.


module.exports = {

    // Posts Index
    async postIndex(req, res, next) {
        const {
            dbQuery
        } = res.locals;
        delete res.locals.dbQuery;
        let posts = await Post.paginate(dbQuery, {
            page: req.query.page || 1,
            limit: 6,
            sort: '-_id'
        });
        posts.page = Number(posts.page);
        if (!posts.docs.length && res.locals.query) {
            res.locals.error = 'No results match that query!';
        }
        res.render('posts/index', {
            posts,
            mapBoxToken,
            title: 'Posts Index'
        });
    },

    // Posts New
    postNew(req, res, next) {
        res.render('posts/new');
    },

    // Posts Create
    async postCreate(req, res, next) {
        req.body.post.images = [];
        for (const file of req.files) {
            req.body.post.images.push({
                url: file.secure_url,
                public_id: file.public_id
            });
        }
        let response = await geocodingClient.forwardGeocode({
                query: req.body.post.location,
                limit: 1
            })
            .send();
        req.body.post.geometry = response.body.features[0].geometry;
        req.body.post.author = req.user._id;
        let post = new Post(req.body.post);
        post.properties.description = `<strong><a href="/posts/${post._id}">${post.title}</a></strong><p>${post.location}</p><p>${post.description.substring(0, 20)}...</p>`;
        await post.save();
        req.session.success = 'Post Created Successfully!'
        res.redirect(`/posts/${post.id}`);
    },

    // Posts Show
    async postShow(req, res, next) {
        let post = await Post.findById(req.params.id).populate({
            path: 'reviews',
            options: {
                sort: {
                    '_id': -1
                }
            },
            populate: {
                path: 'author',
                model: 'User'
            }
        });
        const floorRating = post.calculateAvgRating();
        // const floorRating = post.avgRating;
        res.render('posts/show', {
            post,
            mapBoxToken,
            floorRating
        });
    },

    // We are using the isAuthor middleware, in which we are passing the concerned Post as a ..
    // .. local variable, i.e. it get passed into the Views as well, that's why we are not ..
    // .. finding it and passing it in the res.render method.

    // Posts Edit
    postEdit(req, res, next) {
        res.render('posts/edit');
    },

    // Posts Update
    async postUpdate(req, res, next) {
        // Since the isAuthor middleware will be running before it, therefore we can have access ...
        // ... to the Post, which is a Local Variable now.
        const {
            post
        } = res.locals;
        // Check if there are any images for Deletion
        if (req.body.deleteImages && req.body.deleteImages.length) {
            // Assign deleteImages from req.body to it's own Variable
            let delImgs = req.body.deleteImages;
            // Loop over delImgs
            for (const public_id of delImgs) {
                // Delete Images from Cloudinary
                await cloudinary.v2.uploader.destroy(public_id);
                // Delete Image from post.images
                for (const image of post.images) {
                    if (image.public_id === public_id) {
                        let index = post.images.indexOf(image);
                        post.images.splice(index, 1);
                    }
                }
            }
        }
        // Check if there are any New Images for Upload
        if (req.files) {
            // Upload Images
            for (const file of req.files) {
                post.images.push({
                    url: file.secure_url,
                    public_id: file.public_id
                });
            }
        }
        // Check if Location was updated
        if (req.body.post.location !== post.location) {
            let response = await geocodingClient.forwardGeocode({
                    query: req.body.post.location,
                    limit: 1
                })
                .send();
            post.geometry = response.body.features[0].geometry;
            post.location = req.body.post.location;
        }
        // Update the post with any new Properties
        post.title = req.body.post.title;
        post.description = req.body.post.description;
        post.price = req.body.post.price;
        post.properties.description = `<strong><a href="/posts/${post._id}">${post.title}</a></strong><p>${post.location}</p><p>${post.description.substring(0, 20)}...</p>`;
        // Save the Updated Post to the DB
        await post.save();
        // Redirect to Show Page
        res.redirect(`/posts/${post.id}`);
    },

    // Posts Destroy
    async postDestroy(req, res, next) {
        const {
            post
        } = res.locals;
        for (const image of post.images) {
            await cloudinary.v2.uploader.destroy(image.public_id);
        }
        await post.remove();
        req.session.success = 'Post Deleted Successfully!';
        res.redirect('/posts');
    }
}