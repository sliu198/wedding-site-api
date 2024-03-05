const {
  makeJsonResponse,
  makeErrorResponse,
  validateAuthCookie,
  makeNotFoundError,
} = require("../util/http");
const { getParty } = require("../aws/dynamo-db");

module.exports = {
  handler,
};

async function handler(request) {
  try {
    const { sub } = validateAuthCookie(request);
    const id = Number.parseInt(sub);

    const party = await getParty(id);

    if (!party) {
      throw makeNotFoundError();
    }

    return makeJsonResponse(party);
  } catch (error) {
    const { statusCode } = error;
    if (statusCode >= 400 && statusCode < 500) return makeErrorResponse(error);

    throw error;
  }
}
