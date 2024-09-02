const express = require('express');
const router = express.Router();

const {
    getTests,
} = require('../controllers/up_level.controller');

router.get('/:up_level_request_id/tests', getTests);

module.exports = router;