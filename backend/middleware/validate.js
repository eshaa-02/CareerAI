const { validationResult } = require('express-validator');
const ErrorResponse = require('../utils/ErrorResponse');

// Runs after express-validator chains; collects errors into a single response
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => e.msg);
    return next(new ErrorResponse(messages.join(', '), 400));
  }
  next();
};

module.exports = validate;
