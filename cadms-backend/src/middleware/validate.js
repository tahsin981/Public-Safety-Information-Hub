const HttpError = require("../utils/httpError");

function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query
    });
    if (!result.success) {
      return next(new HttpError(400, "Validation failed.", result.error.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message
      })));
    }
    req.validated = result.data;
    next();
  };
}
module.exports = validate;
