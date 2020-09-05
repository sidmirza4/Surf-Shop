// When we use catch(next), it basically catches the Error if there is one, which it passes ...
// ... onto express, which haS it's default handling set-up, that it it renders, error.ejs template

const Review = require('../models/review');
const User = require('../models/user');
const Post = require('../models/post');
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapBoxToken = process.env.MAPBOX_TOKEN;

const {
    cloudinary
} = require('../cloudinary');
const {
    query
} = require('express');
const {
    db
} = require('../models/review');
const geocodingClient = mbxGeocoding({
    accessToken: mapBoxToken
});

function escapeRegExp(string) {
    return string.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

const middleware = {
    asyncErrorHandler: (fn) =>
        (req, res, next) => {
            Promise.resolve(fn(req, res, next)).catch(next);
        },
    isReviewAuthor: async(req, res, next) => {
        let review = await Review.findById(req.params.review_id);
        if (review.author.equals(req.user._id) || req.user.adminCode === process.env.ADMIN_CODE) {
            return next();
        }
        req.session.error = "Bye Bye!";
        return res.redirect('/');
    },
    isLoggedIn: (req, res, next) => {
        if (req.isAuthenticated()) return next();
        req.session.error = 'You need to be logged in to do that!';
        req.session.redirectTo = req.originalUrl;
        res.redirect('/login');
    },
    isAuthor: async(req, res, next) => {
        const post = await Post.findById(req.params.id);
        if (post.author.equals(req.user._id) || req.user.adminCode === process.env.ADMIN_CODE) {
            res.locals.post = post;
            return next();
        }
        req.session.error = 'Access Denied!';
        res.redirect('back');
    },
    isValidPassword: async(req, res, next) => {
        const {
            user
        } = await User.authenticate()(req.user.username, req.body.currentPassword);
        if (user) {
            // Add User to res.locals, so that we can access the User Object easily
            res.locals.user = user;
            next();
        } else {
            middleware.deleteProfileImage(req);
            req.session.error = 'Incorrect Current Password!';
            return res.redirect('/profile');
        }
    },
    changePassword: async(req, res, next) => {
        const {
            newPassword,
            passwordConfirmation
        } = req.body;

        if (newPassword && !passwordConfirmation) {
            middleware.deleteProfileImage(req);
            req.session.error = 'Missing Password Confirmation!';
            return res.redirect('/profile');
        } else if (newPassword && passwordConfirmation) {
            const {
                user
            } = res.locals;
            if (newPassword === passwordConfirmation) {
                await user.setPassword(newPassword);
                next();
            } else {
                middleware.deleteProfileImage(req);
                req.session.error = 'New Passwords must match!';
                return res.redirect('/profile');
            }
        } else {
            next();
        }
    },
    deleteProfileImage: async req => {
        if (req.file) await cloudinary.v2.uploader.destroy(req.file.public_id);
    },

    async searchAndFilterPosts(req, res, next) {
        // Pull keys from req.query (if there are any) & assign them to queryKeys variable as an ...
        // ... Array of String Values
        const queryKeys = Object.keys(req.query);

        // Check if queryKeys array has any values in it. If true then we know that req.query has ...
        // ... properties which means the user either clicked the paginate button (Page Number) or ...
        // ... submitted the serach/filter form or both
        if (queryKeys.length) {
            // Initialize an empty array to store our dbQueries (objects) in
            const dbQueries = [];
            // Destructure all potential properties from req.query
            let {
                search,
                price,
                avgRating,
                location,
                distance
            } = req.query;

            // Check if search exists, if it does then we know that the user submitted the ..
            // .. search/filter form with a search query
            if (search) {
                // Convert search to a regular expression & escape any special characters
                search = new RegExp(escapeRegExp(search), 'gi');
                // Create a db query object & push it into the dbQueries array. Now the DB will ..
                // .. know to search the title, description & location fields, using the search ..
                // .. regular expression
                dbQueries.push({
                    $or: [{
                            title: search
                        },
                        {
                            description: search
                        },
                        {
                            location: search
                        }
                    ]
                });
            }

            // Check if location exists, if it does then we know that the user submitted the ..
            // .. search/filter form with a location query
            if (location) {
                let coordiantes;
                try {
                    if (typeof JSON.parse(location) === 'number') {
                        throw new Error;
                    }
                    location = JSON.parse(location);
                    coordinates = location;
                } catch (err) {
                    // Geocode the location to extract geo-coordinates (lat,lng)
                    const response = await geocodingClient.forwardGeocode({
                        query: location,
                        limit: 1
                    }).send();
                    // Getting the coordinates [<longitude>,<latitude>]
                    coordinates = response.body.features[0].geometry.coordinates;
                }
                // Get the max distance or set it to 25 miles
                let maxDistance = distance || 25;
                // We need to convert the distance to meters, and so we use the following conversion
                maxDistance *= 1609.34;
                // Create a db query object for proximity searching via location (geometry) & push ..
                // .. it into the dbQueries Array
                dbQueries.push({
                    geometry: {
                        $near: {
                            $geometry: {
                                type: 'Point',
                                coordinates
                            },
                            $maxDistance: maxDistance
                        }
                    }
                });
            }

            // Check if price exists, if it does then we know that the user submitted the ..
            // .. search/filter form with a price query (min,max or both)
            if (price) {
                // Check individual min/max values and create a db query object for each, then ..
                // .. push the object into the dbQueries array. min will search for all post ..
                // .. documents with price greater than or equal to ($gte) the min value. max ..
                // .. will search for all post documents with price less than or equal to ($lte) the max value
                if (price.min) {
                    dbQueries.push({
                        price: {
                            $gte: price.min
                        }
                    });
                }
                if (price.max) {
                    dbQueries.push({
                        price: {
                            $lte: price.max
                        }
                    });
                }
                console.log(price);
                console.log(price.min);
                console.log(price.max);
            }

            // Check if avgRating exists, if it does then we know that the user submitted the ..
            // .. search/filter form with a avgRating query (0-5 stars)
            if (avgRating) {
                // Create a db query object that finds any post documents where the avgRating ..
                // .. value is included in the avgRating array (Eg: [0,1,2,3,4,5])
                dbQueries.push({
                    avgRating: {
                        $in: avgRating
                    }
                });
            }

            // Pass database query to next middleware in route's middleware chain which is the ..
            // .. postIndex method from /controllers/postsController.js
            res.locals.dbQuery = dbQueries.length ? {
                $and: dbQueries
            } : {};
        }

        // Pass req.query to the view as a local variable to be used in the searchAndFilter.ejs partial
        // This allows us to maintain the state of the searchAndFilter form
        res.locals.query = req.query;

        // Build the paginateUrl for paginatePosts partial
        // First remove 'page' string value from queryKeys array, if it exists
        queryKeys.splice(queryKeys.indexOf('page'), 1);

        // Now check if queryKeys has any other values, if it does, then we know the user submitted the ..
        // .. search/filter form, if it doesn't, then they are on /posts or a specific page from /posts, ..
        // .. Eg: /posts?page=2. We assign the delimiter based on whether or not the user submitted the ..
        // .. search/filter form. If they submitted the search/filter form then we want page=N to come ..
        // .. at the end of the query string, Eg: /posts?search=surfboard&page=N.
        // But if they didn't submit the search/filter form, then we want it to be the first (and only)
        // value in the query string, which would mean it needs a ? delimiter/prefix
        // Eg: /posts?page=N, *N represents a whole number greater than 0, Eg: 1

        const delimiter = queryKeys.length ? '&' : '?';
        // Build the paginateUrl local variable to be used in the paginatePosts.ejs partial
        // Do this by taking the originalUrl & replacing any match of ?page=N or &page=N with an ..
        // .. empty string, then append the proper delimiter and page= to the end. The actual page ..
        // .. number gets assigned in the paginatePosts.ejs partial.
        res.locals.paginateUrl = req.originalUrl.replace(/(\?|\&)page=\d+/g, '') + `${delimiter}page=`;

        // Move to the next middleware (postIndex method)
        next();
    }
};

module.exports = middleware;

// User.authenticate is a higher order function, which returns a Function. The function which is ...
// ... returned, takes in 2 arguments, username & password to authentcate a User.
// We are taking the username from the req.user object, instead of the value from the form (req.body) ...
// ... as the user might be trying to change the Username in itself.

// We have now updated the way we are exporting the middleware methods
// The reason being in the previous method, there was an issue, that inside arrow functions ...
// ... we were unable to use 'this' keyword in order to access another method inside the middleware
// But with the updated syntax, we can use middleware.methodName to call another method.

// Multer has to come before body-parser related stuff, that's why we have to create this ...
// ... deleteProfileImage middleware, to make sure that if we encounter an error, while validation ...
// ... we delete the already uploaded image from the Cloudinary.