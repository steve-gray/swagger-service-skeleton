'use strict';

const debug = require('debug')('openapi-service-skeleton:redirect-handler');

module.exports = (redirectMap) =>
  (req, res, next) => {
    let matched = false;
    debug('Checking for redirections for this request: %s', req.url);

    for (const key of Object.keys(redirectMap)) {
      const rule = redirectMap[key];
      if (rule.match.test(req.url)) {
        debug('   Rule: %s matched (%s)', key, rule.match);
        const destination = req.url.replace(rule.match, rule.target);

        // Write the redirect and terminate
        debug('      Redirecting to: %s', destination);
        res.writeHead(rule.status || 301, {
          Location: destination,
        });
        res.end();

        // Skip further rules
        matched = true;
        break;
      }
    }

    // Only if not matched
    if (!matched) {
      next();
    }
  };
