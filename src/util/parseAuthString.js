module.exports = function parseAuthString(authString) {
  const intValue = Number.parseInt(authString, 36);
  const id = intValue >> 20;
  const password = String(intValue & ((1 << 20) - 1));
  return { id, password };
};
