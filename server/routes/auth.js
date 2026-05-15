const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validationRules, validate } = require('../middleware/validator');
const { authMiddleware } = require('../middleware/auth');

router.post('/register', validationRules.createUser(), validate, authController.register);
router.post('/login', validationRules.loginUser(), validate, authController.login);
router.get('/profile', authMiddleware, authController.getProfile);

module.exports = router;
