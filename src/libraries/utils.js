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

module.exports = {
  sleep,
};
