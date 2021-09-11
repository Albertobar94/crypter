import { normalizeData } from '../../utils/helpers';
import { readFileStream, writeFile } from '../../utils/io';
import { logError, logInfo, logData } from '../../utils/logging';

interface Props {
  filePaths?: string;
  columnsToConcat?: string;
  identifier?: string;
  outputFile: string;
}

const concatService = async ({ filePaths, columnsToConcat, identifier, outputFile }: Props) => {
  // Vars Stage //
  let normalizedData: any[] = [];
  const fps = filePaths!.split(',');
  const ctc = columnsToConcat!.split(',');

  logInfo({
    serviceName: 'concatService',
    data: {
      filePaths,
      columnsToConcat,
      identifier,
    },
    message: 'Started running Concat Service',
  });

  try {
    // Errors Stage //
    if (!identifier) throw Error('No value for Exact Property was provided');
    if (fps && fps.length > 2) throw Error('File Paths must be only two!');
    if (ctc && ctc.length < 1) throw Error('Columns must be at least one!');

    // Promises Stage //
    const promises = fps.map(fp => {
      return readFileStream({
        filePath: fp,
        identifier,
      });
    });
    const [first, second]: any = await Promise.all(promises);

    // Normalize data stage Stage //
    for (let identifier in first) {
      if (identifier in second) {
        const data = normalizeData({ columns: ctc, arr: [first, second], identifier });
        normalizedData.push(data);
      } else {
        logInfo({
          serviceName: 'normalizeData',
          data: {
            identifier,
          },
          message: 'NOT_FOUND matching parameters for both files for identifier',
        });
      }
    }

    // Output file Stage //
    await writeFile({
      filePath: outputFile,
      content: normalizedData,
      parser: 'CSV',
      columns: ctc,
    });
  } catch (error) {
    console.error(error);
    logError({
      serviceName: 'concatService',
      error,
      message: 'ERROR while Running Concat Service',
    });
  } finally {
    logData({
      serviceName: 'concatService',
      data: {
        filePath: outputFile,
      },
      message: `logDatafully Ran Concat Service. Output file is ${outputFile}`,
    });
  }
};

export { concatService };
