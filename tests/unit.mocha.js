'use strict';

const cap = require('chai-as-promised');
const chai = require('chai');
const skeleton = require('../src');
const request = require('supertest-as-promised');
const yamljs = require('yamljs');
chai.use(cap);

describe('Unit Tests', () => {
  describe('Standard Cases', () => {
    let instance = null;
    beforeEach(() => {
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
