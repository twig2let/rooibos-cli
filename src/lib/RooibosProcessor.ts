import * as Debug from 'debug';

import * as path from 'path';

import { CodeCoverageProcessor } from './CodeCoverageProcessor';
import { getFeedbackErrors, getFeedbackWarnings } from './Feedback';
import File from './File';
import FunctionMap from './FunctionMap';
import { ProcessorConfig } from './ProcessorConfig';
import { RuntimeConfig } from './RuntimeConfig';

const debug = Debug('RooibosProcessor');
const pkg = require('../../package.json');

export class RooibosProcessor {
  constructor(config: ProcessorConfig) {

    this._config = config;
    debug('Running project processor');

    if (!config.projectPath) {
      throw new Error('Config does not contain projectPath property');
    }
    if (!config.sourceFilePattern && config.isRecordingCodeCoverage) {
      throw new Error('Config does not contain sourceFilePattern regex\'s, ' +
        'which are required when recording code coverage');
    }
    if (!config.testsFilePattern) {
      throw new Error('Config does not contain testsFilePattern regex\'s');
    }
  }

  private readonly _config: ProcessorConfig;

  public runtimeConfig: RuntimeConfig;

  get config(): ProcessorConfig {
    return this._config;
  }

  public processFiles() {
    debug(`Running processor at path ${this.config.projectPath} `);

    let outputText = this.createFileHeaderText();
    let functionMap = new FunctionMap();

    debug(`Adding runtimeConfig `);
    this.runtimeConfig = new RuntimeConfig(functionMap, this.config);
    this.runtimeConfig.process();

    debug(`Adding function map `);
    outputText += '\n' + functionMap.getFunctionMapText();
    debug(`Adding runtime config function `);
    outputText += '\n' + this.getRuntimeConfigText();
    debug(`Adding version function `);
    outputText += '\n' + this.getVersionText();

    outputText += '\n' + this.createTestsHeaderText();
    outputText += '\n' + this.runtimeConfig.createTestSuiteLookupFunction();
    outputText += '\n' + this.runtimeConfig.createIgnoredTestsInfoFunction();
    outputText += '\n' + this.createFileFooterText();
    let mapFileName = path.join(this.config.projectPath, this.config.outputPath, 'rooibosFunctionMap.brs');
    const file = new File(path.resolve(path.dirname(mapFileName)), path.dirname(mapFileName), path.basename(mapFileName), '.brs');
    file.setFileContents(outputText);
    debug(`Writing to ${file.fullPath}`);
    file.saveFileContents();

    if (this.config.isRecordingCodeCoverage) {
      debug(`this is a code coverage build. Adding code coverage calls`);
      let coverageProcessor = new CodeCoverageProcessor(this.config);
      coverageProcessor.process();
    } else {
      debug(`this is NOT a code coverage build.`);
    }
    this.reportErrors();
    this.reportWarnings();
  }

  public reportErrors() {
    if (getFeedbackErrors().length > 0) {

      debug(`
    The following errors occurred during processing:

    ======
    `);
      getFeedbackErrors().forEach((errorText) => debug(`[ERROR] ${errorText}`));
      debug(`
    ======
    `);
    }
  }

  public reportWarnings() {
    if (getFeedbackWarnings().length > 0) {

      debug(`
    The following warnings occurred during processing:

    ======
    `);
      getFeedbackWarnings().forEach((errorText) => debug(`[WARN] ${errorText}`));
      debug(`
    ======
    `);
    }
  }

  public createFileHeaderText(): string {
    return `
    '***************************************************
    ' This file is generated by rooibos. DO NOT EDIT. RTM please :)
    ' ***************************************************
    `;
  }

  public createFileFooterText(): string {
    return `

    '***************************************************
    ' This file is generated by rooibos. DO NOT EDIT. RTM please :)
    ' ***************************************************
    `;
  }

  public createTestsHeaderText(): string {
    return `
    '***************************************************
    ' Unit test suites defitintions
    '***************************************************
    `;
  }

  public getRuntimeConfigText(): string {
    return `

    function RBSFM_getRuntimeConfig()
        return {
          "failFast": ${this.config.failFast}
          "showOnlyFailures": ${this.config.showFailuresOnly}
          "rooibosPreprocessorVersion": ${pkg.version}
          }
    end function
    `;
  }

  public getVersionText(): string {
    return `
    function RBSFM_getPreprocessorVersion()
        return "${pkg.version}"
    end function
    `;
  }
}
