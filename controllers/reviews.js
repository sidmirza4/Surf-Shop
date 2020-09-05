const Post = require('../models/post');
const Review = require('../models/review');

module.exports = {

    // Reviews Create
    async reviewCreate(req, res, next) {
        // Find the Post by it's ID
        // When we weren't checking if the User has already created a review or not..
        // .. we didn't had to pupulate the Reviews, cause we were just pushing the new Review ..
        // .. into the Reviews Array. But now, when we are checking it, we need have to have access to ..
        // .. the authors of the Reviews. which is done by Populate. It takes the Object IDs and fill ..
        // .. them with Review Objects.
        let post = await Post.findById(req.params.id).populate('reviews').exec();

        // Filter method returns us an  Array, based on some Search Parameter
        let haveReviewed = post.reviews.filter(review => {
            return review.author.equals(req.user._id);
        }).length;
        if (haveReviewed) {
            req.session.error = 'Sorry, you can only create one Review per Post!';
            return res.redirect(`/posts/${post.id}`);
        }

        // Create the Review
        req.body.review.author = req.user._id;
        let review = await Review.create(req.body.review);
        // Assign Review to Post
        post.reviews.push(review);
        // Save the Post
        post.save();
        // Redirect to the Post
        req.session.success = 'Review Created Successfully!';
        res.redirect(`/posts/${post.id}`);
    },

    // Reviews Update
    async reviewUpdate(req, res, next) {
        await Review.findByIdAndUpdate(req.params.review_id, req.body.review);
        req.session.success = 'Review Updated Successfully!';
        res.redirect(`/posts/${req.params.id}`);
    },

    // Reviews Destroy
    async reviewDestroy(req, res, next) {
        await Post.findByIdAndUpdate(req.params.id, {
            $pull: {
                reviews: req.params.review_id
            }
        });
        await Review.findByIdAndRemove(req.params.review_id);
        req.session.success = 'Review Deleted Successfully!';
        res.redirect(`/posts/${req.params.id}`);
    }
}