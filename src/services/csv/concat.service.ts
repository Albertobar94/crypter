import path from 'path/posix';
import { normalizeData } from '../../utils/utilities';
import { readFile, writeFile } from '../../utils/io';
import {
  logError,
  logDebug,
  createLogger,
  startLogger,
  failLogger,
  succeedLogger,
} from '../../utils/logging';
import { FFormant } from '../../common/types';

interface Props {
  file?: string;
  concatColumns?: string;
  matchingValue?: string;
  outputDir: string;
  debug: boolean;
  name?: string;
}

const concatService = async ({
  file,
  concatColumns,
  matchingValue,
  outputDir,
  name,
  debug,
}: Props) => {
  if (debug) {
    logDebug({
      data: {
        file,
        concatColumns,
        matchingValue,
        outputDir,
      },
      message: 'Data supplied to service',
    });
  }
  if (!file) throw new Error('File Paths must be specified');
  if (!concatColumns) throw new Error('concatColumns must be specified');
  if (!matchingValue) throw new Error('Matching value must be specified');
  if (!outputDir) throw new Error('outputDir must be specified');
  if (!matchingValue) throw Error('No value for Exact Property was provided');

  let normalizedData: any[] = [];
  const instance = createLogger();
  const fs = file.split(',');
  const cc = concatColumns.split(',');
  const outputFile =
    name && name !== '' ? `${outputDir}/${name}.csv` : `${outputDir}/concatenated-file.csv`;

  if (fs && fs.length > 2) throw Error('File Paths must be only two!');
  if (cc && cc.length < 1) throw Error('Columns must be at least one!');

  try {
    startLogger({
      instance,
      name: 'concatService',
      options: { text: 'Concatenating files...' },
    });
    const promises = fs.map(file => {
      return readFile({
        file,
        format: FFormant.csv,
        matchingValue,
      });
    });
    const [first, second]: any = await Promise.all(promises);

    // Normalize data stage Stage //
    for (let matchingValue in first) {
      if (matchingValue in second) {
        const data = normalizeData({
          columns: cc,
          arr: [first, second],
          matchingValue,
          debug,
        });
        normalizedData.push(data);
      } else {
        if (debug) {
          logDebug({
            data: {
              matchingValue,
            },
            message: 'NOT_FOUND matching parameters for both files for matchingValue',
          });
        }
      }
    }

    // Output file Stage //
    writeFile({
      exportPath: outputFile,
      content: normalizedData,
      format: FFormant.csv,
    });
  } catch (error) {
    failLogger({
      instance,
      name: 'concatService',
      options: { text: `Failed while creating file at ${path.join(process.env.PWD!, outputFile)}` },
    });
    logError({
      message: 'ERROR while Running Concat Service',
    });
    console.error(error);
  } finally {
    succeedLogger({
      instance,
      name: 'concatService',
      options: { text: `Success` },
    });
  }
};

export { concatService };
