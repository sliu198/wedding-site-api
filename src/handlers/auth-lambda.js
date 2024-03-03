const yup = require("yup");
const { Cookie } = require("tough-cookie");
const { sign: signJwt } = require("jsonwebtoken");

const {
  parseJson,
  makeInputValidationFunction,
  makeErrorResponse,
  makeJsonResponse,
  makeUnauthorizedError,
} = require("../util/http");
const parseAuthString = require("../util/parseAuthString");
const authenticate = require("../util/authenticate");
const { getPartyHash } = require("../aws/dynamo-db");
const config = require("../config")();

module.exports = {
  handler,
};

const POST_AUTH_SCHEMA = yup
  .object({
    authToken: yup.string().required(),
  })
  .noUnknown();

async function handler(request) {
  try {
    parseJson(request);

    const {
      body,
      requestContext: { domainName },
    } = request;

    const { authToken } =
      await makeInputValidationFunction(POST_AUTH_SCHEMA)(body);

    const { id, password } = parseAuthString(authToken);

    const hash = await getPartyHash(id);

    if (await authenticate(password, hash)) {
      const jwt = signJwt({}, config.JWT_SECRET, {
        subject: String(id),
        issuer: domainName,
        audience: domainName,
        expiresIn: "1y",
      });

      const cookie = new Cookie({
        key: "accessToken",
        value: jwt,
        secure: true,
        httpOnly: true,
        sameSite: "strict",
      });

      return makeJsonResponse(
        {},
        {
          headers: {
            "Set-Cookie": cookie.toString(),
          },
        },
      );
    }

    throw makeUnauthorizedError();
  } catch (error) {
    const { statusCode } = error;
    if (statusCode >= 400 && statusCode < 500) return makeErrorResponse(error);

    throw error;
  }
}
