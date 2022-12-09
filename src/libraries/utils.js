const crypto = require('crypto');
const { AppError, ErrorCodes } = require('./error-handling');

/**
 * 500 错误
 * @param {string} message 消息
 * @param {object} options 选项
 * @returns {AppError} 错误对象
 */
const error500 = (message, options = {}) =>
  new AppError(message, {
    code: ErrorCodes.InternalServerError,
    HTTPStatus: 500,
    target: options.target || undefined,
    details: options.details || undefined,
    innerError: options.innerError || undefined,
    cause: options.cause || undefined,
    isTrusted: Object.prototype.hasOwnProperty.call(options, 'isTrusted')
      ? options.isTrusted
      : true,
  });

/**
 * 随眠指定时长
 * @param {integer} timeout 指定时长（毫秒）
 * @returns
 */
const sleep = async (timeout) =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, timeout);
  });

/**
 * 确定对象是否具有具有指定名称的属性
 * @param {object} obj 指定对象
 * @param {string} propertyKey 指定名称
 * @returns {boolean}
 */
const hasOwnProperty = (obj, propertyKey) =>
  Object.prototype.hasOwnProperty.call(obj, propertyKey);

/**
 * 生成 [min,max] 的随机整数
 * @param {integer} min 最小值（包含）
 * @param {integer} max 最大值（包含）
 * @returns {integer}
 */
const getRandomNum = (min, max) =>
  parseInt(Math.random() * (max - min + 1) + min, 10);

/**
 * 执行 MD5 加密
 * @param {string} data
 * @returns
 */
const md5 = (data) => crypto.createHash('md5').update(data).digest('hex');

module.exports = {
  error500,
  sleep,
  hasOwnProperty,
  getRandomNum,
  md5,
};
