import { date } from '../../utils/helpers';
import { readFile, writeFile } from '../../utils/io';
import {
  logError,
  failLogger,
  succeedLogger,
  updateLogger,
  logDebug,
  createLogger,
  startLogger,
} from '../../utils/logging';
import { extractNestedData } from '../../utils/transformers';

interface Props {
  file?: string;
  columns: string;
  flattenPathToValue?: string;
  outputDir: string;
  fileFormat?: 'csv' | 'json';
  name?: string;
  transformer?: (data: any) => void;
  debug?: boolean;
}

const flattenService = async ({
  file,
  columns,
  flattenPathToValue,
  outputDir,
  fileFormat,
  name,
  transformer = extractNestedData,
  debug,
}: Props) => {
  const instance = createLogger();
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
        flattenPathToValue,
        outputDir,
        fileFormat,
        name,
      },
    });
  }

  try {
    if (!file) throw new Error('File must be specified');
    if (!columns) throw new Error('Columns must be specified');
    if (!flattenPathToValue) throw new Error('flattenPath must be specified');
    if (!outputDir) throw new Error('outputDir must be specified');

    updateLogger({
      name: 'flattenService',
      instance: instance,
      options: { text: 'Reading file in flattenService...' },
    });

    const data = await readFile({ file, parser: fileFormat });

    updateLogger({
      name: 'flattenService',
      instance: instance,
      options: { text: 'Processing data from file in flattenService...' },
    });
    const content = transformer({ data, flattenPathToValue, columns, debug });

    writeFile({
      outputFile: name ? `${outputDir}/${name}.csv` : `${outputDir}/extracted-data-${date()}.csv`,
      parser: fileFormat,
      columns: [flattenPathToValue!.split('.')[0], ...columns.split(',')],
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
