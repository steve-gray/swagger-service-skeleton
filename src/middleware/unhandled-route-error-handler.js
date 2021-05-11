'use strict';

const debug = require('debug')('openapi-service-skeleton:openapi-error-handler');

module.exports = () =>
  (error, req, res) => {
    let msg;
    if(error.message) {
      msg = error.message;
    } else {
      msg = `ERROR URL ${error.originalUrl} does not exist.`;
    }

    debug(`ERROR URL ${error.originalUrl} does not exist.`);
    res.status(500)
      .json({
        message: msg,
        stack: error.stack,
        error
      });
  };
