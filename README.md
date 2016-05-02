# swagger-service-skeleton
NPM package for rapidly spinning up REST service skeletons. Extraordinarily
hackish at the moment.

    'use strict';
    const skeleton = require('swagger-service-skeleton');
    const yamljs = require('yamljs');

    const instance = skeleton({
      autoRegister: './services/*.js',
      controllers: '../../../src/controllers',
      cwd: __dirname,
      listenPort: 10010,
      swagger: yamljs.load('./contracts/your-api-contract.yaml'),
      tempDir: './dist/codegen'
    });

    module.exports = instance;

## Summary

  1. swagger-codegen creates code using the swagger-template-es6-server
     templateset to the ./dist/codegen directory.
  2. An instance of swagger-tools is used to provide:
        - Swaggerfile validation
        - SwaggerUI (/docs)
        - Request/Response validation
  3. Somersault is wired up as an IoC container and services under ./services
     are automatically registered using their filenames as the tag:
        - Formatting is:
            - somefile.js --> somefile
            - some-file --> someFile
            - SomeFile --> someFile
        - Handled:
            - Arrow functions
            - ES6 classes
            - Functions
            - Static objects

Controllers can reference IoC tags in their constructors or function specs,
allowing for IoC wireup of services *per-request*. Services are registered
in the root container, and a child container is created per-request allowing
for totally ephemeral objects to be created.

For more specifics on how to write controllers, see `swagger-template-es6-server'

-Steve