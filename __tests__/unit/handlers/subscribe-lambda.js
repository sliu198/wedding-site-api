const { getSubscription } = require("../../../src/aws/dynamo-db.js");
const lambda = require("../../../src/handlers/subscribe-lambda.js");

const randomString = require("../../util/randomString.js");

describe("subscribe-lambda", function () {
  it("confirm successful request", async function () {
    const body = makeValidBody();
    const response = await lambda.handler(makeSubscribeRequest(body));

    confirmJsonResponse(response, body);
    const saved = await getSubscription(body.email);
    expect(saved).toEqual(body);
  });

  it("should canonicalize email and name", async function () {
    const local = randomString();
    const nonCanonicalEmail = ` ${local}@eXamPLE.com`;
    const canonicalEmail = `${local}@example.com`;

    const first = randomString();
    const middle = randomString();
    const last = randomString();

    const nonCanonicalName = ` ${first}\n${middle}\r\t${last}`;
    const canonicalName = [first, middle, last].join(" ");

    {
      // expect canonical values to be stored and returned
      const response = await lambda.handler(
        makeSubscribeRequest({
          email: nonCanonicalEmail,
          name: nonCanonicalName,
        }),
      );

      const canonicalSub = {
        email: canonicalEmail,
        name: canonicalName,
      };
      confirmJsonResponse(response, canonicalSub);
      expect(await getSubscription(nonCanonicalEmail)).toEqual(canonicalSub);
      expect(await getSubscription(canonicalEmail)).toEqual(canonicalSub);
    }

    {
      // expect case-insensitive email matching to update
      const lowerEmail = canonicalEmail.toLowerCase();
      const newName = randomString();
      const body = {
        email: lowerEmail,
        name: newName,
      };
      const response = await lambda.handler(makeSubscribeRequest(body));
      confirmJsonResponse(response, body);
      expect(await getSubscription(nonCanonicalEmail)).toEqual(body);
      expect(await getSubscription(canonicalEmail)).toEqual(body);
      expect(await getSubscription(lowerEmail)).toEqual(body);
    }
  });

  it("missing content type should result in 415", async function () {
    const body = makeValidBody();
    const request = makeSubscribeRequest(body);
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
    const body = makeValidBody();
    const request = makeSubscribeRequest(body);
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
    const request = makeSubscribeRequest(null);
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
    const request = makeSubscribeRequest([]);

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
    const body = makeValidBody();
    delete body.email;
    const request = makeSubscribeRequest(body);

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
    const body = makeValidBody();
    body.email = randomString();
    const request = makeSubscribeRequest(body);

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
    const body = makeValidBody();
    body.email = [];
    const request = makeSubscribeRequest(body);

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
    const body = makeValidBody();
    delete body.name;
    const request = makeSubscribeRequest(body);

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
    const body = makeValidBody();
    body.name = [];
    const request = makeSubscribeRequest(body);

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
    const request = makeSubscribeRequest({});

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

function makeValidBody() {
  return { name: randomString(), email: `${randomString()}@example.com` };
}

function makeSubscribeRequest(body) {
  return {
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
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
