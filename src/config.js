const { env } = require("process");

module.exports = function ({ isTest } = {}) {
  const { JEST_WORKER_ID, SUBSCRIPTIONS_TABLE_NAME } = env;

  const IS_TEST = isTest == null ? !!JEST_WORKER_ID : isTest;

  return {
    IS_TEST,
    DYNAMO_DB_TABLES: {
      SUBSCRIPTIONS: IS_TEST ? "Subscriptions" : SUBSCRIPTIONS_TABLE_NAME,
    },
  };
};
