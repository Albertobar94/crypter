import { Parser } from 'json2csv';
import fs from 'fs';
import {
  logError,
  _createLogger,
  startLogger,
  succeedLogger,
  failLogger,
  logDebug,
} from './logging';
import { parseCVS, readCSV } from './transformers';
import path from 'path';

interface Props {
  filePath: string;
  content?: any;
  parser?: 'json' | 'csv';
  identifier?: string;
  columns?: string[];
  loggerInstance?: any;
  debug?: boolean;
}

// *
export const readFile = async ({ filePath, parser = 'csv' }: Props) => {
  let data: any;

  const instance = _createLogger();
  startLogger({
    instance,
    name: 'SP_R',
    options: { text: `Running readFile... - Format is ${parser}` },
  });

  try {
    if (parser === 'json') {
      data = fs.readFileSync(filePath, 'utf-8');
    } else {
      data = await readCSV(filePath);
    }

    return data;
  } catch (error) {
    failLogger({
      instance,
      name: 'SP_R',
      options: { text: `FAILED while reading file at ${filePath}` },
    });
  } finally {
    succeedLogger({
      instance,
      name: 'SP_R',
      options: { text: `Fully processed records from ${filePath}` },
    });
  }
};

// *
export const writeFile = async ({ filePath, content, parser = 'csv', columns, debug }: Props) => {
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
    case 'json':
      startLogger({
        instance,
        name: 'writeFile',
        options: { text: 'Writing file in Json format' },
      });
      contentParsed = JSON.stringify(content, null, 2);
      break;
    case 'csv':
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

// TODO
export const readFileStream = async ({
  filePath,
  parser = 'csv',
  identifier = 'user_id',
}: Props) => {
  switch (parser) {
    case 'csv':
      return parseCVS(filePath, identifier);
    case 'json':
      throw new Error('CODE MEEEEEEEEE FUCKR');
    default:
      throw new Error('Parser was not provided or it not matched any parser values');
  }
};

// TODO
export const exportReport = async (results, EXPORT_PATH) => {
  console.log(`${EXPORT_PATH} ---> ${results.length}`);
  if (results.length) {
    // @ts-expect-error
    const parser = new Parser(Object.keys(results[0]));
    const csv = parser.parse(results);
    try {
      fs.writeFileSync(EXPORT_PATH, csv);
    } catch (error) {
      console.log(error);
      fs.writeFileSync(EXPORT_PATH.split('/').pop(), csv);
    }
  }
};
