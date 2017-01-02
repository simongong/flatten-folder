'use strict';

const FS = require('fs');
const assert = require('assert');
const Path = require('path');
const Rimraf = require('rimraf');

const program = Path.resolve(__dirname, '../index.js');
const SourceFolder = Path.resolve(__dirname, './fixtures');
const TargetFolder = Path.resolve(__dirname, './result');

describe('Copy image files', () => {
  before((done) => {
    if (!FS.existsSync(TargetFolder)) {
      FS.mkdirSync(TargetFolder);
    }
    const cmd = 'node ' + program + ' --from ' + SourceFolder + ' --to ' + TargetFolder + ' --default';
    require('child_process').exec(cmd, (err, stdout , stderr) => {
      if (!err) {
        done();
      }
    });
  });
  after(() => {
    Rimraf.sync(TargetFolder);
  });

  it('Should has 7 image files copied', function() {
    const files = FS.readdirSync(TargetFolder);
    assert(files.length === 7);
  });
});
