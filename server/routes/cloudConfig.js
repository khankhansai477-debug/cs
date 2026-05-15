const express = require('express');
const router = express.Router();
const cloudConfigController = require('../controllers/cloudConfigController');
const { validationRules, validate } = require('../middleware/validator');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

router.post('/', validationRules.createCloudConfig(), validate, cloudConfigController.createCloudConfig);
router.get('/', cloudConfigController.getCloudConfigs);
router.put('/:id', cloudConfigController.updateCloudConfig);
router.delete('/:id', cloudConfigController.deleteCloudConfig);
router.post('/:id/test', cloudConfigController.testConnection);

module.exports = router;
