const express = require("express");
const router = express.Router();

const userRoute = require("./user.route");
const authRoute = require("./auth.route");
const communityRoute = require("./community.route");
const postRoute = require("./post.route");

router.use("/users", userRoute);
router.use("/auth", authRoute);
router.use("/communities", communityRoute);
router.use("/posts", postRoute);
// router.use("/communities/:community_id/chats", chatRoute);

module.exports = router;
