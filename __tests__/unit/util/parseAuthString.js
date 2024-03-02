const { randomInt } = require("crypto");
const parseAuthString = require("../../../src/util/parseAuthString");

describe("parseAuthString", function () {
  it("should separate id and password", function () {
    const expectedId = randomInt(1, 1 << 10);
    const passwordInt = randomInt(1, 1 << 20);
    const expectedPassword = String(passwordInt);

    const authString = ((expectedId << 20) | passwordInt).toString(36);

    const { id: actualId, password: actualPassword } =
      parseAuthString(authString);
    expect(actualId).toEqual(expectedId);
    expect(actualPassword).toEqual(expectedPassword);
  });
});
