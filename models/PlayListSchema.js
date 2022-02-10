const mongoose = require("mongoose");

const PlayListSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    images: [{
        type: String,
        required: true,
    }],
    price: {
        type: Number,
        required: true,
    },
    desc: {
        type: String,
        default: ''
    },
    videos: [{
        type: mongoose.Types.ObjectId,
        ref: 'lmsappplayvideos',
    }],
}, {
    timestamps: true
});


const LmsAppPlayLists = mongoose.model('LmsAppPlayLists', PlayListSchema);

module.exports = LmsAppPlayLists