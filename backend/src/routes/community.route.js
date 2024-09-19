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
  deleteCommunity,
  searchCommunity,
} = require("../controllers/community.controller");
const { verifyToken } = require("../middlewares/verify-token");
const { verifyMember } = require("../middlewares/verify-member");
const chatRoute = require("./chat.route");
const { verifyAdmin } = require("../middlewares/verify-admin");

router.use(verifyToken);

router.route("/").get(getCommunityList).post(createCommunity);

router.get("/search", searchCommunity);

router
  .route("/:community_id")
  .get(getCommunityDetail)
  .patch(verifyMember, verifyAdmin, updateCommunity)
  .delete(verifyMember, verifyAdmin, deleteCommunity);

router.get("/:community_id/members", verifyMember, getCommunityMembers);

router.post("/:community_id/join", joinCommunity);

router.post("/:community_id/leave", verifyMember, leaveCommunity);

const { uploadDocument } = require("../controllers/document.controller");
router.post("/:community_id/documents", verifyMember, uploadDocument);

const { searchDocument } = require("../controllers/document.controller");
router.get("/:community_id/documents/search", searchDocument);

router
  .route("/:community_id/members/:member_id")
  .get(verifyMember, getMemberProfile)
  .put(verifyMember, updateMemberProfile);

router.use("/:community_id/chats", verifyMember, chatRoute);

const {
  listLevelUpRequests,
  agreedToJudge,
} = require("../controllers/up_level.controller");
router.get("/:community_id/judge-requests", verifyMember, listLevelUpRequests);
router.get(
  "/:community_id/up-level-requests/:up_level_request_id/agree",
  verifyMember,
  agreedToJudge
);

module.exports = router;
