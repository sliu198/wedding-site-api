const { randomInt } = require("crypto");
const { sign: signJwt } = require("jsonwebtoken");

const { putParty, del } = require("../../../src/aws/dynamo-db");
const lambda = require("../../../src/handlers/get-self-lambda");
const { JWT_SECRET, DYNAMO_DB_TABLES } = require("../../../src/config")();

const DOMAIN = "api.example.com";
describe("get-self-lambda", function () {
  let id;

  beforeEach(async function () {
    id = randomInt(1, 1 << 10);
    await putParty({ id });
  });

  afterEach(async function () {
    await del(DYNAMO_DB_TABLES.PARTIES, { id });
  });

  it("should return default values for missing", async function () {
    const jwt = signJwt({}, JWT_SECRET, {
      subject: String(id),
      issuer: DOMAIN,
      audience: DOMAIN,
      expiresIn: "2 minutes",
    });

    const actual = await lambda.handler({
      cookies: [`accessToken=${jwt}`],
      requestContext: {
        domainName: DOMAIN,
      },
    });

    expect(actual.statusCode).toEqual(200);
    expect(JSON.parse(actual.body)).toEqual({
      id,
      guests: [],
      maxGuests: 0,
      otherAccommodations: "",
      shuttleOptions: {
        pickUpLocation: "",
        dropOffLocation: "",
      },
    });
  });
});
