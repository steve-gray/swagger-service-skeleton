# swagger-service-skeleton
NPM package for rapidly spinning up REST service skeletons. Project is currently
in early beta.

## Minimal Example
The example below shows the minimal, happy-path configuration:

    'use strict';
    const skeleton = require('swagger-service-skeleton');
    const instance = skeleton({
        ioc: {
            autoRegister: { pattern: './services/*.js', 
                            rootDirectory: __dirname },
        },
        codegen: {
            templateSettings: {
                implementationPath: '../../../src/controllers',
            },
            temporaryDirectory: './dist/codegen',
        },
        service: {
            swagger: './contracts/your-service-api.yaml',
        }
    });
    module.exports = instance;

Calling instance() will start up a complete service on port 10010 serving
your swagger-API. It expects that controller-implementations are located
in ./src/controllers relative to your application root path.

## Complete Configuration
The example below shows a complete-configuration for using the library, 
with typical defaults specified. The only __required__ parameters are
the ones in the minimal example above.

    'use strict';
    const skeleton = require('swagger-service-skeleton');
    const yamljs = require('yamljs');

    const instance = skeleton({
        // IOC Settings - See connect-ioc on NPM for more parameters
        ioc: {
            // Automatically register services with the IoC Container
            autoRegister: {
                pattern: './services/*.js',
                rootDirectory: __dirname,
            },

            // Optional base IoC container for this middleware.
            // Otherwise will default to a require('somersault')() container.
            rootContainer: null,
        },

        // Code generation 
        codegen: {
            // swagger-codegen compliant template-set to use.
            // Defaults to require('swagger-template-es6-server')
            templateSet: null,

            // Template-set specific settings, passed to template-set
            // constructor.
            templateSettings: {
                // Path to implemented controllers. This is specific
                // to your templateSet though.
                implementationPath: '../../../src/controllers',
            },

            // Where swagger-codegen writes controller stubs to
            // Defaults to ./termp
            temporaryDirectory: './dist/codegen',

            // Path relative to temporaryDirectory where we can
            // find swagger-tools compliant controllers. Typically
            // this is 'controllers' or similar.
            controllerStubFolder: 'controllers'
        },

        // Redirection rules, executed before requests in lexicographic
        // order.
        redirects: {
            // Label
            'documentation-from-root': {
                // Regex to match for req.url
                match: /^\/$/,
                
                // Destination path
                target: '/docs',
            },
        },

        // Service 
        service: {
            // Your service contract. Can be a .yaml file name
            // or a pre-parsed file. Will load text from file
            // using require('yamljs')
            swagger: './contracts/your-service.yaml',

            // Port to listen on
            listenPort: 10010
        }
    });
    module.exports = instance;

## See Also
The following projects are useful reading:

    - swagger-codegen
        - Code generation using handlebars templates for swagger
          API contracts.
    - gulp-swagger-codgen
        - Leverages swagger-codegen and templatesets to produce
          code output. This module does the same, but on the fly
          when starting up to a temporary directory.
    - somersault
        - IoC for Node.js projects, with support for ES6 classes,
          arrow functions, static objects and regular functions.
    - connect-ioc
        - Leverages somersault to provide per-request IoC support.

