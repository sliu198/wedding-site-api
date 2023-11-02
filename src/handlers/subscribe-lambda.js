const yup = require('yup');

module.exports = {
  handler,
}

const POST_SUBSCRIBE_SCHEMA = yup.object({
  name: yup.string().required(),
  email: yup.string().required().email()
}).noUnknown().typeError('request body must be a JSON object');

async function handler(request) {
  const {pathParameters: {proxy = ''}} = request;

  if (proxy) throw makeNotFoundError();

  parseJson(request);

  const {body} = request;

  const {
    name,
    email
  } = await POST_SUBSCRIBE_SCHEMA.validate(body);

  return makeJsonResponse({
    message: `Hello ${name}, thank you for submitting your email ${email}.`
  });
}

function parseJson(request) {
  const {
    headers: {
      'content-type': contentType
    } = {}
  } = request;

  if (contentType !== 'application/json') {
    throw makeUnsupportedMediaTypeError();
  }

  try {
    request.body = JSON.parse(request.body || '');
  } catch (error) {
    throw makeBadRequestError(`Invalid JSON: ${error.message}`);
  }
}

function makeJsonResponse(body, {statusCode = 200, headers} = {}) {
  return {
    statusCode,
    headers: {
      ...headers,
      'content-type': 'application/json',
    },
    body: JSON.stringify(body)
  }
}

function makeErrorResponse(error) {
  let {
    statusCode = 500,
    message,
  } = error;

  if (error.statusCode >= 500) {
    message = 'Internal Server Error';
  }

  return makeJsonResponse({message}, {statusCode});
}

function makeError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function makeBadRequestError(message = 'Bad Request') {
  return makeError(message, 400);
}

function makeNotFoundError() {
  return makeError('Not Found', 404);
}

function makeMethodNotAllowedError() {
  return makeError('Method Not Allowed', 405);
}

function makeUnsupportedMediaTypeError() {
  return makeError('Unsupported Media Type', 415);
}

