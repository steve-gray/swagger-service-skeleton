'use strict';

const approot = require('app-root-path');
const codegen = require('swagger-codegen');
const connect = require('connect');
const defaults = require('defaults-deep');
const fiddleware = require('fiddleware');
const fs = require('fs');
const glob = require('glob');
const initializeSwagger = require('swagger-tools').initializeMiddleware;
const iocMiddleware = require('./middleware/ioc');
const mkdirp = require('mkdirp');
const path = require('path');
const query = require('connect-query');
const temp = require('temp').track();
const templates = require('swagger-template-es6-server');
const yamljs = require('yamljs');

function startSkeletonApplication(options) {
  const app = connect();
  const ioc = iocMiddleware();

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
            ioc.rootContainer.register(loaded.tags, loaded);
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
            ioc.rootContainer.register(normalized, loaded);
          }
        }
      });
  }

  // If the swagger input is a string, then load it as a filename
  const swagger = typeof options.swagger === 'string' ?
    yamljs.load(options.swagger) : options.swagger;

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
    swagger: JSON.parse(JSON.stringify(swagger)), // Clone to avoid issues
  });

  codegen(codegenSettings);

  initializeSwagger(swagger, (middleware) => {
    app.use(query());
    app.use(ioc.middleware);

    // Swagger-tools middleware
    app.use(fiddleware.respondJson());
    app.use(middleware.swaggerMetadata());
    app.use(middleware.swaggerValidator());
    app.use(middleware.swaggerRouter({
      controllers: path.join(outputDirectory, 'controllers'),
    }));
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
