const winston = require('winston');
const { startService } = require('./service');
const { validateConfigs } = require('./libraries/configuration');
const { getDbConnection } = require('./libraries/data-access');
const { getRedis } = require('./libraries/redis');
const {
  handleError,
  AppError,
  ErrorCodes,
  listenToErrorEvents,
} = require('./libraries/error-handling');

// 创建日志记录器
const logger = require('./libraries/logger')('start', {
  level: 'info',
  noErrorFile: true,
  consoleAll: true,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(
      (info) => `${info.timestamp}|${process.pid}|${info.message}`,
    ),
  ),
});

(async () => {
  try {
    // 监听全局错误事件
    listenToErrorEvents();

    // 校验配置
    validateConfigs();
    logger.info('所有配置校验通过');

    // 连接数据库
    await getDbConnection().authenticate();
    logger.info('数据库连接成功');

    // 连接Redis
    await Promise.race([
      new Promise((resolve) => {
        getRedis().on('connect', () => {
          logger.info('Redis连接成功');
          resolve();
        });
      }),
      new Promise((resolve, reject) => {
        setTimeout(() => {
          reject(new Error('Redis连接超时'));
        }, 3000);
      }),
    ]);

    // 启动服务
    logger.info('开始轮询...');
    await startService();
  } catch (error) {
    handleError(
      new AppError(error.message, {
        code: ErrorCodes.InternalServerError,
        isTrusted: false,
        cause: error,
      }),
    );
  }
})();
