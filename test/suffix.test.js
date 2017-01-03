'use strict';

const FS = require('fs');
const assert = require('assert');
const Path = require('path');
const Rimraf = require('rimraf');
const Process = require('child_process');
const program = Path.resolve(__dirname, '../index.js');
const SourceFolder = Path.resolve(__dirname, './fixtures');
const ResultFolder = Path.resolve(__dirname, './result');
if (!FS.existsSync(ResultFolder)) {
  FS.mkdirSync(ResultFolder);
}

describe('`--suffix` option', () => {
  const TargetFolder = Path.resolve(ResultFolder, new Date().valueOf().toString());

  after(() => {
    Rimraf.sync(TargetFolder);
  });

  it('Should has 7 image files copied with `--suffix img`', (done) => {
    const cmd = 'node ' + program + ' --from ' + SourceFolder + ' --to ' + TargetFolder + ' --suffix img --overwrite';
    Process.exec(cmd, (err, stdout , stderr) => {
      assert(err === null && stdout !== '' && stderr === '');
      assert(stdout.indexOf('files copy') !== -1);

      // will not have two copies of each file
      const files = FS.readdirSync(TargetFolder);
      assert(files.filter(file => file.indexOf('.json') === -1).length === 7);
      done();
    });
  });

  it('Should has 2 json files copied with `--suffix json`', (done) => {
    const cmd = 'node ' + program + ' --from ' + SourceFolder + ' --to ' + TargetFolder + ' --suffix json --overwrite';
    Process.exec(cmd, (err, stdout , stderr) => {
      assert(err === null && stdout !== '' && stderr === '');
      assert(stdout.indexOf('files copy') !== -1);

      // will not have two copies of each file
      const files = FS.readdirSync(TargetFolder);
      assert(files.length === 9);
      assert(files.filter(file => file.indexOf('.json') !== -1).length === 2);
      done();
    });
  });
});
