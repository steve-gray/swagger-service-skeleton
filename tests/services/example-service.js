'use strict';

class ExampleService {
  constructor(req, res) {
    if (req === null) {
      throw new Error('No req!');
    }
    if (res === null) {
      throw new Error('No res!');
    }
    this.built = true;
  }
}

module.exports = ExampleService;
