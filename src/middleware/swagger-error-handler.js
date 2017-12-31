'use strict';

const debug = require('debug')('swagger-service-skeleton:swagger-error-handler');

module.exports = () =>
  (error, req, res, next) => {
    if (error.failedValidation) {
      res.json({
        message: `Parameter (${error.paramName}) validation failed`,
        errors: error.results.errors,
        warnings: error.results.warnings,
      }, 400);
    }
    else {
      debug('ERROR Occurred: %s', error);
      next();
    }
  };
  