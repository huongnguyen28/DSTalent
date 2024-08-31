module.exports = (mongoose) => {
    const postSchema = new mongoose.Schema({
        community_id: { type: Number, required: true },
        caption: { type: String, required: true },
        creator_name: { type: String, required: true },
        creator_id: { type: Number, required: true },
        attachments: [{
            url: { type: String, required: true },
            type: { type: String, required: true } // Ví dụ: 'image/png', 'video/mp4'
        }],
        likes: [{
            userID: { type: Number, required: true },
            userName: { type: String, required: true }
        }],
        comments: [{
            text: { type: String, required: true },
            creator_id: { type: Number, required: true },
            creator_name: { type: String, required: true },
            attachment: {
                url: { type: String, required: true },
                type: { type: String, required: true } // Ví dụ: 'image/png', 'video/mp4'
            },
            createdAt: { type: Date, default: Date.now },
            updatedAt: { type: Date, default: Date.now }
        }]
    }, { timestamps: true, strict: true });

    const Post = mongoose.model('Post', postSchema);
    return Post;
};