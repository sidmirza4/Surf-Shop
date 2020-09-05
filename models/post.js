const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Review = require('./review');
const mongoosePaginate = require('mongoose-paginate');

const PostSchema = new Schema({
    title: String,
    price: Number,
    description: String,
    images: [{
        url: String,
        public_id: String
    }],
    location: String,
    geometry: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
    properties: {
        description: String
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    reviews: [{
        type: Schema.Types.ObjectId,
        ref: 'Review'
    }],
    avgRating: {
        type: Number,
        default: 0
    }
});

// The reason as to why we are using the keyword 'function' instead of Arror Function is that ...
// .. we need to use 'this' keyword, which if we use an Arrow function, will be an Empty Object.
// This is basically a pre-hook middleware. In the controller, whenever post.remove() is called ...
// .. the following middleware runs before it.
// The following middleware removes all the Reviews that match any of the IDs in the Post.reviews array ...
// .. where the post is the one on which remove method is called.
PostSchema.pre('remove', async function() {
    await Review.remove({
        _id: {
            $in: this.reviews
        }
    });
});

// We are adding an Instance Method, that is any doc in the DB which is a Post Model or any instance ...
// ... of the PostSchema, can call the 'calculateAvgRating' method. Also, we are not using ...
// ... an Arrow function, because in 'Arrow' function, the 'this' keyword is used differently.
PostSchema.methods.calculateAvgRating = function() {
    let ratingsTotal = 0;
    if (this.reviews.length) {
        this.reviews.forEach(review => {
            ratingsTotal += review.rating;
        });
        this.avgRating = (Math.round((ratingsTotal / this.reviews.length) * 10)) / 10;
    } else {
        this.avgRating = ratingsTotal;
    }

    const floorRating = Math.floor(this.avgRating);
    this.save();
    return floorRating;
};

PostSchema.plugin(mongoosePaginate);

// It adds a 2d-sphere index to the geometry field of Post Schema which is a GeoJSON object
PostSchema.index({
    geometry: '2dsphere'
});

module.exports = mongoose.model('Post', PostSchema);