const db = require("../configs/db");
const mongoose = require('mongoose');
const { STATUS_CODE, formatResponse } = require("../utils/services");
const Post = db.post;
const User = db.user;
const Tag = db.tag;
const PostTag = db.post_tag;

const getPosts = async (req, res) => {
    const { page = 1, search_query, tags, creator_id } = req.query;
    const { community_id } = req.params;
    const LIMIT = 8;
    const startIndex = (Number(page) - 1) * LIMIT;

    try {
        let query = {};

        // Ensure community_id is provided
        if (!community_id) {
            return formatResponse(
                res,
                {},
                STATUS_CODE.BAD_REQUEST
            )
        }

        // Adding community_id to the query
        query.community_id = Number(community_id);

        // Building the query based on search criteria
        if (search_query) {
            query.caption = { $regex: search_query, $options: 'i' };
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
                return formatResponse(
                    res,
                    [],
                    STATUS_CODE.SUCCESS,
                    // "No posts found with the given tags."
                    error.message
                );
            }
        }

        // Fetching total post count and paginated posts
        const totalPosts = await Post.countDocuments(query);
        const feedPosts = await Post.find(query)
            .sort({ createdAt: -1 })
            .limit(LIMIT)
            .skip(startIndex);

        // Sending response with fetched posts
        return formatResponse(
            res,
            {
                feedPosts, 
                totalPosts,
                page: Number(page),
                numberOfPages: Math.ceil(totalPosts / LIMIT),
                numberOfPostsPerPage: LIMIT 
            },
            STATUS_CODE.SUCCESS,
            "Success!"
        );

    } catch (error) {
        console.error('Error in getPosts:', error);
        return formatResponse(
            res,
            {},
            STATUS_CODE.INTERNAL_SERVER_ERROR,
            // "Failed to retrieve posts"
            error.message
        );
    }
};

const createPost = async (req, res) => {
    const transaction = await db.sequelize.transaction();

    try {
        const { tags, caption, attachments } = req.body;
        const { community_id } = req.params;

        // Fetch the user's full name from the database
        const user = await User.findOne({ where: { user_id: req.user.user_id }, transaction });

        if (!user) {
            return formatResponse(res, {}, STATUS_CODE.NOT_FOUND, "User not found!");
        }

        // Create a new post with Mongoose
        const newPost = new Post({
            caption,
            attachments: req.file ? [{ url: req.file.path, type: req.file.mimetype }] : [],
            community_id: community_id,
            creator_name: user.full_name,  // Use the fetched user's full name
            creator_id: req.user.user_id,
            likes: [],  // prevent user from buffing the likes
            comments: [], // prevent user from buffing the comments
        });

        await newPost.save();

        // Handle tags
        if (tags && tags.length > 0) {
            for (let tag_name of tags) {
                // Find or create tag
                const [tag] = await Tag.findOrCreate({
                    where: { tag_name: tag_name },
                    transaction
                });

                // Create link between post and tag
                await PostTag.create({
                    post_id: newPost._id.toString(),  // Convert ObjectId to string
                    tag_id: tag.tag_id
                }, { transaction });
            }
        }

        await transaction.commit();

        return formatResponse(
            res,
            {
                newPost,
                tags,
            },
            STATUS_CODE.CREATED,
            "Success!"
        );

    } catch (error) {
        await transaction.rollback();
        return formatResponse(
            res,
            {},
            STATUS_CODE.INTERNAL_SERVER_ERROR,
            error.message
        );
    }
};


const getPost = async (req, res) => {
    const { post_id } = req.params;

    try {
        // Finding the post by its ID
        const post = await Post.findById(post_id);

        // If no post is found, return a 404 status
        if (!post) {
            return formatResponse(
                res,
                {},
                STATUS_CODE.NOT_FOUND,
                `No post with id: ${post_id}`
            );

        }

        // If the post is found, return it with a success message
        return formatResponse(
            res,
            { 
                post
            },
            STATUS_CODE.SUCCESS,
            "Success!"
        );

    } catch (error) {
        // Handling errors and sending a response with error details
        return formatResponse(
            res,
            {},
            STATUS_CODE.INTERNAL_SERVER_ERROR,
            // "Failed to retrieve posts"
            error.message
        );
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
            return formatResponse(
                res,
                {},
                STATUS_CODE.NOT_FOUND,
                `No post with id: ${post_id}`
            );
        }

        // Fetch the user's full name from the database
        const user = await User.findOne({ where: { user_id: req.user.user_id } });

        if (!user) {
            return formatResponse(
                res,
                {},
                STATUS_CODE.NOT_FOUND,
                "User not found!"
            );
        }

        // Create the new comment
        const comment = {
            creator_name: user.full_name,  // Use the fetched user's full name
            creator_id: req.user.user_id,
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
        return formatResponse(
            res,
            {
                updatedPost
            },
            STATUS_CODE.SUCCESS,
            "Comment added successfully!"
        );

    } catch (error) {
        // Handle any errors that occur
        return formatResponse(
            res,
            {},
            STATUS_CODE.INTERNAL_SERVER_ERROR,
            error.message
        );
    }
};


// const commentPost = async (req, res) => {
//     const { post_id } = req.params;
//     const { text, attachment } = req.body;

//     try {
//         // Find the post by its ID
//         const post = await Post.findById(post_id);

//         // If the post is not found, return a 404 status
//         if (!post) {
//             return formatResponse(
//                 res,
//                 {},
//                 STATUS_CODE.NOT_FOUND,
//                 `No post with id: ${post_id}`
//             );
//         }

//         // Create the new comment
//         const comment = {
//             creator_name: req.user.full_name,
//             creator_id: req.user.user_id,
//             text: text,
//             attachment: attachment,
//             createdAt: new Date(),
//             updatedAt: new Date(),
//         };

//         // Add the new comment to the post's comments array
//         post.comments.push(comment);

//         // Save the updated post
//         const updatedPost = await post.save(); // Use save() to ensure validation

//         // Return the updated post with a success message
//         return formatResponse(
//             res,
//             {
//                 updatedPost
//             },
//             STATUS_CODE.SUCCESS,
//             "Comment added successfully!"
//         );

//     } catch (error) {
//         // Handle any errors that occur
//         return formatResponse(
//             res,
//             {},
//             STATUS_CODE.INTERNAL_SERVER_ERROR,
//             // "Failed to add comment"
//             error.message
//         );
//     }
// };



const updatePost = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    const { post_id } = req.params;
    const { caption, attachments, tags } = req.body;

    try {
        if (!mongoose.Types.ObjectId.isValid(post_id)) {
            return formatResponse(
                res,
                {},
                STATUS_CODE.NOT_FOUND,
                `No post with id: ${post_id}`
            );
        }

        const post = await Post.findById(post_id);
        if (!post) {
            return formatResponse(
                res,
                {},
                STATUS_CODE.NOT_FOUND,
                "Post not found"
            );
        }

        post.caption = caption;
        post.attachments = attachments;
        await post.save();

        if (tags && tags.length > 0) {
            await PostTag.destroy({
                where: { post_id: post_id.toString() },
                transaction
            });

            for (let tag_name of tags) {
                const [tag] = await Tag.findOrCreate({
                    where: { tag_name: tag_name },
                    transaction,
                });

                await PostTag.create({
                    post_id: post._id.toString(),
                    tag_id: tag.tag_id,
                }, { transaction });
            }
        }

        await transaction.commit();

        return formatResponse(
            res,
            {
                post,
                tags,
            },
            STATUS_CODE.SUCCESS,
            "Post updated successfully!"
        );


    } catch (error) {
        await transaction.rollback();
        return formatResponse(
            res,
            {},
            STATUS_CODE.INTERNAL_SERVER_ERROR,
            error.message
        );
    }
};




const updateComment = async (req, res) => {
    const { post_id, comment_id } = req.params;
    const { text, attachment } = req.body;

    try {
        // Find the post by post_id
        const post = await Post.findById(post_id);

        if (!post) {
            return formatResponse(
                res,
                {},
                STATUS_CODE.NOT_FOUND,
                "Post not found"
            );
        }

        // Find the comment by comment_id
        const comment = post.comments.id(comment_id);

        if (!comment) {
            return formatResponse(
                res,
                {},
                STATUS_CODE.NOT_FOUND,
                "Comment not found"
            );
        }

        // Update comment information
        comment.text = text || comment.text;
        comment.attachment = attachment || comment.attachment;
        comment.updatedAt = Date.now(); // Update the time of modification

        // Save the post with the updated comment
        await post.save();

        return formatResponse(
            res,
            {
                post
            },
            STATUS_CODE.SUCCESS,
            "Comment updated successfully!"
        );

    } catch (error) {
        return formatResponse(
            res,
            {},
            STATUS_CODE.INTERNAL_SERVER_ERROR,
            error.message
        );
    }
};


const likePost = async (req, res) => {
    const { post_id } = req.params;
    const { user_id, full_name } = req.user; // Adjusted to match req.user structure

    try {
        
        // Validate the ID
        if (!mongoose.Types.ObjectId.isValid(post_id)) {
            return formatResponse(
                res,
                {},
                STATUS_CODE.NOT_FOUND,
                `No post with id: ${post_id}`
            );
        }

        // Validate user_id and full_name
        if (!user_id || !full_name) {
            return formatResponse(
                res,
                {},
                STATUS_CODE.BAD_REQUEST,
                "Missing required fields: user_id and full_name"
            );
        }

        // Find the post by ID
        const post = await Post.findById(post_id);
        
        // Ensure post exists
        if (!post) {
            return formatResponse(
                res,
                {},
                STATUS_CODE.NOT_FOUND,
                "Post not found"
            );
        }

        // Check if the user has already liked the post
        const index = post.likes.findIndex((like) => like.user_id === user_id);

        // Add or remove like
        if (index === -1) {
            post.likes.push({ user_id, user_name: full_name });
        } else {
            post.likes = post.likes.filter((like) => like.user_id !== user_id);
        }

        // Save the updated post
        const updatedPost = await post.save();

        return formatResponse(
            res,
            {
                updatedPost
            },
            STATUS_CODE.SUCCESS,
            "Success!"
        );

    } catch (error) {
        return formatResponse(  
            res,
            {},
            STATUS_CODE.INTERNAL_SERVER_ERROR,
            error.message
        );
    }
};


const deletePost = async (req, res) => {
    const { post_id } = req.params;

    try {
        // Validate post ID
        if (!mongoose.Types.ObjectId.isValid(post_id)) {
            return formatResponse(
                res,
                {},
                STATUS_CODE.NOT_FOUND,
                `No post with id: ${post_id}`
            );
        }

        // Delete the post
        const deletedPost = await Post.findByIdAndDelete(post_id);

        // Ensure post was found and deleted
        if (!deletedPost) {
            return formatResponse(
                res,
                {},
                STATUS_CODE.NOT_FOUND,
                "Post not found"
            );
        }

        return formatResponse(
            res,
            {
                deletedPost
            },
            STATUS_CODE.SUCCESS,
            "Post deleted successfully!"
        );

    } catch (error) {
        return formatResponse(
            res,
            {},
            STATUS_CODE.INTERNAL_SERVER_ERROR,
            error.message
        ); 
    }
};

const deleteComment = async (req, res) => {
    const { post_id, comment_id } = req.params;

    try {
        // Validate post ID
        if (!mongoose.Types.ObjectId.isValid(post_id)) {
            return formatResponse(
                res,
                {},
                STATUS_CODE.NOT_FOUND,
                `No post with id: ${post_id}`
            );
        }

        // Find the post
        const post = await Post.findById(post_id);

        // Ensure post exists
        if (!post) {
            return formatResponse(
                res,
                {},
                STATUS_CODE.NOT_FOUND,
                "Post not found"
            );
        }

        // Find the comment and remove it
        const comment = post.comments.id(comment_id);

        if (!comment) {
            return formatResponse(
                res,
                {},
                STATUS_CODE.NOT_FOUND,
                "Comment not found"
            );
        }

        comment.remove(); // Remove the comment from the post

        // Save the updated post
        const updatedPost = await post.save();

        return formatResponse(
            res,
            {
                updatedPost
            },
            STATUS_CODE.SUCCESS,
            "Comment deleted successfully!"
        );

    } catch (error) {
        return formatResponse(
            res,
            {},
            STATUS_CODE.INTERNAL_SERVER_ERROR,
            error.message
        );
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