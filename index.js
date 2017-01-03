/**
 * Read all leaf files of a folder recursively
 * and copy them into a target folder with a flat structure.
 *
 * Author: Simon.Gong <simon.gong64@gmail.com>
 *
 * Usage: node index.js --from path --to path --suffix [img|av|suffix|any] --cleanUp --overwrite

 */

'use strict';

const FS = require('fs');
const Path = require('path');
const Argvs = require('yargs').argv;
const Glob = require('glob');
const Chalk = require('chalk');
const Rimraf = require('rimraf');

const UsageTip = `
Basic usage:
  node index.js --from path --to path --suffix [img|av|suffix|any] --cleanUp --overwrite
Options:
  --from path of source folder (required)
  --to path of target folder (will be created if missing)
  --suffix [img|av|suffix|any] file type
    img: all image file
    av: audio/video file
    [json|md|...]: user specified file type
    any: all type
  --cleanUp remove source folder afterwards
  --overwrite overwrite file if it exists in targt folder
Example:
  node index.js --from ./test/fixtures --suffix any --overwrite
  node index.js --from ./test/fixtures --suffix json --overwrite
  node index.js --from ./test/fixtures --suffix img
  node index.js --from ./test/fixtures --cleanUp
`;
// required options checked
if (!Argvs.from) {
  console.error(Chalk.red('Option `--from` is missing!'));
  console.info(Chalk.gray(UsageTip));
  return;
}

// glob pattern for media files
const AnyReg = '/**/*.*';
const ImageReg = '/**/*.@(jpg|jpeg|png|bmp|gif|JPG|JPEG|PNG|BMP|GIF)';
const AvReg = '/**/*.@(flv|ram|mpg|mpeg|avi|rm|wmv|mov|asf|rbs|movie|divx|mp4|ogg|mpeg4|m4v|webm|FLV|RAM|MPG|MPEG|AVI|RM|WMV|MOV|ASF|RBS|MOVIE|DIVX|MP4|OGG|MPEG4|M4V|WEBM)';

const LocalTmp = Path.resolve(__dirname, './tmp_flatten/');
if (!FS.existsSync(LocalTmp)) {
  FS.mkdirSync(LocalTmp);
}

const TargetFolder = Argvs.to ? Path.resolve(Argvs.to) : Path.resolve(LocalTmp, new Date().valueOf().toString());
const SourceFolder = Path.resolve(Argvs.from);

const CleanSource = !!Argvs.cleanUp;

// set anyReg by default
let typeFilter = AnyReg;
if (Argvs.suffix) {
  switch (Argvs.suffix) {
    case 'any':
      typeFilter = AnyReg;
      break;
    case 'av':
      typeFilter = AvReg;
      break;
    case 'img':
      typeFilter = ImageReg;
      break;
    default:
      typeFilter = '/**/*.@(' + Argvs.suffix + '|' + Argvs.suffix.toUpperCase() + ')';
      break;
  }
}

prepare()
.then(() => {
  console.time('[Total Time Cost]');
  console.log(Chalk.green('\nCopy... from ' + SourceFolder));

  Glob(SourceFolder + typeFilter, (err, files) => {
    if (err) {
      console.error(Chalk.red(err.message));
      return;
    }
    if (!files.length) {
      let fileType = 'file';
      switch (typeFilter) {
        case AnyReg:
          fileType = 'file';
          break;
        case ImageReg:
          fileType = 'image file';
          break;
        case AvReg:
          fileType = 'audio/video file';
          break;
        default:
          fileType = Argvs.suffix + ' file';
          break;
      }
      console.warn(Chalk.bold.yellow('\n[WARN] No ' + fileType + ' in folder ' + SourceFolder));
    }

    const tasks = files.map(filePath => _cp(filePath, TargetFolder));

    Promise.all(tasks)
    .then(() => {
      console.log(Chalk.green('\nFinish ' + files.length + ' files copy!'));
      console.log(Chalk.green('Check them in ' + TargetFolder));
      if (CleanSource) {
        console.log(Chalk.green('\nRemoving Source Folder... '));
        Rimraf.sync(SourceFolder);
        console.log(Chalk.green('Source Folder ' + SourceFolder + ' has been removed.'));
      }
      console.timeEnd('[Total Time Cost]');
    })
    .catch(err => {
      console.error(Chalk.red('\nError happens when copy file: ' + err.message));
    });
  });
})
.catch((err) => {
  if (err) {
    console.error(Chalk.red('\nError happens: ' + err.message));
  } else {
    console.info(Chalk.green('\nExit...'));
  }
});

function prepare() {
  return new Promise((resolve, reject) => {
    if (!FS.existsSync(SourceFolder)) { // sourceFolder not exists
      reject(new Error('SourceFolder ' + SourceFolder + ' doesn\'t exists.'));
    }
    if (!FS.existsSync(TargetFolder)) { // no target specified, then we don't need to prompt for it
      FS.mkdirSync(TargetFolder);
    } else {
      if (!Argvs.overwrite) {
        const overwriteTip = '[WARN]Target Folder ' + TargetFolder + ' already exists and you don\'t have `--overwrite` option set. Quit.';
        console.warn(Chalk.bold.yellow(overwriteTip));
        reject(new Error(overwriteTip));
        return;
      }
    }
    resolve();
  });
}

function _getLegalTargeName(from, to) {
  const fileName = Path.basename(from);
  // file exists in target folder and no overwrite option, rename it recursively
  if (FS.existsSync(to + '/' + fileName) && !Argvs.overwrite) {
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
