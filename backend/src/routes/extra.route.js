const express = require('express');
const router = express.Router();

const {
    getTests,
} = require('../controllers/up_level.controller');
const { verifyMember } = require('../middlewares/verify-member');

router.get('/up-level-requests/:up_level_request_id/tests', verifyMember, getTests);