const express = require('express');
const router = express.Router();
const {
    createPost,
    commentPost,
    // getPost,
    updatePost,
    getPosts,
    updateComment,
    likePost,
    deleteComment,
    deletePost} = require("../controllers/post.controller");
const {verifyToken} = require("../middlewares/verify-token");
const { verifyMember } = require("../middlewares/verify-member");
// const { verifyAdmin } = require("../middlewares/verify-admin");
const { verifyAuthor, verifyAuthororAdmin } = require("../middlewares/verify-author");

router.use(verifyToken);

router.route("/:community_id/posts")
    .get(verifyMember, getPosts)
    .post(verifyMember, createPost);

router.route("/:community_id/posts/:post_id")
    // .get(getPost)
    .patch(verifyMember, verifyAuthor, updatePost)
    // .delete(verifyAuthororAdmin, deletePost);
    .delete(verifyMember, deletePost);


router.post("/:community_id/posts/:post_id/comments",verifyMember, commentPost);

router.route("/:community_id/posts/:post_id/comments/:comment_id")
    .patch(verifyMember, verifyAuthor, updateComment)
    .delete(verifyMember, verifyAuthororAdmin, deleteComment);

router.patch("/:community_id/posts/:post_id/likes", verifyMember, likePost);

module.exports = router;