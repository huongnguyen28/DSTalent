const express = require("express");
const router = express.Router();
const {
  getCommunityList,
  createCommunity,
  getCommunityDetail,
  getCommunityMembers,
  joinCommunity,
  leaveCommunity,
  getMemberProfile,
  updateMemberProfile,
  updateCommunity,
  deleteCommunity
} = require("../controllers/community.controller");
const { verifyToken } = require("../middlewares/verify-token");
const { verifyMember } = require("../middlewares/verify-member");
const chatRoute = require("./chat.route");
const { verifyAdmin } = require("../middlewares/verify-admin");

router.use(verifyToken);

router.route("/")
  .get(getCommunityList)
  .post(createCommunity);

router.route("/:community_id")
  .get(verifyMember, getCommunityDetail)
  .patch(verifyAdmin, updateCommunity)
  .delete(verifyAdmin, deleteCommunity);

router.get("/:community_id/members", verifyMember, getCommunityMembers);

router.post("/:community_id/join", joinCommunity);

router.post("/:community_id/leave", verifyMember, leaveCommunity);


router
  .route("/:community_id/members/:member_id")
  .get(verifyMember, getMemberProfile)
  .put(verifyMember, updateMemberProfile);

router.use("/:community_id/chats", verifyMember, chatRoute);

module.exports = router;
