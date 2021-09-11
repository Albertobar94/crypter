import { Command } from 'commander';
import { parseTuple } from '../utils/helpers';
import { concatService } from '../services/csv/concat.service';
import { extractService } from '../services/csv/extract.service';
import { splitFile } from '../services/csv/split.service';

type action = 'concat' | 'flatten' | 'split';

const CONFIG = {
  command: 'csv <action>',
  description: ' Concat information in the same rows for CSV files...',
  options: {
    files: ['-fs, --files <paths> ', ' STRING: file names paths delimited by "," '],
    file: ['-f, --file <path> ', ' STRING: file names paths delimited by "," '],
    fileFormat: ['-ff, --fileFormat <format> ', ' STRING: file format to read'],

    concatColumns: [
      '-c, --concatColumns <columns>',
      ' STRING: of Column names to concat in the same row delimited by ","',
    ],

    matchingValue: [
      '-mv, --matchingValue <value>',
      'STRING: Value to be present for each row to be concatenated',
    ],
    flattenPath: ['-pe, --flattenPath <path>', 'STRING: <Key>.<Key>.<key> -> <Value> '],

    lines: ['-l, --lines <number>', 'Number of lines to split'],
    name: ['-n, --name <newName>', 'new Name for split File'],

    outputDir: ['-o, --outputDir <path>', 'STRING: Value path to output file'],

    debug: ['-d, --debug', 'output extra debugging'],
  },
};

const {
  command,
  description,
  options: {
    concatColumns,
    debug,
    file,
    files,
    fileFormat,
    flattenPath,
    lines,
    matchingValue,
    name,
    outputDir,
  },
} = CONFIG;

const csv = new Command()
  .command(command)
  .description(description)
  .option(parseTuple(file))
  .option(parseTuple(files))
  .option(parseTuple(fileFormat))

  .option(parseTuple(concatColumns))

  .option(parseTuple(matchingValue))
  .option(parseTuple(flattenPath))

  .option(parseTuple(lines))
  .option(parseTuple(name))

  .option(parseTuple(outputDir))
  .option(parseTuple(debug))

  .action((action: action, options) => {
    const {
      concatColumns,
      debug,
      file,
      files,
      fileFormat,
      flattenPath,
      lines,
      matchingValue,
      name,
      outputDir,
    } = options;

    switch (action) {
      case 'concat':
        return concatService({
          files,
          concatColumns,
          matchingValue,
          outputDir,
          debug,
        });
      case 'flatten':
        // TODO update outputFile to accept outputDir
        return extractService({
          filePath: file,
          columns: concatColumns,
          pToExtract: flattenPath,
          pToInsert: '',
          valueToInsert: '',
          outputFile: outputDir,
          outputType: fileFormat,
        });
      case 'split':
        return splitFile(file, lines, name);
      default:
        throw new Error();
    }
  });

export default csv;
