import { date } from '../../utils/helpers';
import { readFile, readFileStream, writeFile } from '../../utils/io';
import {
  createLogger,
  logError,
  failLogger,
  logInfo,
  succeedLogger,
  logData,
  updateLogger,
  logDebug,
  _createLogger,
  startLogger,
} from '../../utils/logging';
import { extractNestedData } from '../../utils/transformers';

interface Props {
  filePath?: string;
  columns: string;
  pToExtract?: string;
  outputDir: string;
  fileFormat?: 'CSV' | 'JSON';
  name?: string;
  transformer?: (data: any) => void;
  debug?: boolean;
}

const extractService = async ({
  filePath,
  columns,
  pToExtract,
  outputDir,
  fileFormat,
  name,
  transformer = extractNestedData,
  debug,
}: Props) => {
  const instance = _createLogger();
  startLogger({
    instance,
    name: 'extractService',
    options: { text: 'Running extractService...' },
  });

  if (debug) {
    logDebug({
      message: 'Debugging...',
      data: {
        filePath,
        columns,
        pToExtract,
        outputDir,
        fileFormat,
        name,
      },
    });
  }

  try {
    if (!filePath) throw new Error('File must be specified');
    if (!columns) throw new Error('Columns must be specified');
    if (!pToExtract) throw new Error('pToExtract must be specified');
    if (!outputDir) throw new Error('outputDir must be specified');

    // Read Stage //
    updateLogger({
      name: 'extractService',
      instance: instance,
      options: { text: 'Reading file in extractService...' },
    });
    // spinnies.update('SP_ES');
    const data = await readFile({ filePath, parser: fileFormat, loggerInstance: instance });

    // Transform Stage //
    updateLogger({
      name: 'extractService',
      instance: instance,
      options: { text: 'Processing data from file in extractService...' },
    });
    const content = transformer({ data, pToExtract, columns, debug });

    writeFile({
      filePath: name ? `${outputDir}/${name}.csv` : `${outputDir}/extracted-data-${date()}.csv`,
      parser: fileFormat,
      columns: [pToExtract!.split('.')[0], ...columns.split(',')],
      content,
    });
  } catch (error) {
    failLogger({
      name: 'extractService',
      instance: instance,
      options: { text: 'FAILED to execute extractService...' },
    });
    logError({
      message: 'ERROR while Running Extract CSV Service',
    });
    console.error(error);
  } finally {
    succeedLogger({
      name: 'extractService',
      instance: instance,
      options: { text: 'Success...' },
    });
  }
};

export { extractService };
