const yup = require("yup");

const trimmedString = yup.string().transform(trimIfString);
const trimmedEmail = trimmedString.email();

module.exports = {
  trimmedEmail,
  trimmedString,
};

function trimIfString(currentValue) {
  if (this.isType(currentValue)) return currentValue.trim();

  return currentValue;
}
