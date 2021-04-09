'use strict';

const debug = require('debug')('swagger-service-skeleton:error-handler');

module.exports = () =>
  (error, req, res) => {
    debug('ERROR Occurred: %s', error);
    res.status(500).json({
      message: error.toString(),
      stack: error.stack,
    });
  };
