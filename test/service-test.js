/* eslint-disable no-await-in-loop */
const { Op } = require('sequelize');
const moment = require('moment');
const uuid = require('uuid');
const {
  beforeAll,
  afterAll,
  describe,
  test,
  expect,
  // eslint-disable-next-line import/no-extraneous-dependencies
} = require('@jest/globals');
const {
  getProducerModel,
  getProductModel,
  getPlanModel,
  getContractModel,
  getPolicyModel,
  getApplicantModel,
  getInsuredModel,
  getClaimModel,
  getClaimInsuredModel,
  getCompensationTaskModel,
} = require('../src/models');
const { getDbConnection } = require('../src/libraries/data-access');
const { getRedis } = require('../src/libraries/redis');
const { getBizConfig } = require('../src/libraries/biz-config');
const { md5, getRandomNum, sleep } = require('../src/libraries/utils');
const {
  getRandomPeriod,
  getRandomId,
  getRandomContactNo,
  getRandomName,
  getRandomGender,
  getRandomBirth,
} = require('./helper');

// 定义一个上下文变量
const ctx = {};

/**
 * 创建依赖数据
 */
const genDependencies = async () => {
  // 创建销售渠道
  const producerCode = `TEST-SERVICE-${Date.now()}`;
  await getProducerModel().create({
    name: '销售渠道(自动理赔测试)',
    code: producerCode,
  });
  ctx.producer = await getProducerModel().findOne({
    where: { code: producerCode },
  });

  // 创建保险产品
  const productCode = `TEST-SERVICE-${Date.now()}`;
  await getProductModel().create({
    name: '保险产品(自动理赔测试)',
    code: productCode,
    version: 1,
  });
  ctx.product = await getProductModel().findOne({
    where: { code: productCode },
  });

  // 创建保险计划
  const planCode = `TEST-SERVICE-${Date.now()}`;
  await getPlanModel().create({
    name: '保险计划(自动理赔测试)',
    code: planCode,
    version: 1,
    productId: ctx.product.id,
  });
  ctx.plan = await getPlanModel().findOne({
    where: { code: planCode },
  });

  // 创建授权契约
  const contractCode = `TEST-SERVICE-${Date.now()}`;
  await getContractModel().create({
    code: contractCode,
    version: 1,
    producerId: ctx.producer.id,
    productId: ctx.product.id,
    productVersion: ctx.product.version,
  });
  ctx.contract = await getContractModel().findOne({
    where: { code: contractCode },
  });

  // 获取业务规则配置
  ctx.bizConfig = await getBizConfig({
    product: ctx.product,
    plan: ctx.plan,
    producer: ctx.producer,
    contract: ctx.contract,
  });
};

/**
 * 清除依赖数据
 */
const clearnDependencies = async () => {
  // 删除授权契约
  await getContractModel().destroy({ where: { id: ctx.contract.id } });

  // 删除保险计划
  await getPlanModel().destroy({ where: { id: ctx.plan.id } });

  // 删除保险产品
  await getProductModel().destroy({ where: { id: ctx.product.id } });

  // 删除销售渠道
  await getProducerModel().destroy({ where: { id: ctx.producer.id } });
};

/**
 * 清除产生的测试数据
 */
const clearnTestDatas = async () => {
  // 查询需要删除的保单
  const policies = await getPolicyModel().findAll({
    attributes: ['id'],
    where: {
      contractId: ctx.contract.id,
      contractVersion: ctx.contract.version,
      planId: ctx.plan.id,
    },
  });
  const policyIds = policies.map((p) => p.id);

  // 删除保单
  await getPolicyModel().destroy({
    where: {
      id: {
        [Op.in]: policyIds,
      },
    },
  });

  // 删除投保人
  await getApplicantModel().destroy({
    where: {
      policyId: {
        [Op.in]: policyIds,
      },
    },
  });

  // 删除被保险人
  await getInsuredModel().destroy({
    where: {
      policyId: {
        [Op.in]: policyIds,
      },
    },
  });

  // 查询需要删除的理赔单
  const claims = await getClaimModel().findAll({
    attributes: ['id'],
    where: {
      policyId: {
        [Op.in]: policyIds,
      },
    },
  });
  const claimIds = claims.map((c) => c.id);

  // 删除理赔单
  await getClaimModel().destroy({
    where: {
      id: {
        [Op.in]: claimIds,
      },
    },
  });

  // 删除理赔单被保险人
  await getClaimInsuredModel().destroy({
    where: {
      claimId: {
        [Op.in]: claimIds,
      },
    },
  });

  // 删除理赔任务
  await getCompensationTaskModel().destroy({
    where: {
      claimId: {
        [Op.in]: claimIds,
      },
    },
  });
};

/**
 * 生成理赔单号
 * @returns {string}
 */
const genClaimNo = async () => {
  // 获取自增序号
  const incr = await getRedis().incr('claim-no-incr');

  // 生成理赔单号
  const date = moment().format('YYYYMMDD');
  const incrStr = `${incr}`.padStart(6, '0');
  const claimNo = `CLAIMS${date}${incrStr}`;

  return claimNo;
};

/**
 * 生成保单号
 */
const genPolicyNo = async () => {
  // 获取自增序号
  const incr = await getRedis().incr('policy-no-incr');

  // 生成保单号
  const date = moment().format('YYYYMMDD');
  const incrStr = `${incr}`.padStart(8, '0');
  const policyNo = `FOOINS${date}${incrStr}`;

  return policyNo;
};

// 文件内所有测试开始前执行的钩子函数
beforeAll(async () => {
  // 创建依赖数据
  await genDependencies();
});

// 文件内所有测试完成后执行的钩子函数
afterAll(async () => {
  // 清除依赖数据
  await clearnDependencies();

  // 清除产生的测试数据
  await clearnTestDatas();

  // 关闭数据库连接
  await getDbConnection().close();

  // 断开Redis连接
  await getRedis().end();
});

// 测试逻辑
describe('轮询服务', () => {
  test('当新增了自动理赔任务时，应自动执行理赔', async () => {
    // 1. 配置
    let task = null;
    {
      // 获取随机的保障期间
      const { effectiveTime, expiryTime } = getRandomPeriod();
      // 生成随机证件信息
      const { idType, idNo } = getRandomId();
      // 获取随机联系号码
      const contactNo = getRandomContactNo();

      // 构造保单
      const policy = await getPolicyModel().create({
        effectiveTime,
        expiryTime,
        orderNo: md5(uuid.v4()),
        policyNo: await genPolicyNo(),
        producerId: ctx.producer.id,
        contractId: ctx.contract.id,
        contractVersion: ctx.contract.version,
        productId: ctx.product.id,
        productVersion: ctx.product.version,
        planId: ctx.plan.id,
        bizConfig: JSON.stringify(ctx.bizConfig),
        boundTime: moment().toISOString(true),
        premium: getRandomNum(1, 1000),
        status: 'valid',
        extensions: JSON.stringify({}),
      });
      // 构造投保人
      const applicant = await getApplicantModel().create({
        idType,
        idNo,
        contactNo,
        no: uuid.v4(),
        policyId: policy.id,
        name: getRandomName(),
        gender: getRandomGender(),
        birth: getRandomBirth(),
        email: `${contactNo}@qq.com`,
      });
      // 构造被保险人
      const insured = await getInsuredModel().create({
        idType,
        idNo,
        contactNo,
        no: uuid.v4(),
        relationship: 'self',
        policyId: policy.id,
        name: applicant.name,
        gender: applicant.gender,
        birth: applicant.birth,
        email: applicant.email,
        premium: getRandomNum(1, 1000),
      });

      // 构造理赔单
      const claim = await getClaimModel().create({
        claimNo: await genClaimNo(),
        policyId: policy.id,
        producerId: ctx.producer.id,
        sumInsured: getRandomNum(1000, 10000),
        status: 'paid',
        bizConfig: JSON.stringify(ctx.bizConfig.claim),
      });
      // 构造理赔单被保险人
      await getClaimInsuredModel().create({
        claimId: claim.id,
        no: insured.no,
      });
      // 构造理赔任务
      task = await getCompensationTaskModel().create({
        claimId: claim.id,
        autoCompensate: 'enabled',
      });

      // 推送自动理赔队列消息
      await getRedis().xadd(
        'auto-compensate', // 队列名
        '*', // 表示由系统生成消息ID
        'tid', // 字段名
        task.id, // 字段值
      );
    }

    // 2. 执行
    // 无

    // 3. 断言
    // eslint-disable-next-line no-constant-condition
    while (true) {
      // 等待
      await sleep(1000);

      // 查询
      const taskNew = await getCompensationTaskModel().findOne({
        where: { id: task.id },
      });

      // 处理失败
      expect(taskNew.status).toEqual(expect.not.stringMatching('failure'));

      // 处理成功
      if (taskNew.status === 'succeed') break;
    }
  }, 5000);
});
