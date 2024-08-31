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

router.use(verifyToken);

router.route("/")
    .get(getPosts)
    .post(createPost);

router.route("/:post_id")
    .get(getPost)
    .patch(updatePost)
    .delete(deletePost);

router.post("/:post_id/comment", commentPost);

router.route("/:post_id/comment/:comment_id")
    .patch(updateComment)
    .delete(deleteComment);

router.patch("/:post_id/like", likePost);

module.exports = router;