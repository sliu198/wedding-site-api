const yup = require("yup");

const {
  parseJson,
  makeJsonResponse,
  makeErrorResponse,
  validateAuthCookie,
  makeNotFoundError,
  makeInputValidationFunction,
  makeForbiddenError,
} = require("../util/http");
const { getParty, putParty } = require("../aws/dynamo-db");

module.exports = {
  handler,
};

const validate = makeInputValidationFunction(
  yup
    .object({
      id: yup.number().integer().positive().required(),
      guests: yup
        .array()
        .of(
          yup
            .object({
              name: yup.string().required(),
              isAttending: yup.boolean().nullable().default(null),
              dietaryRestrictions: yup.string().ensure(),
            })
            .noUnknown(),
        )
        .max(yup.ref("maxGuests"))
        .ensure(),
      maxGuests: yup.number().integer().positive().required(),
      shuttleOptions: yup
        .object({
          pickUpLocation: yup.string().ensure(),
          dropOffLocation: yup.string().ensure(),
        })
        .noUnknown(),
      otherAccommodations: yup.string().ensure(),
    })
    .noUnknown(),
);

async function handler(request) {
  try {
    const { sub } = validateAuthCookie(request);
    const idFromAuth = Number.parseInt(sub);

    const idFromPath = Number.parseInt(request.pathParameters.id);
    if (idFromAuth !== idFromPath) throw makeForbiddenError();

    parseJson(request);
    const updatedParty = await validate(request.body);

    const party = await getParty(idFromPath);

    if (!party) {
      throw makeNotFoundError();
    }

    if (updatedParty.id !== party.id)
      throw makeForbiddenError("cannot change id");
    if (updatedParty.maxGuests !== party.maxGuests)
      throw makeForbiddenError("cannot change maxGuests");

    // there are other properties that we don't want to overwrite/erase
    // e.g. auth info
    await putParty(updatedParty);

    return makeJsonResponse(updatedParty);
  } catch (error) {
    const { statusCode } = error;
    if (statusCode >= 400 && statusCode < 500) return makeErrorResponse(error);

    throw error;
  }
}
