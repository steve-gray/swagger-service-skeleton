'use strict';

const somersault = require('somersault');

module.exports = () => {
  const rootContainer = somersault();
  const middleware = (req, res, next) => {
    const requestContainer = rootContainer.createChild();
    requestContainer.register(['req', 'request'], req);
    requestContainer.register(['res', 'response'], res);
    req.resolver = (x) => requestContainer.build(x);
    next();
  };

  return {
    rootContainer,
    middleware,
  };
};
