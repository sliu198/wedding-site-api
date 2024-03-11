const { randomInt } = require("crypto");
const { sign: signJwt } = require("jsonwebtoken");

const { del, getParty, get, put } = require("../../../src/aws/dynamo-db");
const lambda = require("../../../src/handlers/put-party-lambda");
const randomString = require("../../../src/util/randomString");
const { JWT_SECRET, DYNAMO_DB_TABLES } = require("../../../src/config")();

const DOMAIN = "api.example.com";
describe("get-self-lambda", function () {
  let id, hash;

  beforeEach(async function () {
    id = randomInt(1, 1 << 10);
    hash = randomString(12);
    await put(DYNAMO_DB_TABLES.PARTIES, { id, hash, maxGuests: 1 });
  });

  afterEach(async function () {
    await del(DYNAMO_DB_TABLES.PARTIES, { id });
  });

  it("should update appropriate values", async function () {
    const jwt = signJwt({}, JWT_SECRET, {
      subject: String(id),
      issuer: DOMAIN,
      audience: DOMAIN,
      expiresIn: "2 minutes",
    });

    const expectedParty = {
      id,
      guests: [
        {
          name: randomString(12),
          isAttending: true,
          dietaryRestrictions: randomString(12),
        },
      ],
      maxGuests: 1,
      shuttleOptions: {
        pickUpLocation: randomString(12),
        dropOffLocation: randomString(12),
      },
      otherAccommodations: randomString(12),
    };

    const actual = await lambda.handler({
      cookies: [`accessToken=${jwt}`],
      requestContext: {
        domainName: DOMAIN,
      },
      pathParameters: {
        id: String(id),
      },
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(expectedParty),
    });

    expect(actual.statusCode).toEqual(200);
    expect(JSON.parse(actual.body)).toEqual(expectedParty);

    const actualParty = await getParty(id);
    expect(actualParty).toEqual(expectedParty);

    const { Item: actualDdbValue } = await get(DYNAMO_DB_TABLES.PARTIES, {
      id,
    });
    expect(actualDdbValue).toEqual({
      hash,
      ...expectedParty,
    });
  });
});
