const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/messages', verifyToken, chatController.saveMessage);
router.get('/messages/:groupId/:userId', verifyToken, chatController.getMessages); 

module.exports = router;
