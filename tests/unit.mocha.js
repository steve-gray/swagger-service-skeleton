'use strict';

const cap = require('chai-as-promised');
const chai = require('chai');
const glob = require('glob');
const request = require('supertest');
const skeleton = require('../src');

const expect = chai.expect;
chai.use(cap);

describe('Unit Tests', () => {
  describe('Standard Cases', () => {
    let instance = null;
    let preCount = 0;
    let beforeControllerCount = 0;
    let postCount = 0;

    beforeEach( () => {
      return new Promise((resolve, reject) => {
        preCount = 0;
        beforeControllerCount = 0;
        postCount = 0;
        const swaggerFileName = glob.sync('./tests/contracts/**/*oas3.yaml', {})[0];

        // console.log('Current directory: ' + process.cwd());
        // console.log('swaggerFileName : ' + swaggerFileName);

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
                preCount = preCount + 1;
                next();
              },
            ],
            beforeController: [
              (req, res, next) => {
                beforeControllerCount = beforeControllerCount + 1;
                next();
              },
            ],
            afterSwagger: [
              (req, res, next) => {
                postCount = postCount + 1;
                next();
              },
            ],
          },
          service: {
            swagger: swaggerFileName,
            listenPort: 0,
            hostName: "localhost",
          },
        })
        .then( app => {
          instance = app;
          resolve();
        })
        .catch(err => {
          reject(err);
        });
      });
    });

    afterEach(() => {
      instance.close();
    });

    it('Should handle requests', () => {
      // Start up, shut down
    });

    it('Should be able to add', () => {
      // console.log('Current directory: ' + process.cwd());
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
          expect(beforeControllerCount).to.be.eql(1, 'Before controller hits');
          expect(postCount).to.be.eql(1, 'Post Middleware hits');
        })
    );

    it('Should run customMiddleware.afterSwagger too on error', () =>
      request(instance)
        .get('/does-not-exist/4/5')
        .expect(404)
        .then(() => {
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
    let beforeControllerCount = 0;
    let postCount = 0;

    beforeEach(() => {
      return new Promise((resolve, reject) => {
        preCount = 0;
        beforeControllerCount = 0;
        postCount = 0;
        const swaggerFileName = glob.sync('./tests/contracts/**/*oas3.yaml', {})[0];
        // console.log('swaggerFileName : ' + swaggerFileName);

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
                preCount = preCount + 1;
                next();
              },
            ],
            beforeController: [
              (req, res, next) => {
                beforeControllerCount = beforeControllerCount + 1;
                next();
              },
            ],
            afterSwagger: [
              (req, res, next) => {
                postCount = postCount + 1;
                next();
              },
            ],
          },
          service: {
            swagger: swaggerFileName,
            listenPort: 0,
            hostName: "127.0.0.1",
          },
        })
        .then( app => {
          instance = app;
          resolve();
        })
        .catch(err => {
          reject(err);
        });
      });
    });

    afterEach(() => {
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
          expect(beforeControllerCount).to.be.eql(1, 'Before controller hits');
          expect(postCount).to.be.eql(1, 'Post Middleware hits');
        });
    });

    it('Should run customMiddleware.afterSwagger too on error', () =>
      request(instance)
        .get('/does-not-exist/4/5')
        .expect(404)
        .then(() => {
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
      // console.log('swaggerFileName : ' + swaggerFileName);

      beforeEach(() => {
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
          })
          .then( app => {
            instance = app;
            resolve();
          })
          .catch(err => {
            reject(err);
          });
        });
      });
  
      afterEach(() => {
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
});
