import * as chai from 'chai';
import * as fs from 'fs-extra';

import { expect } from 'chai';

import { ProcessorConfig } from './ProcessorConfig';
import { CodeCoverageProcessor } from './CodeCoverageProcessor';

const chaiSubset = require('chai-subset');
let dircompare = require('dir-compare');

chai.use(chaiSubset);
let processor: CodeCoverageProcessor;
let sourcePath = 'src/test/stubProject';
let targetPath = 'build';

let config: ProcessorConfig = require('../test/testProcessorConfig.json');

function clearFiles() {
  fs.removeSync(targetPath);
}

function copyFiles() {
  try {
    fs.copySync(sourcePath, targetPath);
  } catch (err) {
    console.error(err);
  }
}

describe('RooibosProcessor tests', function() {
  beforeEach(() => {
    clearFiles();
    copyFiles();
    processor = new CodeCoverageProcessor(config);
  });

  describe('Initialization', function() {
    it('correctly sets source paths and config', function() {
      expect(processor.config).to.equal(config);
    });
  });

  describe('Process files valid test', function() {
    it('tests file creation', () => {
      processor.process();
    });
  });
});