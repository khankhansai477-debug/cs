const { Domain, CloudConfig, Certificate, TaskLog } = require('../models');
const logger = require('../utils/logger');
const CloudProviderFactory = require('../services/cloud/CloudProviderFactory');
const DnsService = require('../services/dns/DnsService');

const createDomain = async (req, res) => {
  try {
    const { domain, cloudConfigId, isWildcard = false, autoSync = true, description } = req.body;

    const cloudConfig = await CloudConfig.findOne({
      where: { id: cloudConfigId, userId: req.userId }
    });

    if (!cloudConfig) {
      return res.status(404).json({
        success: false,
        message: 'Cloud config not found'
      });
    }

    const existingDomain = await Domain.findOne({
      where: { domain, userId: req.userId }
    });

    if (existingDomain) {
      return res.status(400).json({
        success: false,
        message: 'Domain already exists'
      });
    }

    const newDomain = await Domain.create({
      userId: req.userId,
      cloudConfigId,
      domain,
      isWildcard,
      autoSync,
      description,
      status: 'pending'
    });

    // Sync DNS records if auto-sync enabled
    if (autoSync) {
      try {
        const cloudProvider = CloudProviderFactory.getProvider(cloudConfig.provider);
        const records = await cloudProvider.getDnsRecords(domain, cloudConfig.credentials);
        await DnsService.syncRecords(newDomain.id, records);
      } catch (error) {
        logger.error('DNS sync error:', error);
      }
    }

    await TaskLog.create({
      userId: req.userId,
      action: 'CREATE_DOMAIN',
      resourceType: 'Domain',
      resourceId: newDomain.id,
      status: 'success',
      details: { domain, isWildcard }
    });

    logger.info(`Domain created: ${domain}`);
    res.status(201).json({
      success: true,
      message: 'Domain created successfully',
      domain: newDomain
    });
  } catch (error) {
    logger.error('Create domain error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create domain'
    });
  }
};

const getDomains = async (req, res) => {
  try {
    const { status, cloudConfigId } = req.query;
    const where = { userId: req.userId };

    if (status) where.status = status;
    if (cloudConfigId) where.cloudConfigId = cloudConfigId;

    const domains = await Domain.findAll({
      where,
      include: [
        {
          model: CloudConfig,
          attributes: ['id', 'provider', 'name']
        },
        {
          model: Certificate,
          attributes: ['id', 'domain', 'status', 'expiresAt']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      domains
    });
  } catch (error) {
    logger.error('Get domains error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get domains'
    });
  }
};

const updateDomain = async (req, res) => {
  try {
    const { id } = req.params;
    const { description, autoSync, isActive } = req.body;

    const domain = await Domain.findOne({
      where: { id, userId: req.userId }
    });

    if (!domain) {
      return res.status(404).json({
        success: false,
        message: 'Domain not found'
      });
    }

    await domain.update({ description, autoSync, isActive });

    await TaskLog.create({
      userId: req.userId,
      action: 'UPDATE_DOMAIN',
      resourceType: 'Domain',
      resourceId: id,
      status: 'success'
    });

    logger.info(`Domain updated: ${id}`);
    res.json({
      success: true,
      message: 'Domain updated successfully',
      domain
    });
  } catch (error) {
    logger.error('Update domain error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update domain'
    });
  }
};

const deleteDomain = async (req, res) => {
  try {
    const { id } = req.params;

    const domain = await Domain.findOne({
      where: { id, userId: req.userId }
    });

    if (!domain) {
      return res.status(404).json({
        success: false,
        message: 'Domain not found'
      });
    }

    await domain.destroy();

    await TaskLog.create({
      userId: req.userId,
      action: 'DELETE_DOMAIN',
      resourceType: 'Domain',
      resourceId: id,
      status: 'success'
    });

    logger.info(`Domain deleted: ${id}`);
    res.json({
      success: true,
      message: 'Domain deleted successfully'
    });
  } catch (error) {
    logger.error('Delete domain error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete domain'
    });
  }
};

const syncDnsRecords = async (req, res) => {
  try {
    const { id } = req.params;

    const domain = await Domain.findOne({
      where: { id, userId: req.userId },
      include: [CloudConfig]
    });

    if (!domain) {
      return res.status(404).json({
        success: false,
        message: 'Domain not found'
      });
    }

    const cloudProvider = CloudProviderFactory.getProvider(domain.CloudConfig.provider);
    const records = await cloudProvider.getDnsRecords(
      domain.domain,
      domain.CloudConfig.credentials
    );

    await DnsService.syncRecords(id, records);
    await domain.update({ lastSyncAt: new Date() });

    await TaskLog.create({
      userId: req.userId,
      action: 'SYNC_DNS',
      resourceType: 'Domain',
      resourceId: id,
      status: 'success',
      details: { recordCount: records.length }
    });

    logger.info(`DNS records synced: ${id}`);
    res.json({
      success: true,
      message: 'DNS records synced successfully',
      recordCount: records.length
    });
  } catch (error) {
    logger.error('Sync DNS records error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync DNS records: ' + error.message
    });
  }
};

module.exports = {
  createDomain,
  getDomains,
  updateDomain,
  deleteDomain,
  syncDnsRecords
};
