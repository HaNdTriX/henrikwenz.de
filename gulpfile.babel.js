import gulp from 'gulp';
import gulpLoadPlugins from 'gulp-load-plugins';
import del from 'del';
import merge from 'merge-stream';
import gulpSequence from 'gulp-sequence';
import minimist from 'minimist';
import browserSyncLib from 'browser-sync';
import yargs from 'yargs';
import packageJSON from './package.json';

let $ = gulpLoadPlugins();
let browserSync = browserSyncLib.create();
let argv = yargs.argv;
let packages = packageJSON.dependencies;
let src = {};
let watch = false;

const RELEASE = argv.release;
const GOOGLE_ANALYTICS_ID = 'UA-66789892-1';
const AUTOPREFIXER_BROWSERS = [
  'ie >= 10',
  'ie_mob >= 10',
  'ff >= 30',
  'chrome >= 34',
  'safari >= 7',
  'opera >= 23',
  'ios >= 7',
  'android >= 4.4',
  'bb >= 10'
];

function onError(error) {
  let formatError = $.util.colors.red('Error (' + error.plugin + '): ' + error.message);
  $.util.log(formatError);
  $.util.beep();
  this.emit('end');
  if (!watch) {
    process.exit()
  }
}

gulp.task('default', ['serve']);

gulp.task('clean', del.bind(null, ['dist/*', '!dist/.git'], {
  dot: true
}));

gulp.task('vendor', () => {
  return merge(
    gulp
      .src('node_modules/jquery/dist/*.*')
      .pipe(gulp.dest('dist/vendor/jquery-' + packages.jquery)),
    gulp
      .src('node_modules/modernizr/dist/modernizr-build.min.js')
      .pipe($.plumber(onError))
      .pipe($.rename('modernizr.min.js'))
      .pipe($.uglify())
      .pipe(gulp.dest('dist/vendor/modernizr-' + packages.modernizr))

  );
});

gulp.task('assets', () => {
  src.assets = 'app/*';
  return gulp.src(src.assets)
    .pipe(gulp.dest('dist'));
});

gulp.task('images', () => {
  src.images = 'app/images/**/*';
  return gulp.src(src.images)
    .pipe($.plumber(onError))
    .pipe($.imagemin({
      progressive: true,
      interlaced: true
    }))
    .pipe(gulp.dest('dist/images'));
});

gulp.task('fonts', () => {
  src.fonts = 'app/fonts/**';
  return gulp.src([
      src.fonts,
      'node_modules/bootstrap/fonts/**',
      'node_modules/font-awesome/fonts/**'
    ])
    .pipe(gulp.dest('dist/fonts'));
});

gulp.task('data', () => {
  src.data = 'app/data/**';
  return gulp.src(src.data)
    .pipe(gulp.dest('dist/data'));
});

gulp.task('pages', () => {
  src.pages = [
    'app/pages/**/*',
    'app/layouts/**/*',
    'app/partials/**/*'
  ];
  return gulp.src(src.pages[0])
    .pipe($.plumber(onError))
    .pipe($.if(/\.jade/, $.jade({
      pretty: !RELEASE,
      locals: {
        packages: packages,
        googleAnalyticsID: GOOGLE_ANALYTICS_ID
      }
    })))
    .pipe($.if(RELEASE, $.htmlmin({
      removeComments: true,
      collapseWhitespace: true,
      minifyJS: true,
      minifyCSS: true
    })))
    .pipe(gulp.dest('dist'));
});

gulp.task('styles', () => {
  src.styles = 'app/styles/**/*.{css,less}';
  return gulp.src('app/styles/bootstrap.less')
    .pipe($.plumber(onError))
    .pipe($.if(!RELEASE, $.sourcemaps.init()))
    .pipe($.less())
    .pipe($.autoprefixer(AUTOPREFIXER_BROWSERS))
    .pipe($.csscomb())
    .pipe(RELEASE ? $.cssmin() : $.util.noop())
    .pipe($.rename('style.css'))
    .pipe($.if(!RELEASE, $.sourcemaps.write()))
    .pipe(gulp.dest('dist/css'));
});

gulp.task('scripts', () => {
  src.scripts = [
    'app/scripts/$.js',
    'app/scripts/skillchart.js',
    'app/scripts/main.js'
  ];
  return gulp.src(src.scripts)
    .pipe($.plumber(onError))
    .pipe($.if(!RELEASE, $.sourcemaps.init()))
    .pipe($.concat('bundle.js'))
    .pipe($.if(RELEASE, $.uglify()))
    .pipe($.if(!RELEASE, $.sourcemaps.write()))
    .pipe(gulp.dest('dist/js'));
});

gulp.task('build', gulpSequence(
  'clean', [
    'vendor',
    'assets',
    'images',
    'fonts',
    'pages',
    'styles',
    'scripts',
    'data'
  ]
));

gulp.task('serve', ['build'], () => {
  watch = true;
  browserSync.init({
    server: './dist'
  });
  gulp.watch(src.data, ['data']);
  gulp.watch(src.assets, ['assets']);
  gulp.watch(src.images, ['images']);
  gulp.watch(src.pages, ['pages']);
  gulp.watch(src.styles, ['styles']);
  gulp.watch(src.scripts, ['scripts']);
  gulp.watch('./dist/**/*.*', browserSync.reload);
});

gulp.task('deploy', () => {
  return gulp.src('dist/**/*')
    .pipe($.ghPages());
});
