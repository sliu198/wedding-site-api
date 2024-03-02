const { scrypt: _scrypt, randomBytes } = require("crypto");
const { promisify } = require("util");
const authenticate = require("../../../src/util/authenticate");

const scrypt = promisify(_scrypt);
const { SCRYPT_PARAMS } = authenticate;

describe("authenticate", function () {
  it("should return false if password is not provided", async function () {
    const hash = await makeHash("");
    expect(await authenticate("", hash)).toEqual(false);
  });

  it("should return false if salt is not provided", async function () {
    const password = makeRandomPassword();
    const hash = await makeHash(password, { salt: Buffer.from([]) });

    expect(await authenticate(password, hash)).toEqual(false);
  });

  it("should return false if digest is not provided", async function () {
    const password = makeRandomPassword();
    const hash = `${randomBytes(8).toString("base64url")}:`;

    expect(await authenticate(password, hash)).toEqual(false);
  });

  it("should return true for correct password", async function () {
    const password = makeRandomPassword();
    const hash = await makeHash(password);

    expect(await authenticate(password, hash)).toEqual(true);
  });

  it("should return false for incorrect password", async function () {
    const password = makeRandomPassword();
    const hash = await makeHash(password);

    const wrongPassword = makeRandomPassword();

    expect(await authenticate(wrongPassword, hash)).toEqual(false);
  });
});

function makeRandomPassword() {
  return randomBytes(32).toString();
}

async function makeHash(password, { salt } = {}) {
  if (!salt) salt = randomBytes(8);

  const digest = await scrypt(password, salt, 32, SCRYPT_PARAMS);
  return `${salt.toString("base64url")}:${digest.toString("base64url")}`;
}
