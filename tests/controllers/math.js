'use strict';

class MathController {
  constructor(req, res) {
    if (!req) {
      throw new Error('No req - check ioc');
    }
    if (!res) {
      throw new Error('No res - check ioc');
    }
  }

  add(x, y, responder) {
    if (x <= 0 || y <= 0) {
      throw new Error('We only tolerate positive integers in this school');
    }

    responder.success({
      x,
      y,
      operation: 'add',
      result: x + y,
    });
  }
}

module.exports = MathController;
