# openapi-service-skeleton

[![Prod Dependencies](https://david-dm.org/acotty/openapi-service-skeleton/status.svg)](https://david-dm.org/acotty/openapi-service-skeleton)
[![Dev Dependencies](https://david-dm.org/acotty/openapi-service-skeleton/dev-status.svg)](https://david-dm.org/acotty/openapi-service-skeleton#info=devDependencies)
[![Build](https://github.com/acotty/openapi-service-skeleton/actions/workflows/node.js.yml/badge.svg)](https://github.com/acotty/openapi-service-skeleton/actions/workflows/node.js.yml)

NPM package for rapidly spinning up REST service skeletons.

NOTE: This reame.md has not been tripple checked, so please raise issues or PR's for changes/updates/clarifications.

## Status

This repository/package has been forked from [steve-gray/openapi-service-skeleton](https://github.com/steve-gray/openapi-service-skeleton)
as it was not being maintained. The automated build pipelines have not yet been put in place, and dependencies are sorely out of date. At some point this may be rectified...until then, use cautiously.

To use: follow the [instructions found here.](https://coderwall.com/p/q_gh-w/fork-and-patch-npm-moduels-hosted-on-github)

## Minimal Example

The example below shows the minimal, happy-path configuration:

    'use strict';
    const skeleton = require('openapi-service-skeleton');
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
            openapi: './contracts/your-service-api.yaml',
        }
    });
    module.exports = instance;

Calling instance() will start up a complete service on port 10010 serving your openapi-API. It expects that  controller-implementations are located in ./src/controllers relative to your application root path.

## Complete Configuration

The example below shows a complete-configuration for using the library, with typical defaults specified. The only __required__ parameters are the ones in the minimal example above.

    'use strict';
    const skeleton = require('openapi-service-skeleton');
    const yamljs = require('yamljs');

    const instance = skeleton({
        // IOC Settings - See openapi-service-skeleton on NPM for more parameters
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

        // Custom middleware to run
        customMiddleware: {
            // Middleware to run after some essentials/setup
            // but before the openapi-router.
            beforeOpenAPI: [
                (req, res, next) => {
                  /* do something */
                  next();  
                },
            ],
            // Middleware to run after openapi-router, if the
            // request does not get handled by OpenAPI middleware routes 
            // (i.e. custom error handling)
            afterOpenAPI: [
                (err, req, res, next) => {
                    /* Do something */
                    next();
                },
            ]
        },

        // Code generation 
        codegen: {
            // openapi-code-generator compliant template-set to use.
            // Defaults to require('openapi-code-generator').template
            templateSet: null,

            // Template-set specific settings, passed to template-set
            // constructor.
            templateSettings: {
                // Path to implemented controllers. This is specific
                // to your templateSet though.
                implementationPath: '../../../src/controllers',
            },

            // Where openapi-code-generator writes controller stubs to
            // Defaults to ./termp
            temporaryDirectory: './dist/codegen',

            // Path relative to temporaryDirectory where we can
            // find exegesis-express compliant controllers. Typically
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
            opeanapi: './contracts/your-service.yaml',

            // Port to listen on
            listenPort: 10010

            // Optional hostName. If the hostname is omitted or 'null', the server will accept connections 
            // on the unspecified IPv6 address (::) when IPv6 is available, 
            // or the unspecified IPv4 address (0.0.0.0) otherwise.
            // Use '127.0.0.1' instead of localhost
            hostName: 'localhost'            
             
        }
    });
    module.exports = instance;

## More Detailied Tutorial

For a more detailed tutorial please see the following GitHub repo:
    <https://github.com/fastbean-au/openapi-service-skeleton-tutorial>

## Update from previous swagger-codegen to openapi-code-generator

The following are the changes required:

- In your OpenAPI yaml file replace as follows:

|          Old Text                |                 New Text                |
|----------------------------------|-----------------------------------------|
|  'x-swagger-router-controller'   |           'x-exegesis-controller'       |
| 'x-gulp-swagger-codegen-outcome' | 'x-gulp-openapi-code-generator-outcome' |

- Upgrade your swagger yaml file to an OpenAPI yaml file (V2 to V3).

## See Also

The following projects are useful reading:

    - https://github.com/acotty/opeanapi-service-skeleton-tutorial
        - Tutorial on how to use this package.
    - openapi-code-generator
        - Code generation using handlebars templates for swagger API ontracts.
    - somersault
        - IoC for Node.js projects, with support for ES6 classes, arrow functions, static objects and regular functions.
    - connect-ioc
        - Leverages somersault to provide per-request IoC support
