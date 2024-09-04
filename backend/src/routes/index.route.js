const express = require("express");
const router = express.Router();

const userRoute = require("./user.route");
const authRoute = require("./auth.route");
const communityRoute = require("./community.route");
const postRoute = require("./post.route");
const upLevelRequestRoute = require("./up_level_request.route");
const testRoute = require("./test.route");

router.use("/users", userRoute);
router.use("/auth", authRoute);
router.use("/communities", communityRoute);
router.use("/posts", postRoute);
router.use("/up-level-requests", upLevelRequestRoute);
router.use("/tests", testRoute);
// router.use("/communities/:community_id/chats", chatRoute);

module.exports = router;
