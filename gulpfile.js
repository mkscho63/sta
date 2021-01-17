const gulp = require('gulp');
const sass = require('gulp-sass');
const eslint = require('gulp-eslint');
const fs = require('fs-extra');
const path = require('path');
const git = require('gulp-git');
const archiver = require('archiver');
const stringify = require('json-stringify-pretty-compact');
const argv = require('yargs').argv;
const chalk = require('chalk');

gulp.task('sass', function(cb) {
  gulp
    .src('src/styles/*.scss')
    .pipe(sass())
    .pipe(
      gulp.dest(function(f) {
        return f.base;
      })
    );
  cb();
});

gulp.task(
  'default',
  gulp.series('sass', function(cb) {
    gulp.watch('styles/*.scss', gulp.series('sass'));
    cb();
  })
);

/* Get Configuration File */
function getConfig() {
  const configPath = path.resolve(process.cwd(), 'foundryconfig.json');
  let config;

  if (fs.existsSync(configPath)) {
    config = fs.readJSONSync(configPath);
    return config;
  } else {
    return;
  }
}

/* Get Manifest */
function getManifest() {
  const json = {};

  if (fs.existsSync('src')) {
    json.root = 'src';
  } else {
    json.root = 'dist';
  }

  const systemPath = path.join(json.root, 'system.json');

  if (fs.existsSync(systemPath)) {
    json.file = fs.readJSONSync(systemPath);
    json.name = 'system.json';
  } else {
    return;
  }

  return json;
}

/* Build Sass */
function buildSASS() {
  return gulp
    .src('src/styles/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('dist'));
}

/* Build packs for system.json */
// async function replaceTokenSystemJson() {
//   return gulp
//     .src(src.)
// }

/* Copy Files */
async function copyFiles() {
  const statics = [
    'lang',
    'assets',
    'module',
    'templates',
    'system.json',
    'template.json',
  ];
  try {
    for (const file of statics) {
      if (fs.existsSync(path.join('src', file))) {
        await fs.copy(path.join('src', file), path.join('dist', file));
      }
    }
    return Promise.resolve();
  } catch (err) {
    Promise.reject(err);
  }
}

/* Build Watch */
function buildWatch() {
  gulp.watch('src/**/*.scss', {ignoreInitial: false}, buildSASS);
  gulp.watch(
    ['src/lang', 'src/templates', 'src/*.json'],
    {ignoreInitial: false},
    copyFiles
  );
}

/* Clean */
async function clean() {
  const name = path.basename(path.resolve('.'));
  const files = [];
  console.log(path.join('src', 'styles', `${name}.scss`));

  files.push(
    'lang',
    'templates',
    'assets',
    'packs',
    'module',
    `${name}.js`,
    'module.json',
    'system.json',
    'template.json'
  );


  // If the project uses SASS push SASS
  if (fs.existsSync(path.join('src', 'styles', `${name}.scss`))) {
    files.push(`${name}.css`);
  }

  console.log(' ', chalk.yellow('Files to clean:'));
  console.log('   ', chalk.blueBright(files.join('\n    ')));

  // Attempt to remove the files
  try {
    for (const filePath of files) {
      await fs.remove(path.join('dist', filePath));
    }
    return Promise.resolve();
  } catch (err) {
    Promise.reject(err);
  }
}

// Copy files to test location
async function copyUserData() {
  const name = path.basename(path.resolve('.'));
  const config = fs.readJSONSync('foundryconfig.json');

  let destDir;
  
  try {
    if (fs.existsSync(path.resolve('.', 'dist', 'system.json')) ||
			fs.existsSync(path.resolve('.', 'src', 'system.json'))) {
      destDir = 'systems';
    } else {
      throw Error(
        `Could not find ${chalk.blueBright('system.json')}`
      );
    }

    let linkDir;
    if (config.dataPath) {
      if (!fs.existsSync(path.join(config.dataPath, 'Data'))) {
        throw Error('User Data path invalid, no Data directory found');
      }

      linkDir = path.join(config.dataPath, 'Data', destDir, name);
    } else {
      throw Error('No User Data path defined in foundryconfig.json');
    }

    if (argv.clean || argv.c) {
      console.log(
        chalk.yellow(`Removing build in ${chalk.blueBright(linkDir)}`)
      );
      await fs.remove(linkDir);
    } else {
      console.log(
        chalk.green(`Copying build to ${chalk.blueBright(linkDir)}`)
      );

      await fs.emptyDir(linkDir);
      await fs.copy('dist', linkDir);
    }
    return Promise.resolve();
  } catch (err) {
    Promise.reject(err);
  }
}

// Package build
async function packageBuild() {
  const manifest = getManifest();

  return new Promise((resolve, reject) => {
    try {
      // Remove the package dir without doing anything else
      if (argv.clean || argv.c) {
        console.log(chalk.yellow('Removing all packaged files'));
        fs.removeSync('package');
        return;
      }

      // Ensure there is a directory to hold all the packaged versions
      fs.ensureDirSync('package');

      // Initialize the zip file
      const zipName = `${manifest.file.name}-v${manifest.file.version}.zip`;
      const zipFile = fs.createWriteStream(path.join('package', zipName));
      const zip = archiver('zip', {zlib: {level: 9}});

      zipFile.on('close', () => {
        console.log(chalk.green(zip.pointer() + ' total bytes'));
        console.log(
          chalk.green(`Zip file ${zipName} has been written`)
        );
        return resolve();
      });

      zip.on('error', (err) => {
        throw err;
      });

      zip.pipe(zipFile);

      // Add the directory with the final code
      zip.directory('dist/', manifest.file.name);

      zip.finalize();
    } catch (err) {
      return reject(err);
    }
  });
}

// Update version and URLs in the manifest JSON 
function updateManifest(cb) {
  const packageJson = fs.readJSONSync('package.json');
  const config = getConfig();
  const manifest = getManifest();
  const rawURL = config.rawURL;
  const repoURL = config.repository;
  const manifestRoot = manifest.root;

  if (!config) cb(Error(chalk.red('foundryconfig.json not found')));
  if (!manifest) cb(Error(chalk.red('Manifest JSON not found')));
  if (!rawURL || !repoURL) {
    cb(
      Error(
        chalk.red(
          'Repository URLs not configured in foundryconfig.json'
        )
      )
    );
  }

  try {
    const version = argv.update || argv.u;

    /* Update version */

    const versionMatch = /^(\d{1,}).(\d{1,}).(\d{1,})$/;
    const currentVersion = manifest.file.version;
    let targetVersion = '';

    if (!version) {
      cb(Error('Missing version number'));
    }

    if (versionMatch.test(version)) {
      targetVersion = version;
    } else {
      targetVersion = currentVersion.replace(
        versionMatch,
        (substring, major, minor, patch) => {
          console.log(
            substring,
            Number(major) + 1,
            Number(minor) + 1,
            Number(patch) + 1
          );
          if (version === 'major') {
            return `${Number(major) + 1}.0.0`;
          } else if (version === 'minor') {
            return `${major}.${Number(minor) + 1}.0`;
          } else if (version === 'patch') {
            return `${major}.${minor}.${Number(patch) + 1}`;
          } else {
            return '';
          }
        }
      );
    }

    if (targetVersion === '') {
      return cb(Error(chalk.red('Error: Incorrect version arguments.')));
    }

    if (targetVersion === currentVersion) {
      return cb(
        Error(
          chalk.red(
            'Error: Target version is identical to current version.'
          )
        )
      );
    }
    console.log(`Updating version number to '${targetVersion}'`);

    packageJson.version = targetVersion;
    manifest.file.version = targetVersion;

    /* Update URLs */

    const result = `${rawURL}/v${manifest.file.version}/package/${manifest.file.name}-v${manifest.file.version}.zip`;

    manifest.file.url = repoURL;
    manifest.file.manifest = `${rawURL}/master/${manifestRoot}/${manifest.name}`;
    manifest.file.download = result;

    const prettyProjectJson = stringify(manifest.file, {
      maxLength: 35,
      indent: '\t',
    });

    fs.writeJSONSync('package.json', packageJson, {spaces: '\t'});
    fs.writeFileSync(
      path.join(manifest.root, manifest.name),
      prettyProjectJson,
      'utf8'
    );

    return cb();
  } catch (err) {
    cb(err);
  }
}

function gitAdd() {
  return gulp.src('package').pipe(git.add({args: '--no-all'}));
}

function gitCommit() {
  return gulp.src('./*').pipe(
    git.commit(`v${getManifest().file.version}`, {
      args: '-a',
      disableAppendPaths: true,
    })
  );
}

function gitTag() {
  const manifest = getManifest();
  return git.tag(
    `v${manifest.file.version}`,
    `Updated to ${manifest.file.version}`,
    (err) => {
      if (err) throw err;
    }
  );
}

const execGit = gulp.series(gitAdd, gitCommit, gitTag);

const execBuild = gulp.parallel(buildSASS, copyFiles);

exports.build = gulp.series(clean, execBuild);
exports.watch = buildWatch;
exports.clean = clean;
exports.copy = copyUserData;
exports.package = packageBuild;
exports.update = updateManifest;
exports.publish = gulp.series(
  clean,
  updateManifest,
  execBuild,
  packageBuild,
  execGit
);
