'use strict';

// process.env.NODE_ENV = 'production';
// process.env.NODE_ENV = 'development';
// process.env.DEBUG = "express:*";
// process.env.DEBUG='express:*;*';
// const debug = require('debug');
// debug.enable('express:**');

// debug(`process.env.DEBUG : ${process.env.DEBUG}`);
// process.env.DEBUG='*';
// process.env.DEBUG='';

const config = require('config');
const eslint = require('gulp-eslint');
const esdoc = require('gulp-esdoc');
const gulp = require('gulp');

const fs = require('fs');
const rmdir = require('rmdir');

const tempDir = ".temp";
const distDir = "dist";
const distTestDir = "./tests/.temp";
const coverageDir = './coverage';
const nycOutputDir = './.nyc_output';

gulp.task('clean', () => {
  try {
    fs.stat(tempDir, (fsError) => {
      if (!fsError) {
        rmdir(tempDir, (err, dirs) => {
          if (err) {
            console.log(`Failed to rmdir dirs : ${tempDir}`);
          } else {
            console.log(`rmdir dirs : ${dirs}`);
          }
        });
      }
    });
  } catch(err) {
    console.log(`Clean '${tempDir}' error: '${err}'`);
  }

  try {
    fs.stat(distDir, (fsError) => {
      if (!fsError) {
        rmdir(distDir, (err, dirs) =>{
          if (err) {
            console.log(`Failed to rmdir dirs : ${distDir}`);
          } else {
            console.log(`rmdir dirs : ${dirs}`);
          }
        });
      }
    });
  } catch(err) {
    console.log(`Clean '${distDir}' error: '${err}'`);
  }

  try {
    fs.stat(distTestDir, (fsError) => {
      if (!fsError) {
        rmdir(distTestDir, (err, dirs) =>{
          if (err) {
            console.log(`Failed to rmdir dirs : ${distTestDir}`);
          } else {
            console.log(`rmdir dirs : ${dirs}`);
          }
        });
      }
    });
  } catch(err) {
    console.log(`Clean '${distTestDir}' error: '${err}'`);
  }

  try {
    fs.stat(coverageDir, (fsError) => {
      if (!fsError) {
        rmdir(coverageDir, (err, dirs) => {
          if (err) {
            console.log(`Failed to rmdir dirs : ${coverageDir}`);
          } else {
            console.log(`rmdir dirs : ${dirs}`);
          }
        });
      }
    });
  } catch(err) {
    console.log(`Clean '${coverageDir}' error: '${err}'`);
  }

  try {
    fs.stat(nycOutputDir, (fsError) => {
      if (!fsError) {
        rmdir(nycOutputDir, (err, dirs) => {
          if (err) {
            console.log(`Failed to rmdir dirs : ${nycOutputDir}`);
          } else {
            console.log(`rmdir dirs : ${dirs}`);
          }
        });
      }
    });
  } catch(err) {
    console.log(`Clean '${nycOutputDir}' error: '${err}'`);
  }
  return Promise.resolve(); // Directory does not exist, but do not stop GULP
});

gulp.task('docs', () => {
  return gulp.src(config.get('build.documentation.paths'))
    .pipe(esdoc({
      destination: config.get('build.documentation.outputPath'),
      unexportIdentifier: config.get('build.documentation.unexportedIdentifiers'),
      undocumentIdentifier: config.get('build.documentation.undocumentedIdentifiers'),
      test: {
        type: config.get('build.documentation.testType'),
        source: config.get('build.documentation.testRoot'),
      }
    }));
});

gulp.task('lint', () => {
  return gulp.src(config.get('build.linting.paths'))
    .pipe(eslint())
    .pipe(eslint.format(config.get('build.linting.formatter')))
    .pipe(eslint.failAfterError());
});

gulp.task('default', gulp.series('docs', 'lint'));
