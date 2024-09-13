const db = require("../configs/db");
const Post = db.post;
const { formatResponse, STATUS_CODE } = require("../utils/services");

const findPostOrComment = async (postId, commentId) => {
  let item;

  if (commentId) {
    item = await Post.findOne({ "comments._id": commentId }, { "comments.$": 1 });
    if (!item || item.comments.length === 0) {
      throw new Error("Comment not found!");
    }
    item = item.comments[0];
  } else {
    item = await Post.findOne({ _id: postId });
    if (!item) {
      throw new Error("Post not found!");
    }
  }

  return item;
};

const verifyAuthor = async (req, res, next) => {
  try {
    const postId = req.params.post_id;
    const commentId = req.params.comment_id;
    const userId = req.user.user_id;

    let item = await findPostOrComment(postId, commentId);

    if (item.creator_id !== userId) {
      return formatResponse(res, {}, STATUS_CODE.FORBIDDEN, "User is not the author!");
    }

    // req.item = item; // nếu cần sử dụng item ở middleware khác
    next();
  } catch (error) {
    if (error.message === "Post not found!" || error.message === "Comment not found!") {
      return formatResponse(res, {}, STATUS_CODE.NOT_FOUND, error.message);
    }
    next(error);
  }
};

const verifyAuthororAdmin = async (req, res, next) => {
  try {
    const member = req.member;

    console.log(member);

    if (member.is_admin === true) {
      next();
    }

    const postId = req.params.post_id;
    const commentId = req.params.comment_id;
    const userId = req.user.user_id;

    let item = await findPostOrComment(postId, commentId);

    if (item.creator_id !== userId) {
      return formatResponse(res, {}, STATUS_CODE.FORBIDDEN, "User is not the author!");
    }

    next();
  } catch (error) {
    if (error.message === "Post not found!" || error.message === "Comment not found!") {
      return formatResponse(res, {}, STATUS_CODE.NOT_FOUND, error.message);
    }
    next(error);
  }
};

  
module.exports = {
    verifyAuthor,
    verifyAuthororAdmin
};
  