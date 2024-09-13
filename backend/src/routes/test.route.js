const router = require("./auth.route");
const multer = require('multer');
const {verifyToken} = require("../middlewares/verify-token");
const storage = require("../configs/multer");
  
const upload = multer({ storage });

const {
    uploadAnswer,
    downloadAnswer,
    uploadQuestion,
    downloadQuestion,
    uploadScore,
} = require("../controllers/up_level.controller");

router.post("/:test_id/upload-answer", upload.single('file'), verifyToken, uploadAnswer);
router.get("/:test_id/download-answer", downloadAnswer);
router.post("/:test_id/upload-question", upload.single('file'), verifyToken, uploadQuestion);
router.get("/:test_id/download-question", downloadQuestion);
router.post("/:test_id/upload-score", verifyToken, uploadScore);

module.exports = router;