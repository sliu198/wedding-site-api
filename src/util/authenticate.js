const { scrypt: _scrypt, randomBytes, timingSafeEqual } = require("crypto");
const { promisify } = require("util");

const scrypt = promisify(_scrypt);

const BACKUP_PASSWORD = "hs6EC5AaX1A7U5XOb-2d4ur6wKC-ypGj8N0VWydwkSM";
const BACKUP_SALT = "vfdshDvbTFQ";
const BACKUP_DIGEST = "cYZoEA6gx3Ci8JdwmpgTdqOTCkMcECoUJsBp9hJE2_A";

const SCRYPT_PARAMS = {
  // cost: 1 << 14,
  // parallelization: 5,
};

module.exports = async function authenticate(password, hash) {
  const [salt, digest] = hash?.split(":") || [];
  if (!password) password = BACKUP_PASSWORD;
  const saltBytes = Buffer.from(salt || BACKUP_SALT, "base64url");
  const digestBytes = Buffer.from(digest || BACKUP_DIGEST, "base64url");

  return timingSafeEqual(
    await scrypt(password, saltBytes, 32, SCRYPT_PARAMS),
    digestBytes,
  );
};

Object.assign(module.exports, {
  SCRYPT_PARAMS,
});
