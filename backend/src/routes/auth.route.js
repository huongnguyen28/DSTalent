const express = require('express');
const router = express.Router();
const {loginUser, 
    requestRefreshToken, 
    logoutUser, 
    oauthGoogle,
    verifyEmail, 
    getVerifyCode, 
    resetPassword,      
    registerUser,
    supResetPassword
} = require("../controllers/auth.controller");

router.post("/login", loginUser);
router.post("/register", registerUser);
router.post("/refresh", requestRefreshToken);
router.post("/logout", logoutUser);
router.post("/email/verify", verifyEmail);
router.post("/email/code", getVerifyCode);
router.post("/password/reset", resetPassword);
router.post("/password/reset/sup", supResetPassword);
router.get("/oauth/google", oauthGoogle);
router.get("/tests", async (req, res) => {
    return res.json({message: "Hello from auth route"});
});

module.exports = router;
