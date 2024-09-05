const express = require('express');
const router = express.Router();
const {
    createBasicTest,
    getRandomBasicTest,
    deleteBasicTest
} = require("../controllers/basic_test.controller");
const {verifyToken} = require("../middlewares/verify-token");
const { verifyMember } = require("../middlewares/verify-member");
const { verifyAdmin } = require("../middlewares/verify-admin");

router.use(verifyToken);

router.post("/:community_id/basic-tests", verifyAdmin, createBasicTest);
router.get("/:community_id/basic-tests", verifyMember, getRandomBasicTest);
router.delete("/:community_id/basic-tests/:basic_test_id", verifyAdmin, deleteBasicTest);

module.exports = router;