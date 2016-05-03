'use strict';

const debug = require('debug')('swagger-service-skeleton:error-handler');

module.exports = () =>
  (error, req, res, next) => {
    debug('ERROR Occured: %s', error);
    res.json({
      message: error.toString(),
      stack: error.stack,
    }, 500);
    next();
  };
