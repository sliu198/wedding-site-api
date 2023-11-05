const _ = require("lodash");

const DIGITS = _.range(0x30, 0x3a).map((c) => String.fromCharCode(c));
const UPPER = _.range(0x41, 0x5b).map((c) => String.fromCharCode(c));
const LOWER = _.range(0x61, 0x7b).map((c) => String.fromCharCode(c));

module.exports = function (
  length = 12,
  { upper = true, lower = true, digits = true, other = "" } = {},
) {
  const charSet = [];
  if (digits) charSet.push(...DIGITS);
  if (upper) charSet.push(...UPPER);
  if (lower) charSet.push(...LOWER);
  charSet.push(...other);

  return _.range(length)
    .map(() => _.sample(charSet))
    .join("");
};
