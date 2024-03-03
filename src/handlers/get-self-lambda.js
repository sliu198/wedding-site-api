const {
  makeJsonResponse,
  makeErrorResponse,
  validateAuthCookie,
} = require("../util/http");

module.exports = {
  handler,
};

async function handler(request) {
  try {
    const { sub } = validateAuthCookie(request);

    return makeJsonResponse({ id: Number.parseInt(sub) });
  } catch (error) {
    const { statusCode } = error;
    if (statusCode >= 400 && statusCode < 500) return makeErrorResponse(error);

    throw error;
  }
}
