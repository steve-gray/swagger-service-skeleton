'use strict';

//process.env.NODE_ENV = 'development';
//process.env.DEBUG = "express:*";
//process.env.DEBUG='express:*;*';
//const debug = require('debug');
//debug.enable('express:**');

//debug(`process.env.DEBUG : ${process.env.DEBUG}`);


const documentation = require('./tasks/documentation');
const instrument = require('./tasks/instrument');
const lint = require('./tasks/lint');
const test = require('./tasks/test');
const gulp = require('gulp');

gulp.task('cover', instrument);
gulp.task('docs', documentation);
gulp.task('lint', lint);
gulp.task('unittest', test);
gulp.task('test', gulp.series('cover', test));
gulp.task('default', gulp.series('docs', 'lint', 'test'));
