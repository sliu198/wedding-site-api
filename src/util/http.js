module.exports = {
  parseJson,
  makeJsonResponse,
  makeErrorResponse,
  makeInputValidationFunction,
  makeUnauthorizedError,
};

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
  const { statusCode, message } = error;

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

function makeUnauthorizedError(message = "Unauthorized") {
  return makeError(message, 401);
}

function makeUnsupportedMediaTypeError() {
  return makeError("Unsupported Media Type", 415);
}

function makeInputValidationFunction(schema) {
  return async function validate(input) {
    try {
      return await schema.validate(input, { abortEarly: false });
    } catch (error) {
      let { message } = error;
      if (error.errors.length > 1) {
        message += `: ${error.errors.join("; ")}`;
      }
      throw makeBadRequestError(message);
    }
  };
}