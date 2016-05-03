'use strict';

const debug = require('debug')('swagger-service-skeleton:ioc');
const glob = require('glob');
const path = require('path');
const somersault = require('somersault');

/**
 * Perform automatic registration of service instances by dynamically loading
 * the required node modules from the specified locations.
 *
 * @param {object} container          - Somersault IoC Container
 * @param {object} settings           - Settings object (.rootDirectory, .pattern)
 */
function autoRegister(container, settings) {
  debug('Starting to register %s in %s', settings.pattern, settings.rootDirectory);
  glob(settings.pattern, {
      cwd: settings.rootDirectory,
      nomount: true,
    }, (er, files) => {
      for (const moduleName of files) {
        debug('  Processing globbed file: %s', moduleName);

        const qualifiedPath = path.join(settings.rootDirectory, moduleName);
        const loaded = require(qualifiedPath);
        if (loaded.tags) {
          debug('  Registering custom tags: %s', JSON.stringify(loaded.tags));
          container.register(loaded.tags, loaded);
        } else {
          debug('  Formatting based on file-name');

          const baseName = path.basename(moduleName);
          const parsed = path.parse(moduleName);
          const segments = parsed.name.split('-');
          for (const index in segments) {
            if (index == 0) {
              segments[index] = segments[index].toLowerCase();
            } else {
              segments[index] =
                segments[index].charAt(0).toUpperCase()
                +
                segments[index].slice(1);
            }
          }

          const normalized = segments.join('');
          debug('    Registering with normalized name: %s', normalized);
          container.register(normalized, loaded);
        }
      }
    });
}

/**
 * Middleware for performing IoC integration with a Connect/Express request. Uses somersault to create a root
 * container, if no root is specified.
 *
 * @return          Connect/Express middleware instance
 */
module.exports = (iocOptions) => {
  /* istanbul ignore else */
  const options = iocOptions || {};

  // Create a root container
  const rootContainer = options.rootContainer || somersault();

  // Create the middleware function
  const middleware = (req, res, next) => {
    debug('Request .resolver wireup starting');

    const requestContainer = rootContainer.createChild();
    requestContainer.register(['req', 'request'], req);
    requestContainer.register(['res', 'response'], res);

    req.resolver = (x) => {
      debug('Resolving request for %s', typeof x);
      return requestContainer.build(x);
    }
    next();
  };

  // Process service registrations
  if (options.autoRegister) {
    autoRegister(rootContainer, options.autoRegister);
  }

  return {
    rootContainer,
    middleware,
  };
};
