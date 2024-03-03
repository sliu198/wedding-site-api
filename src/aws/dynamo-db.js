const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
} = require("@aws-sdk/lib-dynamodb");

const {
  IS_TEST,
  DYNAMO_DB_TABLES: { SUBSCRIPTIONS, PARTIES },
} = require("../config.js")();

module.exports = {
  putSubscription,
  getSubscription,
  getPartyHash,
};

const config = {};
if (IS_TEST) {
  Object.assign(config, {
    endpoint: "http://localhost:8000",
    tls: false,
    region: "local-env",
    credentials: {
      accessKeyId: "fakeid",
      secretAccessKey: "fakesecret",
    },
  });
}

const CLIENT = DynamoDBDocumentClient.from(new DynamoDBClient(config));

async function putSubscription({ email, name }) {
  const { key, canonical: canonicalEmail } = canonicalizeEmail(email);
  name = canonicalizeName(name);
  email = key;

  const oldItem = await getSubscription(email);

  if (!oldItem || oldItem.email !== canonicalEmail || oldItem.name !== name) {
    await CLIENT.send(
      new PutCommand({
        TableName: SUBSCRIPTIONS,
        Item: { email, canonicalEmail, name },
      }),
    );
  }

  return {
    email: canonicalEmail,
    name,
  };
}

async function getSubscription(email) {
  const { key } = canonicalizeEmail(email);

  const { Item } = await CLIENT.send(
    new GetCommand({
      TableName: SUBSCRIPTIONS,
      Key: { email: key },
    }),
  );

  return (
    Item && {
      email: Item.canonicalEmail,
      name: Item.name,
    }
  );
}

async function getPartyHash(id) {
  const { Item } = await CLIENT.send(
    new GetCommand({
      TableName: PARTIES,
      Key: { id },
    }),
  );

  return Item?.hash || "";
}

function canonicalizeEmail(email) {
  email = email.trim();
  const key = email.toLowerCase();
  const [local] = /[^@]*/.exec(email);
  const [domain] = /@.*/.exec(key);
  const canonical = `${local}${domain}`;

  return { key, canonical };
}

function canonicalizeName(name) {
  name = name.trim();
  return name.replace(/\s+/g, " ");
}
