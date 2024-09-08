const express = require("express");
const router = express.Router();

const userRoute = require("./user.route");
const authRoute = require("./auth.route");
const communityRoute = require("./community.route");
const upLevelRequestRoute = require("./up_level_request.route");
const testRoute = require("./test.route");
const postRoute = require("./post.route");
const basicTestRoute = require("./basic_test.route");
const documentRoute = require("./document.route");

router.use("/users", userRoute);
router.use("/auth", authRoute);
router.use("/communities", communityRoute);
router.use("/communities", postRoute);
router.use("/communities", basicTestRoute);
router.use("/up-level-requests", upLevelRequestRoute);
router.use("/tests", testRoute);
router.use("/posts", postRoute);
router.use("/documents", documentRoute);
// router.use("/communities/:community_id/chats", chatRoute);

module.exports = router;
