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
const Prompt = require('prompt');
const Rimraf = require('rimraf');

// glob pattern for media files
const AnyReg = '/**/*.*';
const ImageReg = '/**/*.@(jpg|jpeg|png|bmp|gif|JPG|JPEG|PNG|BMP|GIF)';
const AvReg = '/**/*.@(flv|ram|mpg|mpeg|avi|rm|wmv|mov|asf|rbs|movie|divx|mp4|ogg|mpeg4|m4v|webm|FLV|RAM|MPG|MPEG|AVI|RM|WMV|MOV|ASF|RBS|MOVIE|DIVX|MP4|OGG|MPEG4|M4V|WEBM)';

const LocalTmp = Path.resolve(__dirname, './tmp_flatten/');
if (!FS.existsSync(LocalTmp)) {
  FS.mkdirSync(LocalTmp);
}

const TargetFolder = Argvs.to ? Path.resolve(Argvs.to) : Path.resolve(LocalTmp, new Date().valueOf().toString());
const SourceFolder = Argvs.from ? Path.resolve(Argvs.from) : Path.resolve('./');

// variables for prompt
let CleanSource = false;
let typeFilter = AnyReg;

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
        case ImageReg:
          fileType = 'image file';
          break;
        case AvReg:
          fileType = 'audio/video file';
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
    if (Argvs.default) {  // use default for all, no need prompt
      resolve();
      return;
    }
    Prompt.start();
    Prompt.message = '';  // remove the default 'prompt' in front
    let schema = {
      properties: {
        overwriteTarget: {
          message: 'Overwrite?(yes|no)',
          validator: /y[es]*|n[o]?/,
          warning: 'Must respond with yes or no',
          default: 'yes',
        },
        cleanSource: {
          message: 'Remove Original Folder after copy?(yes|no)',
          validator: /y[es]*|n[o]?/,
          warning: 'Must respond with yes or no',
          default: 'no',
        },
        // TODO: let user input the preferred file type
        typeFilter: {
          message: 'Specify a file type?(img|av|any)',
          validator: /img|av|any?/,
          warning: 'Must respond with img or av or any',
          default: 'any',
        },
      },
    };
    if (!FS.existsSync(TargetFolder)) { // no target specified, then we don't need to prompt for it
      FS.mkdirSync(TargetFolder);
      delete schema.properties.overwriteTarget;
    } else {
      console.warn(Chalk.bold.yellow('[WARN] Target Folder already exists. Please confirm if it\'s OK to overwrite it.'));
    }
    Prompt.get(schema, (err, result) => {
      if (result.overwriteTarget === 'no') {
        reject();
      } else {
        Rimraf.sync(TargetFolder);
        FS.mkdirSync(TargetFolder);
        if (result.cleanSource === 'yes') {
          CleanSource = true;
        }
        if (result.typeFilter !== 'any') {
          switch (result.typeFilter) {
            case 'img':
              typeFilter = ImageReg;
              break;
            case 'av':
              typeFilter = AvReg;
              break;
          }
        }
        resolve();
      }
    });
  });
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
