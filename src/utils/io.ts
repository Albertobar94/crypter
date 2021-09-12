import { Parser } from 'json2csv';
import fs from 'fs';
import {
  logError,
  logInfo,
  logData,
  _createLogger,
  startLogger,
  succeedLogger,
  failLogger,
  logDebug,
} from './logging';
import { parseCVS, readCSV } from './helpers';
import path from 'path';

interface Props {
  filePath: string;
  content?: any;
  parser?: 'JSON' | 'CSV';
  identifier?: string;
  columns?: string[];
  loggerInstance?: any;
  debug?: boolean;
}

export const readFile = async ({ filePath, parser = 'CSV', loggerInstance }: Props) => {
  let data: any;

  if (loggerInstance) {
    loggerInstance.add('SP_R', { text: `Running readFile... - Format is ${parser}` });
  }

  try {
    if (parser === 'JSON') {
      data = fs.readFileSync(filePath, 'utf-8');
    } else {
      data = await readCSV(filePath, loggerInstance);
    }

    return data;
  } catch (error) {
    if (loggerInstance) {
      loggerInstance.fail('SP_R', {
        text: `FAILED while reading file at ${filePath}`,
        failColor: 'red',
      });
    }
  }
};

export const writeFile = async ({ filePath, content, parser = 'CSV', columns, debug }: Props) => {
  if (!filePath) throw new Error('File Path must be specified');
  if (!content) throw new Error('Content must be provided');
  if (debug) {
    logDebug({
      data: {
        filePath,
        parser,
        content,
        columns,
      },
      message: `Debugging...`,
    });
  }

  let contentParsed: string;

  const instance = _createLogger();

  switch (parser) {
    case 'JSON':
      startLogger({
        instance,
        name: 'writeFile',
        options: { text: 'Writing file in Json format' },
      });
      contentParsed = JSON.stringify(content, null, 2);
      break;
    case 'CSV':
      startLogger({ instance, name: 'writeFile', options: { text: 'Writing file in Csv format' } });
      // @ts-expect-error
      const parser = new Parser({ columns });
      const csv = parser.parse(content);
      contentParsed = csv;
      break;
  }

  try {
    fs.writeFileSync(filePath, contentParsed);
  } catch (error) {
    failLogger({
      instance,
      name: 'writeFile',
      options: { text: `Failed while creating file at ${path.join(process.env.PWD!, filePath)}` },
    });
    logError({
      message: `FAILED while Writing File with file path of ${filePath}`,
    });
    console.error(error);
  } finally {
    succeedLogger({
      instance,
      name: 'writeFile',
      options: { text: `created file at ${path.join(process.env.PWD!, filePath)}` },
    });
  }
};

export const readFileStream = async ({
  filePath,
  parser = 'CSV',
  identifier = 'user_id',
}: Props) => {
  switch (parser) {
    case 'CSV':
      return parseCVS(filePath, identifier);
    case 'JSON':
      throw new Error('CODE MEEEEEEEEE FUCKR');
    default:
      throw new Error('Parser was not provided or it not matched any parser values');
  }
};
