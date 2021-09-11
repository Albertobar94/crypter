import { normalizeData } from '../../utils/helpers';
import { readFileStream, writeFile } from '../../utils/io';
import { logError, logInfo, logData, logDebug } from '../../utils/logging';

interface Props {
  files?: string;
  concatColumns?: string;
  matchingValue?: string;
  outputDir: string;
  debug: boolean;
}

const concatService = async ({ files, concatColumns, matchingValue, outputDir, debug }: Props) => {
  if (debug) {
    logDebug({
      data: {
        files,
        concatColumns,
        matchingValue,
        outputDir,
      },
      message: 'Data supplied to service',
    });
  }

  let normalizedData: any[] = [];
  const fs = files!.split(',');
  const cc = concatColumns!.split(',');
  const outputFile = `${outputDir}/concatenated-file.csv`;

  if (!files) throw new Error('File Paths must be specified');
  if (!concatColumns) throw new Error('concatColumns must be specified');
  if (!matchingValue) throw new Error('Matching value must be specified');
  if (!outputDir) throw new Error('outputDir must be specified');
  if (!matchingValue) throw Error('No value for Exact Property was provided');
  if (fs && fs.length > 2) throw Error('File Paths must be only two!');
  if (cc && cc.length < 1) throw Error('Columns must be at least one!');

  try {
    const promises = fs.map(fp => {
      return readFileStream({
        filePath: fp,
        identifier: matchingValue,
      });
    });
    const [first, second]: any = await Promise.all(promises);

    // Normalize data stage Stage //
    for (let matchingValue in first) {
      if (matchingValue in second) {
        const data = normalizeData({
          columns: cc,
          arr: [first, second],
          identifier: matchingValue,
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
    await writeFile({
      filePath: outputFile,
      content: normalizedData,
      parser: 'CSV',
      columns: cc,
    });
  } catch (error) {
    logError({
      message: 'ERROR while Running Concat Service',
    });
    console.error(error);
  } finally {
    // logData({
    //   data: {
    //     outputFile,
    //   },
    //   message: `logDatafully Ran Concat Service. Output file is at ${outputFile}`,
    // });
  }
};

export { concatService };
