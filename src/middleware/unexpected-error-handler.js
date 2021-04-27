'use strict';

const debug = require('debug')('swagger-service-skeleton:swagger-error-handler');
const  Readable = require('stream');

function stringToStream(str, encoding) {
  if (encoding === undefined) {
    encoding = 'utf-8';
  }
  return new Readable({
      read() {
          this.push(str, encoding);
          this.push(null);
      },
  });
}

module.exports = () =>
  (error, req, res, next) => {
    debug('ERROR Occurred: %s', error);
    res.status(500).json({
      message: error.message,
      stack: error.stack,
    });
  };
