'use strict';

const debug = require('debug')('swagger-service-skeleton:swagger-error-handler');

module.exports = () =>
  (error, req, res, next) => {
    if (error.failedValidation) {
      res.json(
        Object.prototype.hasOwnProperty.call(error, 'results') ?
          {
            message: error.message,
            errors: error.results.errors,
            warnings: error.results.warnings,
          } :
          {
            message: error.message,
            errors: [{ code: error.code, message: error.message, path: error.path }],
            warnings: [],
          }
        , 400);
    }
    else {
      debug('ERROR Occurred: %s', error);
      next();
    }
  };
  