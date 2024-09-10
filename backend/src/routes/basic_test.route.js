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
  getABasicTest
} = require("../controllers/basic_test.controller");
const { verifyToken } = require("../middlewares/verify-token");
const { verifyMember } = require("../middlewares/verify-member");
const { verifyAdmin } = require("../middlewares/verify-admin");
const { get } = require("http");

router.use(verifyToken);

router
  .route("/:community_id/basic-tests", verifyMember, verifyAdmin)
  .post(createBasicTest)
  .get(getBasicTests);

router.get(
  "/:community_id/basic-tests/random",
  verifyMember,
  getRandomBasicTest
);

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
