const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  DeleteCommand,
} = require("@aws-sdk/lib-dynamodb");
const _ = require("lodash");

const {
  IS_TEST,
  DYNAMO_DB_TABLES: { SUBSCRIPTIONS, PARTIES },
} = require("../config.js")();

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

module.exports = {
  get,
  put,
  del,
  putSubscription,
  getSubscription,
  getPartyHash,
  getParty,
  putParty,
};

async function get(table, key) {
  return await CLIENT.send(
    new GetCommand({
      TableName: table,
      Key: key,
    }),
  );
}

async function put(table, item) {
  return await CLIENT.send(
    new PutCommand({
      TableName: table,
      Item: item,
    }),
  );
}

async function del(table, key) {
  return await CLIENT.send(
    new DeleteCommand({
      TableName: table,
      Key: key,
    }),
  );
}

async function putSubscription({ email, name }) {
  const { key, canonical: canonicalEmail } = canonicalizeEmail(email);
  name = canonicalizeName(name);
  email = key;

  const oldItem = await getSubscription(email);

  if (!oldItem || oldItem.email !== canonicalEmail || oldItem.name !== name) {
    await put(SUBSCRIPTIONS, { email, canonicalEmail, name });
  }

  return {
    email: canonicalEmail,
    name,
  };
}

async function getSubscription(email) {
  const { key } = canonicalizeEmail(email);

  const { Item } = await get(SUBSCRIPTIONS, { email: key });

  return (
    Item && {
      email: Item.canonicalEmail,
      name: Item.name,
    }
  );
}

async function getPartyHash(id) {
  const { Item } = await get(PARTIES, { id });

  return Item?.hash || "";
}

const PARTY_PROPS = [
  "id",
  "guests",
  "maxGuests",
  "shuttleOptions",
  "otherAccommodations",
];

async function getParty(id) {
  const { Item } = await get(PARTIES, { id });

  if (!Item) return Item;

  const party = _.chain(Item)
    .pick(PARTY_PROPS)
    .defaultsDeep({
      guests: [],
      maxGuests: Item.guests?.length || 0,
      shuttleOptions: {
        pickUpLocation: "",
        dropOffLocation: "",
      },
      otherAccommodations: "",
    })
    .value();

  party.guests.forEach((guest) => {
    return _.defaultsDeep(guest, {
      name: "",
      isAttending: null,
      dietaryRestrictions: "",
    });
  });

  return party;
}

async function putParty(item) {
  item = _.pick(item, PARTY_PROPS);

  const { Item } = await get(PARTIES, { id: item.id });
  if (Item) {
    Object.assign(item, _.omit(Item, PARTY_PROPS));
  }

  await put(PARTIES, item);

  return item;
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
