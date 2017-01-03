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

describe('`--overwrite` option', () => {
  const TargetFolder = Path.resolve(ResultFolder, 'test');
  before((done) => {
    const cmd = 'node ' + program + ' --from ' + SourceFolder + ' --to ' + TargetFolder;
    Process.exec(cmd, (err, stdout , stderr) => {
      if (!err) {
        done();
      }
    });
  });
  after(() => {
    Rimraf.sync(TargetFolder);
  });

  it('Should exit if target folder exists and no `--overwrite` option specified', (done) => {
    const cmd = 'node ' + program + ' --from ' + SourceFolder + ' --to ' + TargetFolder;
    Process.exec(cmd, (err, stdout , stderr) => {
      assert(err === null && stdout === '' && stderr !== '');
      assert(stderr.indexOf('already exists') !== -1);
      done();
    });
  });

  it('Should execute when target folder exists with `--overwrite` option', (done) => {
    const cmd = 'node ' + program + ' --from ' + SourceFolder + ' --to ' + TargetFolder + ' --overwrite';
    Process.exec(cmd, (err, stdout , stderr) => {
      assert(err === null && stdout !== '' && stderr === '');
      assert(stdout.indexOf('files copy') !== -1);

      // will not have two copies of each file
      const files = FS.readdirSync(TargetFolder);
      assert(files.length === 9);
      done();
    });
  });
});
