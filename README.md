# swagger-service-skeleton

[![Build Status](https://travis-ci.org/steve-gray/swagger-service-skeleton.svg?branch=master)](https://travis-ci.org/steve-gray/swagger-service-skeleton)
[![Prod Dependencies](https://david-dm.org/steve-gray/swagger-service-skeleton/status.svg)](https://david-dm.org/steve-gray/swagger-service-skeleton)
[![Dev Dependencies](https://david-dm.org/steve-gray/swagger-service-skeleton/dev-status.svg)](https://david-dm.org/steve-gray/swagger-service-skeleton#info=devDependencies)
[![Coverage Status](https://coveralls.io/repos/github/steve-gray/swagger-service-skeleton/badge.svg?branch=master)](https://coveralls.io/github/steve-gray/swagger-service-skeleton?branch=master)
[![npm version](https://badge.fury.io/js/swagger-service-skeleton.svg)](https://badge.fury.io/js/swagger-service-skeleton)

![Stats]( https://nodei.co/npm/swagger-service-skeleton.png?downloads=true&downloadRank=true&stars=true)
![Downloads](https://nodei.co/npm-dl/swagger-service-skeleton.png?height=2)

NPM package for rapidly spinning up REST service skeletons. 

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
        // IOC Settings - See swagger-service-skeleton on NPM for more parameters
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
            // but before the swagger-router.
            beforeSwagger: [
                (req, res, next) => {
                  /* do something */
                  next();  
                },
            ],
            // Middleware to run after filtering, but immediately before the controller
            beforeController: [
                (err, req, res, next) => {
                    /* Do something */
                    next();
                },
            ],
            // Middleware to run after swagger-router, if the
            // request does not get handled by swagger (i.e.
            // custom error handling)
            afterSwagger: [
                (err, req, res, next) => {
                    /* Do something */
                    next();
                },
            ]
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

            // Optional hostName. If the hostname is omitted or 'null', the server will accept connections 
            // on the unspecified IPv6 address (::) when IPv6 is available, 
            // or the unspecified IPv4 address (0.0.0.0) otherwise.
            hostName: 'localhost'            
             
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

