const cron = require('node-cron');
const { Certificate, Domain, CloudConfig } = require('../../models');
const CertificateService = require('../certificate/CertificateService');
const logger = require('../../utils/logger');

class TaskScheduler {
  static initializeSchedules() {
    logger.info('Initializing task scheduler...');

    // Check certificates for renewal daily at 2 AM
    cron.schedule('0 2 * * *', async () => {
      logger.info('Running certificate renewal check');
      await this.checkCertificatesForRenewal();
    });

    // Sync DNS records every 6 hours
    cron.schedule('0 */6 * * *', async () => {
      logger.info('Running DNS synchronization');
      await this.syncAllDnsRecords();
    });

    // Clean up old task logs monthly
    cron.schedule('0 0 1 * *', async () => {
      logger.info('Cleaning up old task logs');
      await this.cleanupOldLogs();
    });
  }

  static async checkCertificatesForRenewal() {
    try {
      const certificates = await Certificate.findAll({
        where: { status: 'active', autoRenewal: true },
        include: [{ model: Domain, include: [CloudConfig] }]
      });

      for (const cert of certificates) {
        const expiryInfo = await CertificateService.checkCertificateExpiry(cert);
        
        if (expiryInfo.daysLeft <= 30 && expiryInfo.daysLeft > 0) {
          logger.info(`Certificate ${cert.id} expiring in ${expiryInfo.daysLeft} days - scheduling renewal`);
          // Queue renewal job
          await this.queueRenewalJob(cert);
        }
      }
    } catch (error) {
      logger.error('Certificate renewal check error:', error);
    }
  }

  static async syncAllDnsRecords() {
    try {
      const domains = await Domain.findAll({
        where: { autoSync: true },
        include: [CloudConfig]
      });

      for (const domain of domains) {
        try {
          logger.info(`Syncing DNS records for ${domain.domain}`);
          // Implement DNS sync logic
        } catch (error) {
          logger.error(`DNS sync failed for ${domain.domain}:`, error);
        }
      }
    } catch (error) {
      logger.error('DNS sync error:', error);
    }
  }

  static async cleanupOldLogs() {
    try {
      const { TaskLog } = require('../../models');
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      await TaskLog.destroy({
        where: {
          createdAt: { [require('sequelize').Op.lt]: thirtyDaysAgo },
          status: 'success'
        }
      });
      
      logger.info('Old task logs cleaned up');
    } catch (error) {
      logger.error('Cleanup logs error:', error);
    }
  }

  static async queueRenewalJob(certificate) {
    try {
      // Queue job for certificate renewal
      logger.info(`Certificate renewal job queued for ${certificate.id}`);
      // Implementation depends on job queue system (Bull, BullMQ, etc.)
    } catch (error) {
      logger.error('Queue renewal job error:', error);
    }
  }
}

module.exports = TaskScheduler;
