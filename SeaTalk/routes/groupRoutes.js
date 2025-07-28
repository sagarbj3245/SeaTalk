const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/groups/:userId', verifyToken, groupController.getUserGroups);
router.get('/groups/:userId/contacts', verifyToken, groupController.getUserContacts);
router.get('/groups/:groupId/member/:userId', verifyToken, groupController.isMember); 
router.post('/groups', verifyToken, groupController.createGroup);
router.post('/groups/:groupId/add-member', verifyToken, groupController.addMember);
router.post('/groups/:groupId/remove-member', verifyToken, groupController.removeMember);
router.post('/groups/:groupId/promote-member', verifyToken, groupController.promoteMember);

module.exports = router;
