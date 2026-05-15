const { TaskLog } = require('../models');
const logger = require('../utils/logger');

const getTaskLogs = async (req, res) => {
  try {
    const { action, status, resourceType, page = 1, limit = 20 } = req.query;
    const where = { userId: req.userId };

    if (action) where.action = action;
    if (status) where.status = status;
    if (resourceType) where.resourceType = resourceType;

    const offset = (page - 1) * limit;

    const { count, rows } = await TaskLog.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      offset,
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      logs: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    logger.error('Get task logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get task logs'
    });
  }
};

const getTaskLogDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const log = await TaskLog.findOne({
      where: { id, userId: req.userId }
    });

    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Task log not found'
      });
    }

    res.json({
      success: true,
      log
    });
  } catch (error) {
    logger.error('Get task log detail error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get task log detail'
    });
  }
};

const getStats = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const stats = await TaskLog.findAll({
      where: {
        userId: req.userId,
        createdAt: { [require('sequelize').Op.gte]: fromDate }
      },
      attributes: ['action', 'status'],
      raw: true
    });

    const actionCounts = {};
    const statusCounts = { success: 0, failed: 0, pending: 0 };

    stats.forEach(stat => {
      actionCounts[stat.action] = (actionCounts[stat.action] || 0) + 1;
      statusCounts[stat.status] = statusCounts[stat.status] + 1;
    });

    res.json({
      success: true,
      stats: {
        total: stats.length,
        byAction: actionCounts,
        byStatus: statusCounts,
        period: { days, from: fromDate }
      }
    });
  } catch (error) {
    logger.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get stats'
    });
  }
};

module.exports = {
  getTaskLogs,
  getTaskLogDetail,
  getStats
};
