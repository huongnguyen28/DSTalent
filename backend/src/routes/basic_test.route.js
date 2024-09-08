const express = require("express");
const router = express.Router();
const {
  createBasicTest,
  getRandomBasicTest,
  deleteBasicTest,
  submitBasicTest,
  getBasicTestSubmissions,
  getBasicTests,
} = require("../controllers/basic_test.controller");
const { verifyToken } = require("../middlewares/verify-token");
const { verifyMember } = require("../middlewares/verify-member");
const { verifyAdmin } = require("../middlewares/verify-admin");

router.use(verifyToken, verifyMember);

router
  .route("/:community_id/basic-tests", verifyAdmin)
  .post(createBasicTest)
  .get(getBasicTests);

router.get(
  "/:community_id/basic-tests/random",
  verifyMember,
  getRandomBasicTest
);

router.delete(
  "/:community_id/basic-tests/:basic_test_id",
  verifyAdmin,
  deleteBasicTest
);

router.post(
  "/:community_id/basic-tests/:basic_test_id",
  verifyMember,
  submitBasicTest
);

router.get(
  "/:community_id/basic-tests/submissions",
  verifyMember,
  getBasicTestSubmissions
);

module.exports = router;
