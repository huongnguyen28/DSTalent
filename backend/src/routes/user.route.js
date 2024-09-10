const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
    updateUser, 
    getUser,
    useWallet,
    createWallet,
    getWalletList,
    chooseWallet
} = require("../controllers/user.controller");
const {verifyToken} = require("../middlewares/verify-token");
const storage = require("../configs/multer");
  
const upload = multer({ storage });

router.use(verifyToken);

// ======================== Kiệt ========================

router.patch("/me", upload.single('avatar'), updateUser);
router.get("/:user_id/profile", getUser);
router.post("/wallet/create", createWallet);
router.post("/wallet/choose", chooseWallet);
router.post("/wallet", useWallet);
router.get("/wallet", getWalletList);

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

// ===================== Cuong ================================

const { updateDocumentAccessLevel } = require('../controllers/document.controller');

router.patch("/:user_id/documents/:document_id", updateDocumentAccessLevel);

module.exports = router;