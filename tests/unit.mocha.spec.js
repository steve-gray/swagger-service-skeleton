'use strict';

// process.env.NODE_ENV = 'development';
// process.env.DEBUG='*';
// process.env.DEBUG='express:application';
// process.env.DEBUG='*,express:*,swagger-service-skeleton:*';

const {expect} = require('chai');
const glob = require('glob');
const request = require('supertest');
// const asDump = require('./async-dump');
const skeleton = require('../src');

describe('Unit Tests', () => {

  //after(() => {
  //  asDump.asyncDump();
  //});

  describe('Standard Cases', () => {
    let instance = null;
    let preCount = 0;
    let postCount = 0;

    before( async () => {
      return new Promise((resolve, reject) => {
        const swaggerFileName = glob.sync('./tests/contracts/**/*oas3.yaml', {})[0];

        instance = skeleton({
          ioc: {
            autoRegister: { pattern: './services/**/*.js', rootDirectory: __dirname },
          },
          codegen: {
            templateSettings: {
              implementationPath: '../../controllers',
            },
            temporaryDirectory: './tests/.temp',
            oas_controllerFolder: './controllers',    // Relative to the temporaryDirectory
          },
          customMiddleware: {
            beforeSwagger: [
              (req, res, next) => {
                preCount += 1;
                next();
              },
            ],
            afterSwagger: [
              (req, res, next) => {
                postCount +=1;
                next();
              },
            ],
          },
          service: {
            swagger: swaggerFileName,
            listenPort: 0,
            hostName: "localhost",
          },
          exegesisOptions: {
            authenticators: {
              // Both not used in OpenAPI, but can be enabled for testing...
              // sessionKey: sessionAuthenticator,
              // addBasicAuth() {
              //   return [];
              // },
              addOauth2() {
                return { type: 'success', user: 'benbria', scopes: ['readOnly'] };
              },
            },
          }
        })
        .then( (app) => {
          instance = app;
          resolve();
        })
        .catch( (error) => {
          // throw new Error(error);
          return reject(error);
        });
      });
    });

    beforeEach( () => {
        preCount = 0;
        postCount = 0;
        return Promise.resolve();
      });

    after( () => {
      instance.close();
      return Promise.resolve();
    });

    it('Should handle requests', () => {
      // Start up, shut down
      return Promise.resolve();
    });

    it('Should be able to add', () => {
      return request(instance)
        .get('/add/4/5')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200, {
          x: 4,
          y: 5,
          operation: 'add',
          result: 9,
          }
        );
    });

    it('Should run customMiddleware.beforeSwagger on match', () =>
      request(instance)
        .get('/add/4/5')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200, {
          x: 4,
          y: 5,
          operation: 'add',
          result: 9,
        })
        .then(() => {
          expect(preCount).to.be.eql(1, 'Pre Middleware hits');
          expect(postCount).to.be.eql(0, 'Post Middleware hits');
        })
    );

    it('Should run customMiddleware.afterSwagger too on error', () =>
      request(instance)
        .get('/does-not-exist/4/5')
        .expect(404)
        .then((res) => {
          expect(res.body.message).to.be.eql('Route Not found');
          expect(preCount).to.be.eql(1, 'Pre Middleware hits');
          expect(postCount).to.be.eql(1, 'Post Middleware hits');
        })
    );

    it('Should redirect by default from /', () =>
      request(instance)
        .get('/')
        .expect(301)
        .then(() => {
          expect(preCount).to.be.eql(1, 'Pre Middleware hits');
          expect(postCount).to.be.eql(1, 'Post Middleware hits');
          return Promise.resolve();
        })
    );

    it('Should 404 for bad URL by default', () =>
      request(instance)
        .get('/foobar')
        .expect(404)
        .then((res) => {
          expect(res.body.message).to.be.eql('Route Not found');
        })
    );

    it('Should 400 when passed in bad parameters from controller', () =>
      request(instance)
        .get('/add/-1/4')
        .expect(400)
    );

    it('Should 405 when passed in bad parameters from controller', () =>
      request(instance)
        .get('/add/-2/-2')
        .expect(405)
    );

    it('Should 500 when passed in bad parameters from controller', () =>
      request(instance)
        .get('/add/0/0')
        .expect(500)
    );

    it('Should 500 due to exception being thrown in the controller', () =>
      request(instance)
        .get('/add/-1/-1')
        .expect(500)
    );
  });

  describe('Standard Cases 127.0.0.1 handling', () => {
    let instance = null;
    let preCount = 0;
    let postCount = 0;

    before(() => {
      return new Promise((resolve, reject) => {
        preCount = 0;
        postCount = 0;
        const swaggerFileName = glob.sync('./tests/contracts/**/*oas3.yaml', {})[0];

        instance = skeleton({
          ioc: {
            autoRegister: { pattern: './services/**/*.js', rootDirectory: __dirname },
          },
          codegen: {
            templateSettings: {
              implementationPath: '../../controllers',
            },
            temporaryDirectory: './tests/.temp',
            oas_controllerFolder: './controllers',    // Relative to the temporaryDirectory
          },
          customMiddleware: {
            beforeSwagger: [
              (req, res, next) => {
                preCount += 1;
                next();
              },
            ],
            afterSwagger: [
              (req, res, next) => {
                postCount += 1;
                next();
              },
            ],
          },
          service: {
            swagger: swaggerFileName,
            listenPort: 0,
            hostName: "127.0.0.1",
          },
          exegesisOptions: {
            authenticators: {
              // Both not used in OpenAPI, but can be enabled for testing...
              // sessionKey: sessionAuthenticator,
              // addBasicAuth() {
              //   return [];
              // },
              addOauth2() {
                return { type: 'success', user: 'benbria', scopes: ['readOnly'] };
              },
            },
          }
        })
        .then( (app) => {
          instance = app;
          resolve();
        })
        .catch( (err) => {
          reject(err);
        });
      });
    });

    beforeEach( () => {
      preCount = 0;
      postCount = 0;
      return Promise.resolve();
    });

    after(() => {
      instance.close();
    });

    it('Should handle requests', () => {
      // Start up, shut down
    });

    it('Should be able to add', () =>
      request(instance)
        .get('/add/4/5')
        .expect(200, {
          x: 4,
          y: 5,
          operation: 'add',
          result: 9,
        }));

    it('Should run customMiddleware.beforeSwagger on match', () => {
      request(instance)
        .get('/add/4/5')
        .expect(200, {
          x: 4,
          y: 5,
          operation: 'add',
          result: 9,
        })
        .then(() => {
          expect(preCount).to.be.eql(1, 'Pre Middleware hits');
          expect(postCount).to.be.eql(1, 'Post Middleware hits');
        });
    });

    it('Should run customMiddleware.afterSwagger too on error', () =>
      request(instance)
        .get('/does-not-exist/4/5')
        .expect(404)
        .then((res) => {
          expect(res.body.message).to.be.eql('Route Not found');
          expect(preCount).to.be.eql(1, 'Pre Middleware hits');
          expect(postCount).to.be.eql(1, 'Post Middleware hits');
        }));

    it('Should redirect by default from /', () =>
      request(instance)
        .get('/')
        .expect(301)
    );

    it('Should 404 for bad URL by default', () =>
      request(instance)
        .get('/foobar')
        .expect(404)
        .then((res) => {
          expect(res.body.message).to.be.eql('Route Not found');
        })
    );

    it('Should 400 when passed in bad parameters from controller', () =>
      request(instance)
        .get('/add/-1/4')
        .expect(400)
    );

    it('Should 405 when passed in bad parameters from controller', () =>
      request(instance)
        .get('/add/-2/-2')
        .expect(405)
    );

    it('Should 500 when passed in bad parameters from controller', () =>
      request(instance)
        .get('/add/0/0')
        .expect(500)
    );

    it('Should 500 due to exception being thrown in the controller', () =>
      request(instance)
        .get('/add/-1/-1')
        .expect(500)
    );

  });

  describe('Special input handling', () => {
    describe('service.swagger = object', () => {
      let instance = null;
      const swaggerFileName = glob.sync('./tests/contracts/**/*oas3.yaml', {})[0];

      // eslint-disable-next-line no-unused-vars
      // async function sessionAuthenticator(pluginContext, info) {
      //   const session = pluginContext.req.headers.session;
      //   if (!session) {
      //     return { type: 'missing', statusCode: 401, message: 'Session key required' };
      //   } else if (session === 'secret') {
      //     return { type: 'success', user: { name: 'jwalton', roles: ['read', 'write'] } };
      //   }

      //   // Session was supplied, but it's invalid.
      //   return { type: 'invalid', statusCode: 401, message: 'Invalid session key' };
      // }

      before(() => {
        return new Promise((resolve, reject) => {
          instance = skeleton({
            ioc: {
              autoRegister: { pattern: './services/**/*.js', rootDirectory: __dirname },
            },
            codegen: {
              templateSettings: {
                implementationPath: '../../controllers',
              },
              temporaryDirectory: './tests/.temp',
              oas_controllerFolder: './controllers',    // Relative to the temporaryDirectory
            },
            service: {
              swagger: swaggerFileName,
              listenPort: 0,
              hostName: "localhost",
            },
            exegesisOptions: {
              allowMissingControllers: false,
              controllersPattern: "**/*.@(ts|js)",
              authenticators: {
                // Both not used in OpenAPI, but can be enabled for testing...
                // sessionKey: sessionAuthenticator,
                // addBasicAuth() {
                //   return [];
                // },
                addOauth2() {
                  return { type: 'success', user: 'benbria', scopes: ['readOnly'] };
                },
              },
            }
          })
          .then( (app) => {
            instance = app;
            resolve();
          })
          .catch( (err) => {
            reject(err);
          });
        });
      });

      after(() => {
        instance.close();
      });

      it('Should load swaggerfile from object if not a string', () => {
        // If we get here, we win.
      });

      it('Should be able to add', () =>
        request(instance)
          .get('/add/4/5')
          .expect(200, {
            x: 4,
            y: 5,
            operation: 'add',
            result: 9,
          }));
    });
  });

  describe('Check OAS token verification handling', () => {
    let instance = null;

    before(() => {
      return new Promise((resolve, reject) => {
        const swaggerFileName = glob.sync('./tests/contracts/**/*oas3.yaml', {})[0];

        instance = skeleton({
          ioc: {
            autoRegister: { pattern: './services/**/*.js', rootDirectory: __dirname },
          },
          codegen: {
            templateSettings: {
              implementationPath: '../../controllers',
            },
            temporaryDirectory: './tests/.temp',
            oas_controllerFolder: './controllers',    // Relative to the temporaryDirectory
          },
          service: {
            swagger: swaggerFileName,
            listenPort: 0,
            hostName: "127.0.0.1",
          },
          exegesisOptions: {
            authenticators: {
              // Both not used in OpenAPI, but can be enabled for testing...
              // sessionKey: sessionAuthenticator,
              // addBasicAuth() {
              //   return [];
              // },
              addOauth2() {
                return { type: 'success', user: 'benbria', scopes: ['readOnly'] };
              },
            },
          }
        })
        .then( (app) => {
          instance = app;
          resolve();
        })
        .catch( (err) => {
          reject(err);
        });
      });
    });

    after(() => {
      instance.close();
    });

    it('Should load swaggerfile from object if not a string', () => {
      // If we get here, we win.
    });

    it('Should be able to add', () =>
    request(instance)
      .get('/add/4/5')
      .expect(200, {
        x: 4,
        y: 5,
        operation: 'add',
        result: 9,
      })
    );

    it('Should be able to addProtected', () =>
    request(instance)
      .get('/addProtected/4/5')
      .expect(200, {
        x: 4,
        y: 5,
        operation: 'add',
        result: 9,
      })
    );
  });

  describe('Check SWAGGER UI handling', () => {
    let instance = null;

    before(() => {
      return new Promise((resolve, reject) => {
        const swaggerFileName = glob.sync('./tests/contracts/**/*oas3.yaml', {})[0];

        instance = skeleton({
          ioc: {
            autoRegister: { pattern: './services/**/*.js', rootDirectory: __dirname },
          },
          codegen: {
            templateSettings: {
              implementationPath: '../../controllers',
            },
            temporaryDirectory: './tests/.temp',
            oas_controllerFolder: './controllers',    // Relative to the temporaryDirectory
          },
          service: {
            swagger: swaggerFileName,
            listenPort: 0,
            hostName: "localhost",
          },
          exegesisOptions: {
            authenticators: {
              // Both not used in OpenAPI, but can be enabled for testing...
              // sessionKey: sessionAuthenticator,
              // addBasicAuth() {
              //   return [];
              // },
              addOauth2() {
                return { type: 'success', user: 'benbria', scopes: ['readOnly'] };
              },
            },
          }
        })
        .then( (app) => {
          instance = app;
          resolve();
        })
        .catch( (err) => {
          reject(err);
        });
      });
    });

    after(() => {
      instance.close();
    });

    it('Should load swaggerfile from object if not a string', () => {
      // If we get here, we win.
    });

    it('Should be able to get Swagger UI doc page', () => {
      request(instance)
      .get( '/API_docs/' ) // MUST have / at the end!!!!!
      .end( ( err, res ) => {
        expect( err ).to.equal(null);
        expect( res.text ).to.contain( '<title>Swagger UI</title>' );
        expect( res.text ).to.contain( 'swagger-ui-standalone-preset.js' );
      });
    });

    it('Should get 404 for wrong UTL for Swagger UI doc page', () => {
      request(instance)
      .get( '/API_docss' )
      .expect(404)
      .then( (res) => {
        expect(res.body.message).to.be.eql('Route Not found');
      });
    });

    it('Should be able to get Swagger UI doc page', () => {
      request(instance)
      .get( '/API_docs' )
      .expect(301)
      .end( ( err, res ) => {
        expect( err ).to.equal(null);
        expect( res.text ).to.contain( 'Redirecting to <a href=');
      });
    });
  });
});
