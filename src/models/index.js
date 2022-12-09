const getPolicyModel = require('./policy');
const getInsuredModel = require('./insured');
const getClaimModel = require('./claim');
const getClaimInsuredModel = require('./claim-insured');
const getCompensationTaskModel = require('./compensation-task');
const getNotifyTaskModel = require('./notify-task');
const getProducerModel = require('./producer');
const getContractModel = require('./contract');
const getPlanModel = require('./plan');
const getProductModel = require('./product');

module.exports = {
  getPolicyModel,
  getInsuredModel,
  getClaimModel,
  getClaimInsuredModel,
  getCompensationTaskModel,
  getNotifyTaskModel,
  getProducerModel,
  getContractModel,
  getPlanModel,
  getProductModel,
};
