const express = require('express');
const router = express.Router();
const taskLogController = require('../controllers/taskLogController');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', taskLogController.getTaskLogs);
router.get('/:id', taskLogController.getTaskLogDetail);
router.get('/stats/overview', taskLogController.getStats);

module.exports = router;
