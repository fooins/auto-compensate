const config = require('config');
const uuid = require('uuid');
const { sleep, error500 } = require('./libraries/utils');
const { getRedis } = require('./libraries/redis');
const dao = require('./dao');
const logger = require('./libraries/logger')('service', {
  level: 'info',
  noErrorFile: true,
  consoleNot: true,
});

// 消费者名称
const consumer = uuid.v4();

/**
 * 创建消费者组
 */
const createGroup = async () => {
  try {
    await getRedis().xgroup(
      'CREATE',
      `insbiz:${config.get('queue.key')}`, // 队列名（这里需要手动加前缀）
      config.get('queue.group'), // 消费者组名
      '0-0', // 0-0 表示从头开始消费
      'MKSTREAM', // 队列不存在时创建队列
    );
  } catch (error) {
    // 已存在则忽略
  }
};

/**
 * 读取队列消息
 * @returns {array}
 */
const readMsgs = async () => {
  // 读取消息
  const rst = await getRedis().xreadgroup(
    'GROUP',
    config.get('queue.group'), // 消费者组名
    consumer, // 消费者名称
    'COUNT',
    config.get('queue.count'), // 获取的条数
    'STREAMS',
    config.get('queue.key'), // 队列名
    '>', // > 表示接收从未传递给任何其他消费者的消息
  );
  if (!rst) return [];
  logger.info(rst);

  // 数据格式校验
  if (!Array.isArray(rst) || !Array.isArray(rst[0])) {
    throw error500('队列数据有误');
  }
  const [[key, infos]] = rst;
  if (key !== `insbiz:${config.get('queue.key')}`) {
    throw error500('队列数据归属有误');
  }

  // 解析数据
  const taskIds = [];
  for (let i = 0; i < infos.length; i += 1) {
    const [id, content] = infos[i] || [];
    if (!id) throw error500('消息ID有误');
    if (!Array.isArray(content)) throw error500('消息内容有误');

    const [field, value] = content;
    if (field !== 'tid') throw error500('字段名有误');
    if (!value) throw error500('tid值有误');

    taskIds.push(value);
  }

  return taskIds;
};

//
//
//
//
//
//
//
//
// <<<<<

/**
 * 查询任务
 * @param {array} taskIds 任务ID列表
 * @returns {array}
 */
const queryTasks = async (taskIds) => {
  //
  //
  //
  //
  //
  //

  // 查询任务
  const tasks = await dao.queryTasks(taskIds);

  // 任务检查

  // 更新状态为处理中
  await dao.handingTasks(tasks);

  return tasks;
};

/**
 * 启动服务
 */
const start = async () => {
  // 创建消费者组
  await createGroup();

  // 轮询
  // eslint-disable-next-line no-constant-condition
  while (true) {
    // 停顿
    // eslint-disable-next-line no-await-in-loop
    await sleep(2000);

    // 读取队列消息
    // eslint-disable-next-line no-await-in-loop
    const taskIds = await readMsgs();

    //
    //
    //
    //
    //
    //

    // 查询任务数据
    // const tasks =
    // eslint-disable-next-line no-await-in-loop
    await queryTasks(taskIds);

    // 执行处理
  }
};

// module.exports = async () => {
//   // 查询待处理的任务
//   const tasks = await queryPendingTasks();

//   // 拆分批次
//   const trunks = _.chunk(tasks, 10);

//   // 分批执行处理
//   for (let i = 0; i < trunks.length; i += 1) {
//     // eslint-disable-next-line no-await-in-loop
//     await Promise.all(trunks[i].map((task) => handler(task)));
//   }
// };

// const _ = require('lodash');
// const dao = require('./dao');
// const formulas = require('../../libraries/formulas');

// /**
//  * 执行赔付
//  * @param {object} task 赔付任务
//  */
// const compensation = async (task) => {
//   const { Claim: claim } = task;
//   const { premium, autoCompensate } = claim.bizConfigParsed;
//   const { calculateMode, formula, fixed } = premium;
//   const { maximum } = autoCompensate;

//   // 写入开始处理时间
//   await dao.updateCompensationTask({ handledAt: Date.now() }, { id: task.id });

//   // 计算保额
//   if (calculateMode === 'fixed') {
//     claim.sumInsured = 0;
//     claim.insureds.forEach((insured, i) => {
//       claim.insureds[i].sumInsured = fixed;
//       claim.sumInsured += fixed;
//     });
//   } else if (calculateMode === 'formula') {
//     const { name, params } = formula;

//     if (
//       !hasOwnProperty(formulas, name) ||
//       typeof formulas[name] !== 'function'
//     ) {
//       throw error500('计费公式有误');
//     }

//     const ctx = {
//       claim,
//       policy: claim.Policy,
//     };
//     formulas[name](ctx, 'claim', params);
//     claim.sumInsured = ctx.claim.sumInsured;
//     claim.insureds = ctx.claim.insureds;
//   }

//   // 保额校验
//   let totalSumInsured = 0;
//   claim.insureds.forEach((insured) => {
//     totalSumInsured += insured.sumInsured;
//   });
//   if (totalSumInsured !== claim.sumInsured) {
//     throw error500(`计费错误，被保险人总保额不等于理赔单总保额`);
//   }
//   if (claim.sumInsured > maximum) {
//     throw error500('赔付金额大于允许的范围');
//   }

//   // 理赔成功，更新相关数据
//   await dao.compensationSuccessed({ claim, task });
// };

// /**
//  * 执行处理
//  * @param {object} task 赔付任务
//  */
// const handler = async (task) => {
//   try {
//     await compensation(task);
//   } catch (error) {
//     // 处理失败记录原因
//     await dao.updateCompensationTask(
//       {
//         status: 'failure',
//         finishedAt: Date.now(),
//         failureReasons: JSON.stringify({
//           message: error.message,
//           stack: error.stack,
//           ...error,
//         }),
//       },
//       { id: task.id },
//     );
//   }
// };

module.exports = {
  start,
};
