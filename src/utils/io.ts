import { Parser } from 'json2csv';
import fs from 'fs';
import {
  createLogger,
  startLogger,
  succeedLogger,
  failLogger,
  logDebug,
  updateLogger,
} from './logging';
import { readCsvStream } from './utilities';
import { FFormant } from '../common/types';
import path from 'path';

interface readProps {
  file: string;
  format: 'json' | 'csv';
  matchingValue?: string;
  debug?: boolean;
}
interface writeProps {
  exportPath: string;
  content: Record<string, any>[];
  format?: 'json' | 'csv';
  debug?: boolean;
  columns?: any;
}

export const readFile = async ({ file, format = 'csv', matchingValue }: readProps) => {
  let data: any;
  const instance = createLogger();

  startLogger({
    instance,
    name: 'SP_R',
    options: { text: `Running readFile... - Format is ${format}` },
  });

  try {
    switch (format) {
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

export const writeFile = ({ content, exportPath, format, debug, columns }: writeProps) => {
  if (!exportPath) throw new Error('Export Path must be specified');
  if (!content.length) return;

  let contentParsed: string;
  const csvColumns = columns ?? Object.keys(content?.[0]);

  if (debug) {
    logDebug({
      data: {
        exportPath,
        format,
        content,
        csvColumns,
      },
      message: `Debugging...`,
    });
  }

  switch (format) {
    case FFormant.json:
      contentParsed = JSON.stringify(content, null, 2);
      return fs.writeFileSync(exportPath, contentParsed);
    case FFormant.csv:
      // @ts-expect-error
      const parser = new Parser({ csvColumns });
      const csv = parser.parse(content);
      contentParsed = csv;
      return fs.writeFileSync(exportPath, contentParsed);
  }
};
