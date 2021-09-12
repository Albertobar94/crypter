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
  file?: string;
  columns: string;
  flattenPath?: string;
  outputDir: string;
  fileFormat?: 'csv' | 'json';
  name?: string;
  transformer?: (data: any) => void;
  debug?: boolean;
}

const flattenService = async ({
  file,
  columns,
  flattenPath,
  outputDir,
  fileFormat,
  name,
  transformer = extractNestedData,
  debug,
}: Props) => {
  const instance = _createLogger();
  startLogger({
    instance,
    name: 'flattenService',
    options: { text: 'Running flattenService...' },
  });

  if (debug) {
    logDebug({
      message: 'Debugging...',
      data: {
        file,
        columns,
        flattenPath,
        outputDir,
        fileFormat,
        name,
      },
    });
  }

  try {
    if (!file) throw new Error('File must be specified');
    if (!columns) throw new Error('Columns must be specified');
    if (!flattenPath) throw new Error('flattenPath must be specified');
    if (!outputDir) throw new Error('outputDir must be specified');

    // Read Stage //
    updateLogger({
      name: 'flattenService',
      instance: instance,
      options: { text: 'Reading file in flattenService...' },
    });
    // spinnies.update('SP_ES');
    const data = await readFile({ filePath: file, parser: fileFormat, loggerInstance: instance });

    // Transform Stage //
    updateLogger({
      name: 'flattenService',
      instance: instance,
      options: { text: 'Processing data from file in flattenService...' },
    });
    const content = transformer({ data, flattenPath, columns, debug });

    writeFile({
      filePath: name ? `${outputDir}/${name}.csv` : `${outputDir}/extracted-data-${date()}.csv`,
      parser: fileFormat,
      columns: [flattenPath!.split('.')[0], ...columns.split(',')],
      content,
    });
  } catch (error) {
    failLogger({
      name: 'flattenService',
      instance: instance,
      options: { text: 'FAILED to execute flattenService...' },
    });
    logError({
      message: 'ERROR while Running Extract CSV Service',
    });
    console.error(error);
  } finally {
    succeedLogger({
      name: 'flattenService',
      instance: instance,
      options: { text: 'Success...' },
    });
  }
};

export { flattenService };
