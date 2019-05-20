import * as chai from 'chai';
import * as fs from 'fs-extra';

import { expect } from 'chai';

import { Tag } from './Tag';
import { TestSuiteBuilder } from './TestSuiteBuilder';
import { makeFile } from './TestUtils';

const chaiSubset = require('chai-subset');

chai.use(chaiSubset);
let builder: TestSuiteBuilder;
let sourcePath = 'src/test/stubProject';
let targetPath = 'build';
let specDir = 'build/source/tests/specs';

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

describe('TestSuiteBuilder tests ', function() {
  beforeEach(() => {
    builder = new TestSuiteBuilder(50);
  });

  describe('Initialization', function() {
    it('correctly sets source paths and config', function() {
      expect(builder.maxLinesWithoutSuiteDirective).to.equal(50);
    });
  });

  describe('getFunctionFromLine', function() {
    it('checks non function lines', () => {
      expect(builder.getFunctionFromLine('')).to.be.null;
      expect(builder.getFunctionFromLine('    ')).to.be.null;
      expect(builder.getFunctionFromLine(' m.this  = "someValue')).to.be.null;
      expect(builder.getFunctionFromLine(`'   function long_word_Different1(with Args) as void`)).to.be.null;
      expect(builder.getFunctionFromLine(`'function foo() as void`)).to.be.null;
    });

    it('checks function lines', () => {
      expect(builder.getFunctionFromLine('function foo() as void')).to.equal('foo');
      expect(builder.getFunctionFromLine('sub foo() as void')).to.equal('foo');
      expect(builder.getFunctionFromLine('   sub foo() as void')).to.equal('foo');
      expect(builder.getFunctionFromLine('   function foo() as void')).to.equal('foo');
      expect(builder.getFunctionFromLine('   function long_word_Different1() as void')).to.equal('long_word_Different1');
      expect(builder.getFunctionFromLine('   function long_word_Different1(with Args) as void')).to.equal('long_word_Different1');
    });
  });

  describe('getTagText', function() {
    it('no text/not a tag', () => {
      expect(builder.getTagText(`@TestSuite`, Tag.TEST_SUITE)).to.be.empty;
      expect(builder.getTagText(`NOT`, Tag.TEST_SUITE)).to.be.empty;
    });

    it('has text and has tag', () => {
      expect(builder.getTagText(`@TestSuite someText`, Tag.TEST_SUITE)).to.equal(`someText`);
      expect(builder.getTagText(`@TestSuite someText here`, Tag.TEST_SUITE)).to.equal(`someText here`);
      expect(builder.getTagText(`@TestSuite     someText here2`, Tag.TEST_SUITE)).to.equal(`someText here2`);
    });
  });

  describe('processFile', function() {
    beforeEach(() => {
      clearFiles();
      copyFiles();
    });

    it('ignores null file descriptor', () => {
      let testSuite = builder.processFile(null);
      expect(testSuite).to.not.be.null;
      expect(testSuite.isValid).to.be.false;
    });

    it('ignores empty file contents', () => {
      let file = makeFile(`source`, `test.brs`);
      file.setFileContents('');
      let testSuite = builder.processFile(file);
      expect(testSuite).to.not.be.null;
      expect(testSuite.isValid).to.be.false;
    });

    it('processes valid test file', () => {
      let file = makeFile(specDir, `VideoModuleTests.brs`);
      let testSuite = builder.processFile(file);
      expect(testSuite).to.not.be.null;
      expect(testSuite.isValid).to.be.true;
    });

    it('processes solo test suite', () => {
      let file = makeFile(specDir, `soloSuite.brs`);
      let testSuite = builder.processFile(file);
      expect(testSuite).to.not.be.null;
      expect(testSuite.isValid).to.be.true;
      expect(testSuite.isSolo).to.be.true;
    });

    it('processes solo group', () => {
      let file = makeFile(specDir, `soloGroup.brs`);
      let testSuite = builder.processFile(file);
      expect(testSuite).to.not.be.null;
      expect(testSuite.isValid).to.be.true;
      expect(testSuite.hasSoloGroups).to.be.true;
    });

    it('processes solo test', () => {
      let file = makeFile(specDir, `soloTest.brs`);
      let testSuite = builder.processFile(file);
      expect(testSuite).to.not.be.null;
      expect(testSuite.isValid).to.be.true;
      expect(testSuite.hasSoloTests).to.be.true;
    });

    it('simple params', () => {
      let file = makeFile(specDir, `paramsTest.brs`);
      let testSuite = builder.processFile(file);
      expect(testSuite).to.not.be.null;
      expect(testSuite.isValid).to.be.true;
      expect(testSuite.itGroups[0].testCases[0].expectedNumberOfParams).to.equal(2);
      expect(testSuite.itGroups[0].testCases[0].rawParams.length).to.equal(2);

      expect(testSuite.itGroups[0].testCases[1].expectedNumberOfParams).to.equal(2);
      expect(testSuite.itGroups[0].testCases[1].rawParams.length).to.equal(2);
    });

    it('complex params', () => {
      let file = makeFile(specDir, `complexParamsTests.brs`);
      let testSuite = builder.processFile(file);
      expect(testSuite).to.not.be.null;
      expect(testSuite.isValid).to.be.true;
      expect(testSuite.itGroups[0].soloTestCases[0].expectedNumberOfParams).to.equal(3);
      expect(testSuite.itGroups[0].soloTestCases[0].rawParams.length).to.equal(3);

      expect(testSuite.itGroups[0].soloTestCases[1].expectedNumberOfParams).to.equal(3);
      expect(testSuite.itGroups[0].soloTestCases[1].rawParams.length).to.equal(3);
    });

  });
});
