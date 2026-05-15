const express = require('express');
const router = express.Router();
const certificateController = require('../controllers/certificateController');
const { validationRules, validate } = require('../middleware/validator');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

router.post('/', validationRules.createCertificate(), validate, certificateController.createCertificate);
router.get('/', certificateController.getCertificates);
router.get('/:id', certificateController.getCertificateDetail);
router.post('/:id/renew', certificateController.renewCertificate);
router.post('/:id/upload', certificateController.uploadCertificate);

module.exports = router;
