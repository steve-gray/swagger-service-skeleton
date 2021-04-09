'use strict';

const codegen = require('swagger-codegen').generateCode;
const cookieParser = require('cookie-parser');
const express  = require('express');
const connectIoc = require('connect-ioc');
const cors = require('cors');
const debug = require('debug')('swagger-service-skeleton');
const defaults = require('defaults-deep');
const Enforcer = require('openapi-enforcer');
const fiddleware = require('fiddleware');
const fs = require('fs');
const oasTools  = require('oas-tools');
const mkdirp = require('mkdirp');
const path = require('path');
const query = require('connect-query');
const templates = require('swagger-codegen').oas3_templates;
const yamljs = require('yamljs');
const swaggerErrorHandler = require('./middleware/swagger-error-handler');
const errorHandler = require('./middleware/error-handler');
const redirect = require('./middleware/redirect-handler');

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
async function startSkeletonApplication(options) {
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
        beforeController: [],
      },
      codegen: {
        controllerStubFolder: 'controllers',
        temporaryDirectory: './.temp',
        templateSet: templates,
      },
      service: {
        listenPort: 10020,
        hostName: null,
      },
      cors: {
      },
    });

  // If the swagger input is a string, then load it as a filename
  const swaggerFile = configWithDefaults.service.swagger;
  const swagger = typeof swaggerFile === 'string' ? yamljs.load(swaggerFile) : swaggerFile;

  // Create service instances
  const app = express();
  const ioc = connectIoc(configWithDefaults.ioc);

  // Generate custom application code
  generateApplicationCode(
    swagger,
    configWithDefaults.codegen
  );

  const options_object = {
    controllers: path.join(process.cwd(), configWithDefaults.codegen.temporaryDirectory, configWithDefaults.codegen.oas_controllerFolder),
    loglevel: 'debug',
    strict: false,
    router: true,
    validator: true    // DO NOT set to FALSE with express!!!!!!
  };

  // DO NOT use the following as the checks  will pass BAD openAPI files!!!!
  // oasTools.init_checks(swagger, initcheckFakeCallback);
  // const SwaggerParser =  require('@apidevtools/swagger-parser');
  return (
    Enforcer(swaggerFile, { fullResult: true })
    .then(({ error, warning }) => {
        if (!error) {
            if (warning) {
              console.warn(warning);
            } else {
              console.log('No errors with your document');
            }
        } else {
            console.error(error);
            throw new Error(error);
        }
    })
    .then( () => {
      oasTools.configure(options_object);

      oasTools.initializeMiddleware(swagger, app, (middleware) => {
        // Pre-request handling middleware
        app.use(query());                                    // Query-string parsing
        app.use(fiddleware.respondJson());                   // res.json(data, status) support.
        app.use(ioc.middleware);                             // Somersault IoC for controllers.
        app.use(cors(configWithDefaults.cors));              // Cross-origin
        app.use(cookieParser());

        // Custom middleware
        configWithDefaults.customMiddleware.beforeSwagger.forEach( (item) => app.use(item));

        // Swagger-tools middleware
        app.use(middleware.swaggerMetadata());
        //app.use(errorHandler());                              // When there's an exception (returns 500).
        app.use(middleware.swaggerValidator());
        //app.use(swaggerErrorHandler());                       // Parameter validations (returns 400).

        configWithDefaults.customMiddleware.beforeController.forEach( (item) => app.use(item));

        app.use(middleware.swaggerRouter({
          controllers: path.join(
            configWithDefaults.codegen.temporaryDirectory,
            configWithDefaults.codegen.controllerStubFolder),
        }));
        app.use(middleware.swaggerUi());

        // Post-request handling middleware
        app.use(redirect(configWithDefaults.redirects));      // Redirect / to /docs

        // Custom middleware
        configWithDefaults.customMiddleware.afterSwagger.forEach( (item) => app.use(item));

        app.use(errorHandler());                              // When there's an exception (returns 500).
        app.use(swaggerErrorHandler());                       // Parameter validations (returns 400).

        debug(`server app.listen() listenPort =  ${configWithDefaults.service.listenPort}, hostName =  ${configWithDefaults.service.hostName ? configWithDefaults.service.hostName : null} )`);
        const server = app.listen(configWithDefaults.service.listenPort, configWithDefaults.service.hostName ? configWithDefaults.service.hostName : null);
        //if (server.listening){
          app.close = function closeServer() {
            server.close();
          };
        // } else {
        //  debug(`listenPort ${configWithDefaults.service.listenPort} in use!!!`);
        //  throw new TypeError(`Express server cannot bind to port ${configWithDefaults.service.listenPort} as it is in use!!!`);
        // }
      });

      return Promise.resolve(app);
    })
    .catch( (error) => {
      console.error(error);
      return Promise.reject(error);
    })
  );
}

module.exports = startSkeletonApplication;
