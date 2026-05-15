const { body, param, query, validationResult } = require('express-validator');

const validationRules = {
  createUser: () => [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('username').isLength({ min: 3 }).trim().escape()
  ],
  loginUser: () => [
    body('email').isEmail().normalizeEmail(),
    body('password').exists()
  ],
  createCloudConfig: () => [
    body('provider').isIn(['aliyun', 'tencentcloud', 'aws']).withMessage('Invalid provider'),
    body('name').trim().escape().notEmpty(),
    body('credentials').isObject()
  ],
  createDomain: () => [
    body('domain').isLength({ min: 3 }).trim().escape(),
    body('cloudConfigId').isInt(),
    body('isWildcard').isBoolean(),
    body('autoSync').isBoolean()
  ],
  createCertificate: () => [
    body('domain').isLength({ min: 3 }).trim(),
    body('certificateType').isIn(['letsencrypt', 'selfsigned', 'manual']),
    body('autoRenewal').isBoolean()
  ]
};

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

module.exports = {
  validationRules,
  validate
};
