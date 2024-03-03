const { randomInt } = require("crypto");
const { sign: signJwt } = require("jsonwebtoken");

const lambda = require("../../../src/handlers/get-self-lambda");
const { JWT_SECRET } = require("../../../src/config")();

const DOMAIN = "api.example.com";
describe("get-self-lambda", function () {
  it("should return success if request is made with valid auth", async function () {
    const id = randomInt(1, 1 << 10);
    const jwt = signJwt({}, JWT_SECRET, {
      subject: String(id),
      issuer: DOMAIN,
      audience: DOMAIN,
      expiresIn: "2 minutes",
    });

    const actual = await lambda.handler({
      headers: {
        cookie: `accessToken=${jwt}`,
      },
      requestContext: {
        domainName: DOMAIN,
      },
    });

    expect(actual.statusCode).toEqual(200);
    expect(JSON.parse(actual.body)).toEqual({ id });
  });
});
