const express = require('express');
const router = express.Router();
const domainController = require('../controllers/domainController');
const { validationRules, validate } = require('../middleware/validator');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

router.post('/', validationRules.createDomain(), validate, domainController.createDomain);
router.get('/', domainController.getDomains);
router.put('/:id', domainController.updateDomain);
router.delete('/:id', domainController.deleteDomain);
router.post('/:id/sync-dns', domainController.syncDnsRecords);

module.exports = router;
