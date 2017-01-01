/**
 * Read all leaf files of a folder recursively
 * and copy them into a target folder with a flat structure.
 *
 * Author: Simon.Gong <simon.gong64@gmail.com>
 */

'use strict';

const FS = require('fs');
const Path = require('path');
const Argvs = require('yargs').argv;
const Glob = require('glob');
const Chalk = require('chalk');

const LocalTmp = Path.resolve(__dirname, './tmp_flatten/');
if (!FS.existsSync(LocalTmp)) {
  FS.mkdirSync(LocalTmp);
}

const TargetFolder = Argvs.to ? Path.resolve(Argvs.to) : Path.resolve(LocalTmp, new Date().valueOf().toString());
const SourceFolder = Argvs.from ? Path.resolve(Argvs.from) : Path.resolve('./');

if (!FS.existsSync(TargetFolder)) {
  FS.mkdirSync(TargetFolder);
} else {
  console.warn(Chalk.bold.yellow('[WARN] Target Folder already exists. Please confirm if it\'s OK to overwrite it.'));
  return;
}

function _getLegalTargeName(from, to) {
  const fileName = Path.basename(from);
  if (FS.existsSync(to + '/' + fileName)) { // file exists in target folder, rename it recursively
    const fileNameSplit = fileName.split('.');
    const newName = fileNameSplit[0] + '-1';
    return _getLegalTargeName(to + '/' + newName + (fileNameSplit[1] ? '.' + fileNameSplit[1] : ''), to);
  } else {
    return to + '/' + fileName;
  }
}

function _cp(from, to) {
  const realTo = _getLegalTargeName(from, to);

  return new Promise((resolve, reject) => {
    const rs = FS.createReadStream(from);
    rs.on('error', cleanUp);
    const wr = FS.createWriteStream(realTo);
    wr.on('error', cleanUp);
    wr.on('finish', resolve);
    rs.pipe(wr);
    function cleanUp(err) {
      rs && rs.destroy();
      wr && wr.end();
      reject(err);
    }
  });
}

console.time('[Total Time Cost]');
console.log(Chalk.green('Start reading files from ' + Argvs.from));
console.log(Chalk.green('...'));

const imageReg = '/**/*.@(jpg|jpeg|png|bmp|gif|JPG|JPEG|PNG|BMP|GIF)';
Glob(SourceFolder + imageReg, (err, files) => {
  if (err) {
    console.error(Chalk.red(err.message));
    return;
  }
  if (!files.length) {
    console.warn(Chalk.yellow('No image in folder ' + SourceFolder));
  }

  const tasks = files.map(filePath => _cp(filePath, TargetFolder));

  Promise.all(tasks)
  .then(() => {
    console.log(Chalk.green('Finish ' + files.length + ' files copy!'));
    console.log(Chalk.green('Check them in ' + TargetFolder));
    console.timeEnd('[Total Time Cost]');
  })
  .catch(err => {
    console.error(Chalk.red('Error happens when copy file: ' + err.message));
  });
});

// walking a folder for leaf files recursively
// function walk(path) {
//   const stats = FS.statSync(path);
//   if (!stats) {
//     throw new Error('Read file stat error: ', path);
//   }
//   if (stats.isFile()) { // file found
//     _cp(path, TargetFolder);
//     return;
//   } else if (stats.isDirectory()) { // directory. walking all child files recursively.
//     const childFiles = FS.readdirSync(path);
//     childFiles.forEach(file => {
//       walk(Path.resolve(path, file));
//     });
//   }
// }

// walk(SourceFolder);
