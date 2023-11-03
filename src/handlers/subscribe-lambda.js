const yup = require("yup");

module.exports = {
  handler,
};

const POST_SUBSCRIBE_SCHEMA = yup
  .object({
    email: yup.string().required().email(),
    name: yup.string().required(),
  })
  .noUnknown();

async function handler(request) {
  try {
    parseJson(request);

    const { body } = request;

    const { name, email } = await validate(body);

    return makeJsonResponse({
      message: `Hello ${name}, thank you for submitting your email ${email}.`,
    });
  } catch (error) {
    const { statusCode } = error;
    if (statusCode >= 400 && statusCode < 500) return makeErrorResponse(error);

    throw error;
  }
}

function parseJson(request) {
  const { headers: { "content-type": contentType } = {} } = request;

  if (contentType !== "application/json") {
    throw makeUnsupportedMediaTypeError();
  }

  try {
    request.body = JSON.parse(request.body || "");
  } catch (error) {
    throw makeBadRequestError(`Invalid JSON: ${error.message}`);
  }
}

async function validate(input) {
  try {
    return await POST_SUBSCRIBE_SCHEMA.validate(input, { abortEarly: false });
  } catch (error) {
    let { message } = error;
    if (error.errors.length > 1) {
      message += `: ${error.errors.join("; ")}`;
    }
    throw makeBadRequestError(message);
  }
}

function makeJsonResponse(body, { statusCode = 200, headers } = {}) {
  return {
    statusCode,
    headers: {
      ...headers,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  };
}

function makeErrorResponse(error) {
  let { statusCode, message } = error;

  return makeJsonResponse({ message }, { statusCode });
}

function makeError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function makeBadRequestError(message = "Bad Request") {
  return makeError(message, 400);
}

function makeUnsupportedMediaTypeError() {
  return makeError("Unsupported Media Type", 415);
}
