const yup = require('yup');

module.exports = {
  indexHandler,
}

const POST_SUBSCRIBE_SCHEMA = yup.object({
  name: yup.string().required(),
  email: yup.string().required().email()
}).noUnknown().typeError('request body must be a JSON object');

async function indexHandler(request){
  const {requestContext: {http: {path}}} = request
  const pathParts = path.split('/');
  pathParts.shift(); // the first part will always be empty
  const part = pathParts.shift() || '';

  try {
    if (part === 'subscribe') {
      return await subscribeHandler(request, {pathParts})
    } else {
      throw makeNotFoundError();
    }
  } catch (error) {
    return makeErrorResponse(error);
  }
}

async function subscribeHandler(request, {pathParts}) {
  const {requestContext: {http: {method}}} = request;
  const pathPart = pathParts.shift();

  if (pathPart || pathParts.length) throw makeNotFoundError();

  if (method !== 'POST') throw makeMethodNotAllowedError();

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

