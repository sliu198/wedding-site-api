// Import all functions from hello-from-lambda.js
const lambda = require('../../../src/handlers/subscribe-lambda.js');

describe('subscribe-lambda', function() {
  it('confirm successful request', async function() {
    const response = await lambda.handler({
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({name: 'abc', email: 'def@ghi'})
    });

    confirmJsonResponse(
      response,
      expect.objectContaining({
        message: expect.stringMatching(/Hello.*abc.*def@ghi/)
      }),
    )
  })
});

function confirmJsonResponse(response, expectedBody, {expectedStatusCode = 200} = {}) {
  const {
    body,
  } = response

  expect(response).toEqual(expect.objectContaining({
    statusCode: expectedStatusCode,
    headers: expect.objectContaining({
      'content-type': 'application/json',
    })
  }));

  const parsedBody = JSON.parse(body);
  expect(parsedBody).toEqual(expectedBody)
}
