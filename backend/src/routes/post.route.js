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

router.route("/", verifyToken)
    .get(getPosts)
    .post(createPost);

router.get("/:post_id", verifyToken, getPost);
router.patch("/:post_id", verifyToken, updatePost);
router.post("/:post_id/comment", verifyToken, commentPost);
router.patch("/:post_id/comment/:comment_id", verifyToken, updateComment);
router.delete("/:post_id/comment/:comment_id", verifyToken, deleteComment);
router.patch("/:post_id/like", verifyToken, likePost);
router.delete("/:post_id", verifyToken, deletePost);

module.exports = router;