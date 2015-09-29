var gulp = require('gulp');
var path = require('path');
var del = require('del');
var concat = require('gulp-concat');
var merge = require('merge-stream');
var sourcemaps = require('gulp-sourcemaps');
var less = require('gulp-less');
var rename = require('gulp-rename');
var config = require('./gulp.config.js');
var browserify = require('gulp-browserify');
var argv = require('yargs').argv;
var gulpif = require('gulp-if');
var uglify = require('gulp-uglify');
var minifyCss = require('gulp-minify-css');
var ngAnnotate = require('gulp-ng-annotate');
var debug = require('gulp-debug');
var jshint = require('gulp-jshint');
var gulpFilter = require('gulp-filter');

gulp.task('watch', ['build'], function () {
  gulp.watch('src/**/*.js', ['buildJs']);
  gulp.watch('src/**/*.less', ['buildStyles']);
  gulp.watch('src/**/*.html', ['buildOther']);
});

gulp.task('clean', function(cb) {
  del(['build-dev', 'build-dist'], cb());
});

gulp.task('build', ['buildStyles', 'buildJs', 'buildOther']);
  gulp.task('buildJs', ['buildJsPopup', 'buildJsBackground']);

gulp.task('buildStyles', function(cb) {
  return gulp.src(config.styles)
    .pipe(less({
      paths: [ path.join(__dirname, 'bower_components') ]
    }))
    .pipe(gulpif(isDist(), minifyCss()))
    .pipe(rename('extension.css'))
    .pipe(gulp.dest(buildPath('css')));
});

gulp.task('buildJsPopup', function() {
  var filter = gulpFilter(['src/**/*.js', '!src/js/popup/ga.js'], {restore: true});

  return gulp.src(filterFiles(config.scripts.popup), {base: '.'})
    .pipe(filter)
    .pipe(jshint())
    .pipe(jshint.reporter('default'))
    .pipe(filter.restore)
    .pipe(concat('popup.js'))
    .pipe(ngAnnotate())
    .pipe(gulpif(isDist(), uglify()))
    .pipe(gulp.dest(buildPath('js')));
});

gulp.task('buildJsBackground', function() {
  return gulp.src(config.scripts.background)
    .pipe(jshint())
    .pipe(jshint.reporter('default'))
    .pipe(concat('background.js'))
    .pipe(browserify({
      insertGlobals : true,
      debug: isDev()
    }))
    .pipe(gulpif(argv.dist, uglify()))
    .pipe(gulp.dest(buildPath('js')));
});

gulp.task('buildOther', function(cb) {
  return gulp.src(config.other, {base: 'src'})
    .pipe(gulp.dest(buildPath()));
});

function buildPath(path) {
  return (isDev() ? 'build-dev' : 'build-dist') + (path ? '/' + path : '');
}

function isDist() {
  return argv.dist;
}

function isDev() {
  return !isDist();
}

function filterFiles(input) {
  var output = [];
  input.forEach(function(item) {
    var path;

    if (typeof item === 'string') {
      output.push(item);
      return;
    }

    if (item.env === 'dist' && !isDev()) {
      output.push(item.path);
      return;
    }

    if (item.env === 'dev' && isDev()) {
      output.push(item.path);
      return;
    }
  });

  return output;
}
