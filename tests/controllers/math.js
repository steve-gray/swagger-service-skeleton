'use strict';

class MathController {

  // eslint-disable-next-line no-unused-vars
  add(x, y, responder, context) {
    if (x === 0 && y === 0) {
      return responder.error({
        errorCode: 500,
        errorId: 19,
        message: 'Error',
      });
    }

    if (x <= 0 && y >= 0) {
      //throw new Error('We only tolerate positive integers in this school');

      return responder.badRequestError();
    }

    if (x <= 0 && y <= 0) {
      if (x === -1 && y === -1) {
        throw new Error('We only tolerate positive integers in this school');
      }

      return responder.badInputError({
        errorCode: 405,
        errorId: 18,
        message: 'We only tolerate both positive integers in this school',
      });
    }

    return responder.success({
      x,
      y,
      operation: 'add',
      result: x + y,
    });
  }

  // eslint-disable-next-line no-unused-vars
  addProtected(x, y, responder, context) {
    return this.add(x, y, responder);
  }

}

module.exports = MathController;
