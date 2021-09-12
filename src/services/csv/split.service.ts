import CSV from 'csv-split-stream';
import fs from 'fs';
import path from 'path/posix';
import { date } from '../../utils/helpers';
import {
  failLogger,
  logDebug,
  logError,
  startLogger,
  succeedLogger,
  _createLogger,
} from '../../utils/logging';

interface Props {
  file: string;
  lines?: number;
  name?: string;
  outputDir: string;
  debug: boolean;
}

export const splitFileService = async ({
  file,
  lines = 1000,
  name = 'new-split-file' + date(),
  outputDir,
  debug,
}: Props) => {
  if (!file) throw new Error('Bro, you need to add a file to split');
  if (!outputDir) throw new Error('Bro, you need to add a output directory');

  let CSVResponse: any;
  const instance = _createLogger();

  if (debug) {
    logDebug({
      message: 'Debugging...',
      data: {
        file,
        lines,
        name,
      },
    });
  }

  try {
    startLogger({
      instance,
      name: 'splitFileService',
      options: { text: 'Splitting files...' },
    });
    CSVResponse = await CSV.split(
      fs.createReadStream(file),
      {
        lineLimit: lines,
      },
      (index: any) => fs.createWriteStream(`${outputDir}/${name}-${index + 1}.csv`),
    );
  } catch (error) {
    failLogger({
      instance,
      name: 'splitFileService',
      options: {
        text: `Failed while creating file at dir ${path.join(process.env.PWD!, outputDir)}`,
      },
    });
    logError({
      message: 'FAILURE while splitting file',
    });
    console.error(error);
  } finally {
    succeedLogger({
      instance,
      name: 'splitFileService',
      options: { text: `Created files at directory ${path.join(process.env.PWD!, outputDir)}` },
    });
  }
};
