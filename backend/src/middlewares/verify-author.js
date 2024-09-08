const db = require("../configs/db");
const Post = db.post;
const { formatResponse, STATUS_CODE } = require("../utils/services");


const verifyAuthor = async (req, res, next) => {
    try {
      const postId = req.params.post_id;
      const commentId = req.params.comment_id;
      const userId = req.user.user_id;
  
      let item;
  
      if (commentId) {
        item = await Post.findOne({ "comments._id": commentId }, { "comments.$": 1 });
        if (!item || item.comments.length === 0) {
          return formatResponse(res, {}, STATUS_CODE.NOT_FOUND, "Comment not found!");
        }
        item = item.comments[0];
      } else {
        item = await Post.findOne({ _id: postId });
        if (!item) {
          return formatResponse(res, {}, STATUS_CODE.NOT_FOUND, "Post not found!");
        }
      }
  
      if (item.creator_id !== userId) {
        return formatResponse(res, {}, STATUS_CODE.FORBIDDEN, "User is not the author!");
      }
  
      // req.item = item;
      next();
    } catch (error) {
      next(error);
    }
  };
  
module.exports = {
    verifyAuthor
};
  