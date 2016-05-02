'use strict';

const approot = require('app-root-path');
const codegen = require('swagger-codegen');
const connect = require('connect');
const defaults = require('defaults-deep');
const fiddleware = require('fiddleware');
const fs = require('fs');
const glob = require('glob');
const initializeSwagger = require('swagger-tools').initializeMiddleware;
const ioc = require('somersault');
const mkdirp = require('mkdirp');
const path = require('path');
const query = require('connect-query');
const temp = require('temp').track();
const templates = require('swagger-template-es6-server');

function startSkeletonApplication(options) {
  const app = connect();
  const rootContainer = ioc.createContainer();

  // Process service registrations
  if (options.autoRegister) {
    glob(options.autoRegister, {
        cwd: options.cwd,
        nomount: true,
      }, (er, files) => {
        for (const moduleName of files) {
          const qualifiedPath = path.join(options.cwd, moduleName);
          const loaded = require(qualifiedPath);
          if (loaded.tags) {
            rootContainer.register(loaded.tags, loaded);
          } else {
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
            rootContainer.register(normalized, loaded);
          }
        }
      });
  }

  const outputDirectory = options.tempDir;

  const codegenSettings = defaults(templates({
    implementationPath: options.controllers,
  }), {
    output: (name, content) => {
      const fullName = path.join(outputDirectory, name);
      const parsed = path.parse(fullName);
      mkdirp.sync(parsed.dir);
      fs.writeFileSync(fullName, content);
    },
    swagger: JSON.parse(JSON.stringify(options.swagger)), // Clone to avoid issues
  });

  codegen(codegenSettings);

  initializeSwagger(options.swagger, (middleware) => {
    // Common middleware
    app.use(query());
    app.use(fiddleware.respondJson());
    app.use(middleware.swaggerMetadata());
    app.use(middleware.swaggerValidator());

    // Register the ioc 'resolver' function on the request.
    // This is used by the generated controllers to handle
    // dependency injection.
    app.use((req, res, next) => {
      const requestContainer = rootContainer.createChild();
      requestContainer.register(['req', 'request'], req);
      requestContainer.register(['res', 'response'], res);
      req.resolver = (x) => requestContainer.build(x);
      next();
    });

    // Load the generated controllers and start serving the routes
    app.use(middleware.swaggerRouter({
      controllers: path.join(outputDirectory, 'controllers'),
    }));

    // Run the swagger UI
    app.use(middleware.swaggerUi());

    /* istanbul ignore next - Don't bother covering this code */
    app.use((error, req, res, next) => {
      res.json({
        message: error,
      }, 500);
      next();
    });

    const server = app.listen(options.listenPort);
    app.close = function closeServer() {
      server.close();
      temp.cleanupSync();
    };
  });
}

module.exports = startSkeletonApplication;
