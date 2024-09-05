const express = require('express');
const router = express.Router();
const {
    createPost,
    commentPost,
    getPost,
    updatePost,
    getPosts,
    updateComment,
    likePost,
    deleteComment,
    deletePost} = require("../controllers/post.controller");
const {verifyToken} = require("../middlewares/verify-token");
const { verifyMember } = require("../middlewares/verify-member");

router.use(verifyToken);

router.route("/:community_id/posts", verifyMember)
    .get(getPosts)
    .post(createPost);

router.route("/:community_id/posts/:post_id", verifyMember)
    .get(getPost)
    .patch(updatePost)
    .delete(deletePost);

router.post("/:community_id/posts/:post_id/comments",verifyMember, commentPost);

router.route("/:community_id/posts/:post_id/comments/:comment_id", verifyMember)
    .patch(updateComment)
    .delete(deleteComment);

router.patch("/:community_id/posts/:post_id/likes", verifyMember, likePost);

module.exports = router;