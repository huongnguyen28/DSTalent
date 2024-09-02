const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
    updateUser, 
    getUser,
    useWallet,
    createWallet,
} = require("../controllers/user.controller");
const {verifyToken} = require("../middlewares/verify-token");
const storage = require("../configs/multer");
  
const upload = multer({ storage });

router.use(verifyToken);

router.patch("/me", upload.single('file'), updateUser);
router.get("/:user_id", getUser);
router.post("/wallet", useWallet);
router.post("/wallet/create-new", createWallet);

// ======================== Tín ========================
const { verifyMember } = require('../middlewares/verify-member');

const {
    getUpLevelPhase,
    createUpLevelRequest,
    getCurrentUpLevelRequestId,
    getCurrentLevel,
    submitAnswer,
} = require('../controllers/up_level.controller');
const { verify } = require('jsonwebtoken');

router.get('/me/communities/:community_id/current-level', verifyMember, getCurrentLevel);
router.get('/me/communities/:community_id/up-level-phase', verifyMember, getUpLevelPhase);
router.post('/me/communities/:community_id/up-level-request', verifyMember, createUpLevelRequest);
router.get('/me/communities/:community_id/current-up-level-request-id', verifyMember, getCurrentUpLevelRequestId);
router.post('/me/communities/:community_id/submit-answer', verifyMember, submitAnswer);

// =====================================================


module.exports = router;