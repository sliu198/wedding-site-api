const lambda = require("../../../src/handlers/subscribe-lambda.js");

describe("subscribe-lambda", function () {
  it("confirm successful request", async function () {
    const response = await lambda.handler(makeValidSubscribe());

    confirmJsonResponse(
      response,
      expect.objectContaining({
        message: expect.stringMatching(/Hello.*abc.*def@ghi/),
      }),
    );
  });

  it("missing content type should result in 415", async function () {
    const request = makeValidSubscribe();
    delete request.headers["content-type"];

    const response = await lambda.handler(request);

    confirmJsonResponse(
      response,
      expect.objectContaining({
        message: "Unsupported Media Type",
      }),
      {
        expectedStatusCode: 415,
      },
    );
  });

  it("wrong content type should result in 415", async function () {
    const request = makeValidSubscribe();
    request.headers["content-type"] = "foobar";

    const response = await lambda.handler(request);

    confirmJsonResponse(
      response,
      expect.objectContaining({
        message: "Unsupported Media Type",
      }),
      {
        expectedStatusCode: 415,
      },
    );
  });

  it("unparseable body should error", async function () {
    const request = makeValidSubscribe();
    request.body = "";

    const response = await lambda.handler(request);

    confirmJsonResponse(
      response,
      expect.objectContaining({
        message: expect.stringMatching(/unexpected end/i),
      }),
      {
        expectedStatusCode: 400,
      },
    );
  });

  it("non-object should error", async function () {
    const request = makeValidSubscribe();
    request.body = "[]";

    const response = await lambda.handler(request);

    confirmJsonResponse(
      response,
      expect.objectContaining({
        message: expect.stringMatching(/must be a `object`/i),
      }),
      {
        expectedStatusCode: 400,
      },
    );
  });

  it("missing email should error", async function () {
    const request = makeValidSubscribe();
    const parsedBody = JSON.parse(request.body);
    delete parsedBody.email;
    request.body = JSON.stringify(parsedBody);

    const response = await lambda.handler(request);

    confirmJsonResponse(
      response,
      expect.objectContaining({
        message: "email is a required field",
      }),
      {
        expectedStatusCode: 400,
      },
    );
  });

  it("invalid email should error", async function () {
    const request = makeValidSubscribe();
    const parsedBody = JSON.parse(request.body);
    parsedBody.email = "abc";
    request.body = JSON.stringify(parsedBody);

    const response = await lambda.handler(request);

    confirmJsonResponse(
      response,
      expect.objectContaining({
        message: "email must be a valid email",
      }),
      {
        expectedStatusCode: 400,
      },
    );
  });

  it("wrong email type should error", async function () {
    const request = makeValidSubscribe();
    const parsedBody = JSON.parse(request.body);
    parsedBody.email = [];
    request.body = JSON.stringify(parsedBody);

    const response = await lambda.handler(request);

    confirmJsonResponse(
      response,
      expect.objectContaining({
        message: expect.stringMatching(/email must be a `string`/),
      }),
      {
        expectedStatusCode: 400,
      },
    );
  });

  it("missing name should error", async function () {
    const request = makeValidSubscribe();
    const parsedBody = JSON.parse(request.body);
    delete parsedBody.name;
    request.body = JSON.stringify(parsedBody);

    const response = await lambda.handler(request);

    confirmJsonResponse(
      response,
      expect.objectContaining({
        message: "name is a required field",
      }),
      {
        expectedStatusCode: 400,
      },
    );
  });

  it("wrong name type should error", async function () {
    const request = makeValidSubscribe();
    const parsedBody = JSON.parse(request.body);
    parsedBody.name = [];
    request.body = JSON.stringify(parsedBody);

    const response = await lambda.handler(request);

    confirmJsonResponse(
      response,
      expect.objectContaining({
        message: expect.stringMatching(/name must be a `string`/),
      }),
      {
        expectedStatusCode: 400,
      },
    );
  });

  it("multiple errors should be joined", async function () {
    const request = makeValidSubscribe();
    request.body = "{}";

    const response = await lambda.handler(request);

    confirmJsonResponse(
      response,
      expect.objectContaining({
        message: expect.stringMatching(
          /2 errors.*email.*required.*name.*required/,
        ),
      }),
      {
        expectedStatusCode: 400,
      },
    );
  });
});

function makeValidSubscribe() {
  return {
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ name: "abc", email: "def@ghi" }),
  };
}

function confirmJsonResponse(
  response,
  expectedBody,
  { expectedStatusCode = 200 } = {},
) {
  const { body } = response;

  expect(response).toEqual(
    expect.objectContaining({
      statusCode: expectedStatusCode,
      headers: expect.objectContaining({
        "content-type": "application/json",
      }),
    }),
  );

  const parsedBody = JSON.parse(body);
  expect(parsedBody).toEqual(expectedBody);
}
