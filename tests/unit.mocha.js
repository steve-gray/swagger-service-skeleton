'use strict';

const cap = require('chai-as-promised');
const chai = require('chai');
const skeleton = require('../src');
const request = require('supertest-as-promised');
const yamljs = require('yamljs');

const expect = chai.expect;
chai.use(cap);

describe('Unit Tests', () => {
  describe('Standard Cases', () => {
    let instance = null;
    let preCount = 0;
    let postCount = 0;

    beforeEach(() => {
      preCount = 0;
      postCount = 0;
      instance = skeleton({
        ioc: {
          autoRegister: { pattern: './services/**/*.js', rootDirectory: __dirname },
        },
        codegen: {
          templateSettings: {
            implementationPath: '../../controllers',
          },
          temporaryDirectory: './tests/.temp',
        },
        customMiddleware: {
          beforeSwagger: [
            (req, res, next) => {
              preCount = preCount + 1;
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
          swagger: './tests/contracts/example.yaml',
        },
      });
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

    it('Should run customMiddleware.beforeSwagger only on match', () =>
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
          expect(postCount).to.be.eql(0, 'Post Middleware hits');
          return Promise.resolve();
        }));

    it('Should run customMiddleware.afterSwagger too on error', () =>
      request(instance)
        .get('/does-not-exist/4/5')
        .expect(404)
        .then(() => {
          expect(preCount).to.be.eql(1, 'Pre Middleware hits');
          expect(postCount).to.be.eql(1, 'Post Middleware hits');
          return Promise.resolve();
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

    it('Should 500 when exception from controller', () =>
      request(instance)
        .get('/add/-1/4')
        .expect(500)
    );

    afterEach(() => {
      instance.close();
    });
  });

  describe('Special input handling', () => {
    describe('service.swagger = object', () => {
      let instance = null;
      beforeEach(() => {
        const contract = yamljs.load('./tests/contracts/example.yaml');
        instance = skeleton({
          ioc: {
            autoRegister: { pattern: './services/**/*.js', rootDirectory: __dirname },
          },
          codegen: {
            templateSettings: {
              implementationPath: '../../controllers',
            },
            temporaryDirectory: './tests/.temp',
          },
          service: {
            swagger: contract,
          },
        });
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
      afterEach(() => {
        instance.close();
      });
    });
  });
});
