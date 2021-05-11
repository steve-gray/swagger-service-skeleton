'use strict';

const codegen = require('openapi-code-generator').generateCode;
const cookieParser = require('cookie-parser');
const express  = require('express');
const connectIoc = require('connect-ioc');
const cors = require('cors');
const debug = require('debug')('openapi-service-skeleton');
const defaults = require('defaults-deep');
const Enforcer = require('openapi-enforcer');
const fiddleware = require('fiddleware');
const fs = require('fs');
const mkdirp = require('mkdirp');
const path = require('path');
const query = require('connect-query');
const templates = require('openapi-code-generator').oas3_templates;
const yamljs = require('yamljs');
// https://github.com/exegesis-js/exegesis-express
const exegesisExpress   = require('exegesis-express');
const exegesisSwaggerUIPlugin = require('exegesis-plugin-swagger-ui-express');
const unhandledRouteErrorHandler = require('./middleware/unhandled-route-error-handler');
const redirect = require('./middleware/redirect-handler');

/**
 * Generate the application code in the specified temporary directory.
 */
function generateApplicationCode(openapi, codegenOptions) {
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
      openapi: JSON.parse(JSON.stringify(openapi)), // Clone to avoid issues
    });

  // Perform the actual code generation
  codegen(codegenSettings);
}

/**
 * Initialize the application skeleton
 */
async function startSkeletonApplication(options) {
  debug('Starting to create application skeleton');

  let configWithDefaults = defaults(
    options,
    {
      redirects: {
        'documentation-from-root': {
          match: /^\/$/,
          target: '/API_docs',
        },
      },
      ioc: {
      },
      customMiddleware: {
        beforeOpenAPI: [],
        afterOpenAPI: [],
        processMissingRoute: [],
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
    }
  );
  // If the openapiFile input is a string, then load it as a filename
  const openapiFile = configWithDefaults.service.openapi;
  const openapi = typeof openapiFile === 'string' ? yamljs.load(openapiFile) : openapiFile;

  // Create service instances
  const app = express();
  const ioc = connectIoc(configWithDefaults.ioc);

  // Generate custom application code
  generateApplicationCode(
    openapi,
    configWithDefaults.codegen
  );

  // DO NOT use the following as the checks  will pass BAD openAPI files!!!!
  // BAD: oasTools.init_checks(swagger, initcheckFakeCallback);
  // BAD: const SwaggerParser =  require('@apidevtools/swagger-parser');
  return Enforcer(openapiFile, { fullResult: true })
    .then(({ error, warning }) => {
        if (!error) {
            if (warning) {
              // eslint-disable-next-line no-console
              console.warn(warning);
            } else {
              // eslint-disable-next-line no-console
              debug('No errors with your document');
            }
        } else {
            // eslint-disable-next-line no-console
            console.error(error);
            throw new Error(error);
        }
    })
    .then( async () => {
      //  ====================================================================================

      // Pre-request handling middleware
      app.use(query());                                 // Query-string parsing
      app.use(fiddleware.respondJson());                   // res.json(data, status) support.
      app.use(ioc.middleware);                             // Somersault IoC for controllers.
      app.use(cors(configWithDefaults.cors));              // Cross-origin
      app.use(cookieParser());

      //  ====================================================================================

      // Custom middleware
      configWithDefaults.customMiddleware.beforeOpenAPI.forEach( (item) => app.use(item));

      //  ====================================================================================

      const controllerPath = path.join(process.cwd(), configWithDefaults.codegen.temporaryDirectory, configWithDefaults.codegen.oas_controllerFolder);
      let configExegesisWithDefaultsOptions = defaults(
        configWithDefaults.exegesisOptions,
        {
          // See https://github.com/exegesis-js/exegesis/blob/master/docs/Options.md
          allowMissingControllers: false,
          controllersPattern: "**/*.@(ts|js)",
          controllers: controllerPath,
          authenticators: {
          },
          plugins: [
            exegesisSwaggerUIPlugin({
                // Express app (required)
                app,

                // URL path to expose API docs (default /)
                path: '/API_docs',

                // Options to pass to Swagger UI
                swaggerUIOptions: {
                   explorer: true
                }
            })
          ]
        }
      );
      const exegesisMiddleware = await exegesisExpress.middleware( openapiFile, configExegesisWithDefaultsOptions);
      app.use(exegesisMiddleware);

      //  ====================================================================================

      // Custom middleware
      configWithDefaults.customMiddleware.afterOpenAPI.forEach( (item) => app.use(item));

      // Post-request handling middleware
      app.use(redirect(configWithDefaults.redirects));      // Redirect / to /docs

      //  ====================================================================================

      // Custom missing route procesing
      if (configWithDefaults.customMiddleware.processMissingRoute.length > 0) {
      configWithDefaults.customMiddleware.processMissingRoute.forEach( (item) => app.use(item));
      } else {
        app.use((req, res) => {
          res.status(404).json({message: `Route Not found`});
      });
      }

      // Handle any unexpected errors
      app.use(unhandledRouteErrorHandler());   // Route does not exit error handler

      //  ====================================================================================

      debug(`server app.listen() listenPort =  ${configWithDefaults.service.listenPort}, hostName =  ${configWithDefaults.service.hostName ? configWithDefaults.service.hostName : null} )`);
      const server = app.listen(configWithDefaults.service.listenPort, configWithDefaults.service.hostName ? configWithDefaults.service.hostName : null, () => {
        debug(`server ready`);
      });
      // if (!server.listening){
      //  debug(`listenPort ${configWithDefaults.service.listenPort} in use!!!`);
      //  throw new TypeError(`Express server cannot bind to port ${configWithDefaults.service.listenPort} as it is in use!!!`);
      // }
      app.close = function closeServer() {
        server.close();
      };

      let timeoutId;
      let intervalId;
      return new Promise((resolve, reject) => {
          // Wait up to 1000 ms for express to startup correctly!!!!
        timeoutId = setTimeout(() => {
          clearInterval(intervalId);
          reject(new Error("Server did not startup within timeout period."));
        }, 10000);

        intervalId = setInterval( () => {
          if (server.listening) {
            clearTimeout(timeoutId);
            clearInterval(intervalId);
            resolve(app);
          }
        }, 50);
      });
    })
    .catch( (error) => {
      // eslint-disable-next-line no-console
      console.error(error);
      throw new Error(error);
    });
  // );
}

module.exports = startSkeletonApplication;
