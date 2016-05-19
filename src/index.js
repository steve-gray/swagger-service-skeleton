'use strict';

const codegen = require('swagger-codegen');
const connect = require('connect');
const connectIoc = require('connect-ioc');
const cors = require('cors');
const debug = require('debug')('swagger-service-skeleton');
const defaults = require('defaults-deep');
const fiddleware = require('fiddleware');
const fs = require('fs');
const initializeSwagger = require('swagger-tools').initializeMiddleware;
const mkdirp = require('mkdirp');
const path = require('path');
const query = require('connect-query');
const errorHandler = require('./middleware/error-handler');
const redirect = require('./middleware/redirect-handler');
const templates = require('swagger-template-es6-server');
const yamljs = require('yamljs');

/**
 * Generate the application code in the specified temporary directory.
 */
function generateApplicationCode(swagger, codegenOptions) {
  debug('Generating application code.');

  // Build up the execution parameters for the templates.
  const templateFunc = codegenOptions.templateSet;
  const outputDirectory = codegenOptions.temporaryDirectory;
  const codegenSettings = defaults(
    templateFunc(codegenOptions.templateSettings),
    {
      output: (name, content) => {
        const fullName = path.join(outputDirectory, name);
        const parsed = path.parse(fullName);
        mkdirp.sync(parsed.dir);
        fs.writeFileSync(fullName, content);
      },
      swagger: JSON.parse(JSON.stringify(swagger)), // Clone to avoid issues
    });

  // Perform the actual code generation
  codegen(codegenSettings);
}

/**
 * Initialize the application skeleton
 */
function startSkeletonApplication(options) {
  debug('Starting to create application skeleton');
  const configWithDefaults = defaults(
    options, {
      redirects: {
        'documentation-from-root': {
          match: /^\/$/,
          target: '/docs',
        },
      },
      ioc: {
      },
      customMiddleware: {
        beforeSwagger: [],
        afterSwagger: [],
      },
      codegen: {
        controllerStubFolder: 'controllers',
        temporaryDirectory: './.temp',
        templateSet: templates,
      },
      service: {
        listenPort: 10010,
      },
      cors: {        
      },
    });

  // If the swagger input is a string, then load it as a filename
  const swaggerFile = configWithDefaults.service.swagger;
  const swagger = typeof swaggerFile === 'string' ?
    yamljs.load(swaggerFile) : swaggerFile;

  // Create service instances
  const app = connect();
  const ioc = connectIoc(configWithDefaults.ioc);

  // Generate custom application code
  generateApplicationCode(
    swagger,
    configWithDefaults.codegen);

  initializeSwagger(swagger, (middleware) => {
    // Pre-request handling middleware
    app.use(query());                                    // Query-string parsing
    app.use(fiddleware.respondJson());                   // res.json(data, status) support.
    app.use(ioc.middleware);                             // Somersault IoC for controllers.
    app.use(cors(configWithDefaults.cors));              // Cross-origin

    // Custom middleware
    for (const item of configWithDefaults.customMiddleware.beforeSwagger) {
      app.use(item);
    }

    // Swagger-tools middleware
    app.use(middleware.swaggerMetadata());
    app.use(middleware.swaggerValidator());
    app.use(middleware.swaggerRouter({
      controllers: path.join(
        configWithDefaults.codegen.temporaryDirectory,
        configWithDefaults.codegen.controllerStubFolder),
    }));
    app.use(middleware.swaggerUi());

    // Post-request handling middleware
    app.use(redirect(configWithDefaults.redirects));      // Redirect / to /docs

    // Custom middleware
    for (const item of configWithDefaults.customMiddleware.afterSwagger) {
      app.use(item);
    }

    app.use(errorHandler());                              // When there's an exception.

    const server = app.listen(configWithDefaults.service.listenPort);
    app.close = function closeServer() {
      server.close();
    };
  });

  return app;
}

module.exports = startSkeletonApplication;
