const getPolicyModel = require('./policy');
const getInsuredModel = require('./insured');
const getClaimModel = require('./claim');
const getClaimInsuredModel = require('./claim-insured');
const getCompensationTaskModel = require('./compensation-task');
const getNotifyTaskModel = require('./notify-task');

module.exports = {
  getPolicyModel,
  getInsuredModel,
  getClaimModel,
  getClaimInsuredModel,
  getCompensationTaskModel,
  getNotifyTaskModel,
};
