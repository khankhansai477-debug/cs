const { Certificate, Domain, CloudConfig, TaskLog } = require('../models');
const logger = require('../utils/logger');
const CertificateService = require('../services/certificate/CertificateService');
const CloudProviderFactory = require('../services/cloud/CloudProviderFactory');

const createCertificate = async (req, res) => {
  try {
    const { domainId, certificateType = 'letsencrypt', autoRenewal = true, description } = req.body;

    const domain = await Domain.findOne({
      where: { id: domainId, userId: req.userId },
      include: [CloudConfig]
    });

    if (!domain) {
      return res.status(404).json({
        success: false,
        message: 'Domain not found'
      });
    }

    const existingCert = await Certificate.findOne({
      where: { domainId, status: ['active', 'pending'] }
    });

    if (existingCert) {
      return res.status(400).json({
        success: false,
        message: 'Active certificate already exists for this domain'
      });
    }

    const cert = await Certificate.create({
      userId: req.userId,
      domainId,
      domain: domain.domain,
      certificateType,
      autoRenewal,
      description,
      status: 'pending'
    });

    // Request certificate based on type
    if (certificateType === 'letsencrypt') {
      try {
        const certData = await CertificateService.requestLetsEncryptCertificate(
          domain,
          domain.CloudConfig
        );
        
        await cert.update({
          certificate: certData.certificate,
          privateKey: certData.privateKey,
          chain: certData.chain,
          issuedAt: new Date(),
          expiresAt: certData.expiresAt,
          status: 'active'
        });
      } catch (error) {
        await cert.update({ status: 'failed' });
        throw error;
      }
    }

    await TaskLog.create({
      userId: req.userId,
      action: 'CREATE_CERTIFICATE',
      resourceType: 'Certificate',
      resourceId: cert.id,
      status: 'success',
      details: { domain: domain.domain, type: certificateType }
    });

    logger.info(`Certificate created: ${domain.domain} (${certificateType})`);
    res.status(201).json({
      success: true,
      message: 'Certificate created successfully',
      certificate: {
        id: cert.id,
        domain: cert.domain,
        status: cert.status,
        certificateType: cert.certificateType,
        issuedAt: cert.issuedAt,
        expiresAt: cert.expiresAt
      }
    });
  } catch (error) {
    logger.error('Create certificate error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create certificate: ' + error.message
    });
  }
};

const getCertificates = async (req, res) => {
  try {
    const { status, domainId } = req.query;
    const where = { userId: req.userId };

    if (status) where.status = status;
    if (domainId) where.domainId = domainId;

    const certificates = await Certificate.findAll({
      where,
      include: [
        {
          model: Domain,
          attributes: ['id', 'domain', 'isWildcard']
        }
      ],
      attributes: { exclude: ['certificate', 'privateKey', 'chain'] },
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      certificates
    });
  } catch (error) {
    logger.error('Get certificates error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get certificates'
    });
  }
};

const getCertificateDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const certificate = await Certificate.findOne({
      where: { id, userId: req.userId },
      include: [
        {
          model: Domain,
          attributes: ['id', 'domain', 'isWildcard']
        }
      ],
      attributes: { exclude: ['privateKey', 'chain'] }
    });

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found'
      });
    }

    res.json({
      success: true,
      certificate
    });
  } catch (error) {
    logger.error('Get certificate detail error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get certificate detail'
    });
  }
};

const renewCertificate = async (req, res) => {
  try {
    const { id } = req.params;

    const certificate = await Certificate.findOne({
      where: { id, userId: req.userId },
      include: [{ model: Domain, include: [CloudConfig] }]
    });

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found'
      });
    }

    await certificate.update({ status: 'renewing' });

    try {
      const certData = await CertificateService.requestLetsEncryptCertificate(
        certificate.Domain,
        certificate.Domain.CloudConfig
      );

      await certificate.update({
        certificate: certData.certificate,
        privateKey: certData.privateKey,
        chain: certData.chain,
        issuedAt: new Date(),
        expiresAt: certData.expiresAt,
        status: 'active',
        renewalCount: (certificate.renewalCount || 0) + 1
      });
    } catch (error) {
      await certificate.update({ status: 'failed' });
      throw error;
    }

    await TaskLog.create({
      userId: req.userId,
      action: 'RENEW_CERTIFICATE',
      resourceType: 'Certificate',
      resourceId: id,
      status: 'success'
    });

    logger.info(`Certificate renewed: ${id}`);
    res.json({
      success: true,
      message: 'Certificate renewed successfully',
      expiresAt: certificate.expiresAt
    });
  } catch (error) {
    logger.error('Renew certificate error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to renew certificate: ' + error.message
    });
  }
};

const uploadCertificate = async (req, res) => {
  try {
    const { id } = req.params;
    const { certificate, privateKey, chain, description } = req.body;

    const cert = await Certificate.findOne({
      where: { id, userId: req.userId }
    });

    if (!cert) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found'
      });
    }

    // Validate certificate
    const certInfo = await CertificateService.parseCertificate(certificate);

    await cert.update({
      certificate,
      privateKey,
      chain,
      description,
      certificateType: 'manual',
      issuedAt: certInfo.validFrom,
      expiresAt: certInfo.validTo,
      status: 'active'
    });

    await TaskLog.create({
      userId: req.userId,
      action: 'UPLOAD_CERTIFICATE',
      resourceType: 'Certificate',
      resourceId: id,
      status: 'success'
    });

    logger.info(`Certificate uploaded: ${id}`);
    res.json({
      success: true,
      message: 'Certificate uploaded successfully',
      expiresAt: cert.expiresAt
    });
  } catch (error) {
    logger.error('Upload certificate error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload certificate: ' + error.message
    });
  }
};

module.exports = {
  createCertificate,
  getCertificates,
  getCertificateDetail,
  renewCertificate,
  uploadCertificate
};
