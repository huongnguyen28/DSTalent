const db = require("../configs/db");
const mongoose = require('mongoose');
const Post = db.posts;
const Tag = db.tag;
const PostTag = db.post_tag;

const getPosts = async (req, res) => {
    const { page = 1, searchQuery, tags, creator_id, community_id } = req.query;
    const LIMIT = 8;
    const startIndex = (Number(page) - 1) * LIMIT;

    try {
        let query = {};

        // Ensure community_id is provided
        if (!community_id) {
            return res.status(400).json({
                status: 400,
                message: "Community ID is required"
            });
        }

        // Adding community_id to the query
        query.community_id = Number(community_id);

        // Building the query based on search criteria
        if (searchQuery) {
            query.caption = { $regex: searchQuery, $options: 'i' };
        }

        if (creator_id) {
            query.creator_id = Number(creator_id);
        }

        // If tags are provided, find the corresponding posts
        if (tags) {
            const tagArray = tags.split(',').map(tag => tag.trim());

            // Find tag IDs corresponding to the provided tag names
            const tagRecords = await Tag.findAll({
                where: {
                    tag_name: tagArray
                },
                attributes: ['tag_id'],
            });

            const tagIds = tagRecords.map(tag => tag.tag_id);

            // Find post IDs that have any of the provided tag IDs
            const postTagRecords = await PostTag.findAll({
                where: {
                    tag_id: tagIds
                },
                attributes: ['post_id']
            });

            const postIdsWithTags = postTagRecords.map(postTag => postTag.post_id);

            // Add post IDs to the query
            if (postIdsWithTags.length > 0) {
                query._id = { $in: postIdsWithTags };
            } else {
                // If no posts found with the given tags, return an empty result
                return res.status(200).json({
                    data: [],
                    currentPage: Number(page),
                    numberOfPages: 0,
                    numberOfPostsPerPage: LIMIT,
                    status: 200,
                    message: "No posts found with the given tags."
                });
            }
        }

        // Fetching total post count and paginated posts
        const totalPosts = await Post.countDocuments(query);
        const feedPosts = await Post.find(query)
            .sort({ createdAt: -1 })
            .limit(LIMIT)
            .skip(startIndex);

        // Sending response with fetched posts
        return res.status(200).json({
            data: feedPosts,
            currentPage: Number(page),
            numberOfPages: Math.ceil(totalPosts / LIMIT),
            numberOfPostsPerPage: LIMIT,
            status: 200,
            message: "Success!"
        });
    } catch (error) {
        console.error('Error in getPosts:', error);
        return res.status(500).json({
            status: 500,
            message: "Failed to retrieve posts",
            error: error.message,
        });
    }
};



const createPost = async (req, res) => {
    const transaction = await db.sequelize.transaction();

    try {
        const { tags, caption, attachments } = req.body;

        // tam thoi req.community_id = 1 tai vi chua co phan join group :))
        req.community_id = 1;
        
        // Tạo post mới với Mongoose
        const newPost = new Post({
            caption,
            attachments,
            // đang chờ Ta Chi Thanh Danh gan gia tri cho req.community_id 
            community_id: req.community_id,
            creator_name: req.user.name,
            creator_id: req.user.id,
            // createdAt: new Date().toISOString(),
            likes: [],  // prevent user from bufing the likes   
            comments: [], // prevent user from bufing the comments
        });
        
        await newPost.save();

        // Xử lý tags
        if (tags && tags.length > 0) {
            for (let tag_name of tags) {
                // Tìm hoặc tạo tag
                const [tag] = await Tag.findOrCreate({
                    where: { tag_name: tag_name },
                    transaction
                });

                // Tạo liên kết giữa post và tag
                await PostTag.create({
                    post_id: newPost._id.toString(),  // Chuyển ObjectId thành string
                    tag_id: tag.tag_id
                }, { transaction });
            }
        }

        await transaction.commit();

        return res.status(201).json({
            data: newPost,
            tags: tags,
            status: 201,
            message: "Success!",
        });

    } catch (error) {
        await transaction.rollback();
        return res.status(500).json({
            status: 500,
            message: "Failed to create post",
            error: error.message,
        });
    }
};


const getPost = async (req, res) => {
    const { post_id } = req.params;

    try {
        // Finding the post by its ID
        const post = await Post.findById(post_id);

        // If no post is found, return a 404 status
        if (!post) {
            return res.status(404).json({
                status: 404,
                message: `Post with id: ${post_id} not found`,
            });
        }

        // If the post is found, return it with a success message
        return res.status(200).json({
            data: post,
            status: 200,
            message: "Success!"
        });
    } catch (error) {
        // Handling errors and sending a response with error details
        return res.status(500).json({
            status: 500,
            message: "Failed to retrieve post",
            error: error.message,
        });
    }
};


const commentPost = async (req, res) => {
    const { post_id } = req.params;
    const { text, attachment } = req.body;

    try {
        // Find the post by its ID
        const post = await Post.findById(post_id);

        // If the post is not found, return a 404 status
        if (!post) {
            return res.status(404).json({
                status: 404,
                message: `Post with id: ${post_id} not found`,
            });
        }

        // Create the new comment
        const comment = {
            creator_name: req.user.name,
            creator_id: req.user.id,
            text: text,
            attachment: attachment,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        // Add the new comment to the post's comments array
        post.comments.push(comment);

        // Save the updated post
        const updatedPost = await post.save(); // Use save() to ensure validation

        // Return the updated post with a success message
        return res.status(200).json({
            data: updatedPost,
            status: 200,
            message: "Comment added successfully!"
        });

    } catch (error) {
        // Handle any errors that occur
        return res.status(500).json({
            status: 500,
            message: "Failed to add comment",
            error: error.message,
        });
    }
};



const updatePost = async (req, res) => {
    const { post_id } = req.params;
    const { caption, attachments, tags } = req.body;

    try {
        if (!mongoose.Types.ObjectId.isValid(post_id)) {
            return res.status(404).json({
                status: 404,
                message: `No post with id: ${post_id}`
            });
        }

        const post = await Post.findById(post_id);
        if (!post) {
            return res.status(404).json({
                status: 404,
                message: "Post not found"
            });
        }

        post.caption = caption;
        post.attachments = attachments;
        post.tags = tags;

        const updatedPost = await post.save();

        return res.status(200).json({
            data: updatedPost,
            status: 200,
            message: "Post updated successfully!"
        });

    } catch (error) {
        return res.status(500).json({
            status: 500,
            message: "Failed to update post",
            error: error.message
        });
    }
};



const updateComment = async (req, res) => {
    const { post_id, comment_id } = req.params;
    const { text, selectedFile } = req.body;

    try {
        // Find the post by post_id
        const post = await Post.findById(post_id);

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        // Find the comment by comment_id
        const comment = post.comments.id(comment_id);

        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }

        // Update comment information
        comment.text = text || comment.text;
        comment.attachment = attachment || comment.attachment;
        comment.updatedAt = Date.now(); // Update the time of modification

        // Save the post with the updated comment
        await post.save();

        return res.status(200).json({
            data: post,
            status: 200,
            message: "Comment updated successfully!"
        });
    } catch (error) {
        return res.status(500).json({
            message: "An error occurred while updating the comment",
            error: error.message
        });
    }
};


const likePost = async (req, res) => {
    const { post_id } = req.params;
    const { id: userID, name: userName } = req.user; // Adjusted to match req.user structure

    try {
        // Validate the ID
        if (!mongoose.Types.ObjectId.isValid(post_id)) {
            return res.status(404).json({
                status: 404,
                message: `No post with id: ${post_id}`
            });
        }

        // Validate userID and userName
        if (!userID || !userName) {
            return res.status(400).json({
                status: 400,
                message: "Missing required fields: userID and userName"
            });
        }

        // Find the post by ID
        const post = await Post.findById(post_id);
        
        // Ensure post exists
        if (!post) {
            return res.status(404).json({ 
                status: 404,
                message: "Post not found"
            });
        }

        // Check if the user has already liked the post
        const index = post.likes.findIndex((like) => like.userID === userID);

        // Add or remove like
        if (index === -1) {
            post.likes.push({ userID, userName });
        } else {
            post.likes = post.likes.filter((like) => like.userID !== userID);
        }

        // Save the updated post
        const updatedPost = await post.save();

        return res.status(200).json({
            data: updatedPost,
            status: 200,
            message: "Success!"
        });

    } catch (error) {
        return res.status(500).json({
            status: 500,
            message: "An error occurred while updating the post",
            error: error.message
        });
    }
};


const deletePost = async (req, res) => {
    const { post_id } = req.params;

    try {
        // Validate post ID
        if (!mongoose.Types.ObjectId.isValid(post_id)) {
            return res.status(404).send(`No post with id: ${post_id}`);
        }

        // Delete the post
        const deletedPost = await Post.findByIdAndDelete(post_id);

        // Ensure post was found and deleted
        if (!deletedPost) {
            return res.status(404).json({ message: "Post not found" });
        }

        return res.status(200).json({
            data: deletedPost,
            status: 200,
            message: "Post deleted successfully!"
        });

    } catch (error) {
        return res.status(500).json({
            message: "An error occurred while deleting the post",
            error: error.message
        });
    }
};

const deleteComment = async (req, res) => {
    const { post_id, comment_id } = req.params;

    try {
        // Validate post ID
        if (!mongoose.Types.ObjectId.isValid(post_id)) {
            return res.status(404).send(`No post with id: ${post_id}`);
        }

        // Find the post
        const post = await Post.findById(post_id);

        // Ensure post exists
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        // Find the comment and remove it
        const comment = post.comments.id(comment_id);

        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }

        comment.remove(); // Remove the comment from the post

        // Save the updated post
        const updatedPost = await post.save();

        return res.status(200).json({
            data: updatedPost,
            status: 200,
            message: "Comment deleted successfully!"
        });

    } catch (error) {
        return res.status(500).json({
            message: "An error occurred while deleting the comment",
            error: error.message
        });
    }
};


module.exports = {
    createPost,
    commentPost,
    getPost,
    updatePost,
    getPosts,
    updateComment,
    likePost,
    deleteComment,
    deletePost
}