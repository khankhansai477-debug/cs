const { CloudConfig, TaskLog } = require('../models');
const logger = require('../utils/logger');
const CloudProviderFactory = require('../services/cloud/CloudProviderFactory');

const createCloudConfig = async (req, res) => {
  try {
    const { provider, name, credentials, description } = req.body;

    // Validate credentials
    const cloudProvider = CloudProviderFactory.getProvider(provider);
    const isValid = await cloudProvider.validateCredentials(credentials);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid cloud credentials'
      });
    }

    const config = await CloudConfig.create({
      userId: req.userId,
      provider,
      name,
      credentials,
      description,
      isActive: true
    });

    await TaskLog.create({
      userId: req.userId,
      action: 'CREATE_CLOUD_CONFIG',
      resourceType: 'CloudConfig',
      resourceId: config.id,
      status: 'success',
      details: { provider, name }
    });

    logger.info(`Cloud config created: ${name} (${provider})`);
    res.status(201).json({
      success: true,
      message: 'Cloud config created successfully',
      config: {
        id: config.id,
        provider: config.provider,
        name: config.name,
        description: config.description,
        isActive: config.isActive
      }
    });
  } catch (error) {
    logger.error('Create cloud config error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create cloud config'
    });
  }
};

const getCloudConfigs = async (req, res) => {
  try {
    const configs = await CloudConfig.findAll({
      where: { userId: req.userId },
      attributes: { exclude: ['credentials'] },
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      configs
    });
  } catch (error) {
    logger.error('Get cloud configs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cloud configs'
    });
  }
};

const updateCloudConfig = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, isActive } = req.body;

    const config = await CloudConfig.findOne({
      where: { id, userId: req.userId }
    });

    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Cloud config not found'
      });
    }

    await config.update({ name, description, isActive });

    await TaskLog.create({
      userId: req.userId,
      action: 'UPDATE_CLOUD_CONFIG',
      resourceType: 'CloudConfig',
      resourceId: id,
      status: 'success'
    });

    logger.info(`Cloud config updated: ${id}`);
    res.json({
      success: true,
      message: 'Cloud config updated successfully',
      config
    });
  } catch (error) {
    logger.error('Update cloud config error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update cloud config'
    });
  }
};

const deleteCloudConfig = async (req, res) => {
  try {
    const { id } = req.params;

    const config = await CloudConfig.findOne({
      where: { id, userId: req.userId }
    });

    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Cloud config not found'
      });
    }

    await config.destroy();

    await TaskLog.create({
      userId: req.userId,
      action: 'DELETE_CLOUD_CONFIG',
      resourceType: 'CloudConfig',
      resourceId: id,
      status: 'success'
    });

    logger.info(`Cloud config deleted: ${id}`);
    res.json({
      success: true,
      message: 'Cloud config deleted successfully'
    });
  } catch (error) {
    logger.error('Delete cloud config error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete cloud config'
    });
  }
};

const testConnection = async (req, res) => {
  try {
    const { id } = req.params;

    const config = await CloudConfig.findOne({
      where: { id, userId: req.userId }
    });

    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Cloud config not found'
      });
    }

    const cloudProvider = CloudProviderFactory.getProvider(config.provider);
    const isValid = await cloudProvider.validateCredentials(config.credentials);

    if (isValid) {
      logger.info(`Cloud config connection test successful: ${id}`);
      res.json({
        success: true,
        message: 'Connection successful'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Connection failed - invalid credentials'
      });
    }
  } catch (error) {
    logger.error('Test connection error:', error);
    res.status(500).json({
      success: false,
      message: 'Connection test failed: ' + error.message
    });
  }
};

module.exports = {
  createCloudConfig,
  getCloudConfigs,
  updateCloudConfig,
  deleteCloudConfig,
  testConnection
};
