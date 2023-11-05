const {
  DYNAMO_DB_TABLES: { SUBSCRIPTIONS },
} = require("./src/config.js")({ isTest: true });

module.exports = {
  tables: [
    {
      TableName: SUBSCRIPTIONS,
      KeySchema: [{ AttributeName: "email", KeyType: "HASH" }],
      AttributeDefinitions: [{ AttributeName: "email", AttributeType: "S" }],
      ProvisionedThroughput: { ReadCapacityUnits: 1, WriteCapacityUnits: 1 },
    },
  ],
};
