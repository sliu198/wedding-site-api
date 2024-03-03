const yup = require("yup");

const {
  parseJson,
  makeJsonResponse,
  makeErrorResponse,
  makeInputValidationFunction,
} = require("../util/http");

module.exports = {
  handler,
};

const { putSubscription } = require("../aws/dynamo-db.js");
const { trimmedEmail, trimmedString } = require("../util/validation.js");

const POST_SUBSCRIBE_SCHEMA = yup
  .object({
    email: trimmedEmail.required(),
    name: trimmedString.required(),
  })
  .noUnknown();

async function handler(request) {
  try {
    parseJson(request);

    const { body } = request;

    const item = await makeInputValidationFunction(POST_SUBSCRIBE_SCHEMA)(body);

    const updatedItem = await putSubscription(item);

    return makeJsonResponse(updatedItem);
  } catch (error) {
    const { statusCode } = error;
    if (statusCode >= 400 && statusCode < 500) return makeErrorResponse(error);

    throw error;
  }
}
