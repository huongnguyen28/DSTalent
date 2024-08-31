const express = require("express");
const router = express.Router();
const {
  getChatRooms,
  createChatRoom,
  getChatRoomDetails,
  addChatMember,
  removeChatMember,
  updateChatRoom,
  getChatMessages,
  sendChatMessage,
} = require("../controllers/chat.controller");

const { verifyToken } = require("../middlewares/verify-token");
const { verifyMember } = require("../middlewares/verify-member");

router.use(verifyToken, verifyMember);
router.route("/").get(getChatRooms).post(createChatRoom);
router
  .route("/:chat_room_id")
  // .all(verifyMember)
  .get(getChatRoomDetails)
  .post(addChatMember)
  .delete(removeChatMember)
  .put(updateChatRoom);

router
  .route("/:chat_room_id/messages")
  // .all(verifyMember)
  .get(getChatMessages)
  .post(sendChatMessage);
module.exports = router;
