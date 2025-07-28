const express = require('express');
const router = express.Router();
const directController = require('../controllers/directController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/direct/:from/:to', verifyToken, directController.getDirectMessages);

router.post('/contacts/add', verifyToken, directController.addContact);

router.get('/contacts/:userId', verifyToken, directController.getContacts);

router.delete('/direct/contact/:contactId', verifyToken, directController.deleteContact);

module.exports = router;
