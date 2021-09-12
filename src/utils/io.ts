import { Parser } from 'json2csv';
import fs from 'fs';
import {
  logError,
  createLogger,
  startLogger,
  succeedLogger,
  failLogger,
  logDebug,
} from './logging';
import { readCsvStream } from './transformers';
import path from 'path';

interface readProps {
  file?: string;
  parser?: 'json' | 'csv';
  matchingValue?: string;
  columns?: string[];
  debug?: boolean;
}
interface writeProps {
  outputFile?: string;
  content?: any;
  parser?: 'json' | 'csv';
  columns?: string[];
  debug?: boolean;
}

export const readFile = async ({ file, parser = 'csv', matchingValue }: readProps) => {
  let data: any;

  const instance = createLogger();
  startLogger({
    instance,
    name: 'SP_R',
    options: { text: `Running readFile... - Format is ${parser}` },
  });

  try {
    switch (parser) {
      case 'csv':
        data = await readCsvStream({ file, matchingValue: matchingValue! });
        return data;
      case 'json':
        data = fs.readFileSync(file!, 'utf-8');
        return data;
    }
  } catch (error) {
    failLogger({
      instance,
      name: 'SP_R',
      options: { text: `FAILED while reading file at ${file}` },
    });
    console.error(error);
  } finally {
    succeedLogger({
      instance,
      name: 'SP_R',
      options: { text: `Fully processed records from ${file}` },
    });
  }
};

export const writeFile = async ({
  outputFile,
  content,
  parser = 'csv',
  columns,
  debug,
}: writeProps) => {
  if (!outputFile) throw new Error('File Path must be specified');
  if (!content) throw new Error('Content must be provided');
  if (debug) {
    logDebug({
      data: {
        outputFile,
        parser,
        content,
        columns,
      },
      message: `Debugging...`,
    });
  }

  let contentParsed: string;

  const instance = createLogger();

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
    fs.writeFileSync(outputFile, contentParsed);
  } catch (error) {
    failLogger({
      instance,
      name: 'writeFile',
      options: { text: `Failed while creating file at ${path.join(process.env.PWD!, outputFile)}` },
    });
    logError({
      message: `FAILED while Writing File with file path of ${outputFile}`,
    });
    console.error(error);
  } finally {
    succeedLogger({
      instance,
      name: 'writeFile',
      options: { text: `created file at ${path.join(process.env.PWD!, outputFile)}` },
    });
  }
};

// TODO remove this
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
