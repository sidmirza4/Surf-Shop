const crypto = require('crypto');
const cloudinary = require('cloudinary');

// We need to have a Unique String, for the Images we are storing in Cloudinary
// That's why we are using Crypto

cloudinary.config({
    cloud_name: 'sidmirza4',
    api_key: '299174319449745',
    api_secret: process.env.CLOUDINARY_SECRET
});

const cloudinaryStorage = require('multer-storage-cloudinary');
const storage = cloudinaryStorage({
    cloudinary: cloudinary,
    folder: 'Surf-Shop',
    allowedFormats: ['jpeg', 'jpg', 'png'],
    filename: function(req, file, cb) {
        let buf = crypto.randomBytes(16);
        buf = buf.toString('hex');
        let uniqFileName = file.originalname.replace(/\.jpeg|\.jpg|\.png/ig, '');
        uniqFileName += buf;
        cb(undefined, uniqFileName);
    }
});

module.exports = {
    cloudinary,
    storage
};