const express = require("express");
const router = express.Router();
const {
  createBasicTest,
  getRandomBasicTest,
  deleteBasicTest,
  submitBasicTest,
  getBasicTestSubmissions,
  getBasicTests,
  updateBasicTest,
  getABasicTest,
} = require("../controllers/basic_test.controller");
const { verifyToken } = require("../middlewares/verify-token");
const { verifyMember } = require("../middlewares/verify-member");
const { verifyAdmin } = require("../middlewares/verify-admin");

router.use(verifyToken);

router
  .route("/:community_id/basic-tests")
  .post(verifyMember, verifyAdmin, createBasicTest)
  .get(verifyMember, verifyAdmin, getBasicTests);

router.get("/:community_id/basic-tests/random", getRandomBasicTest);

router.get("/:community_id/basic-test-submissions", getBasicTestSubmissions);

router.get(
  "/:community_id/basic-tests/:basic_test_id",
  verifyMember,
  verifyAdmin,
  getABasicTest
);

router.patch(
  "/:community_id/basic-tests/:basic_test_id",
  verifyMember,
  verifyAdmin,
  updateBasicTest
);

router.delete(
  "/:community_id/basic-tests/:basic_test_id",
  verifyMember,
  verifyAdmin,
  deleteBasicTest
);

router.post("/:community_id/basic-tests/:basic_test_id", submitBasicTest);

module.exports = router;
