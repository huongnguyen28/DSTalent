const express = require('express');
const router = express.Router();

const {
    getTests,
} = require('../controllers/up_level.controller');
const { verifyMember } = require('../middlewares/verify-member');
const { verifyToken } = require('../middlewares/verify-token');

router.use(verifyToken);

router.get('/:up_level_request_id/tests', getTests);

module.exports = router;