const express = require('express');
const router = express.Router();
const { sendMessage } = require('../controllers/chat-controller');

router.post('/sendMessage', sendMessage);

module.exports = router;