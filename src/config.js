const { env } = require("process");
const randomString = require("./util/randomString");

module.exports = function ({ isTest } = {}) {
  const {
    JEST_WORKER_ID,
    SUBSCRIPTIONS_TABLE_NAME,
    PARTIES_TABLE_NAME,
    JWT_SECRET,
  } = env;

  const IS_TEST = isTest == null ? !!JEST_WORKER_ID : isTest;

  return {
    IS_TEST,
    DYNAMO_DB_TABLES: {
      SUBSCRIPTIONS: IS_TEST ? "Subscriptions" : SUBSCRIPTIONS_TABLE_NAME,
      PARTIES: IS_TEST ? "Parties" : PARTIES_TABLE_NAME,
    },
    JWT_SECRET: IS_TEST ? randomString() : JWT_SECRET,
  };
};
