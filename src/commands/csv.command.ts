import { Command } from 'commander';
import { parseTuple } from '../utils/helpers';
import { concatService } from '../services/csv/concat.service';
import { extractService } from '../services/csv/extract.service';
import { splitFile } from '../services/csv/split.service';

const METADATA = {
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

    identifier: ['-i, --identifier <value>', 'STRING: Value to be present for each row to be concatenated'],
    flattenPath: ['-pe, --flattenPath <path>', 'STRING: <Key>.<Key>.<key> -> <Value> '],

    lines: ['-l, --lines <number>', 'Number of lines to split'],
    name: ['-n, --name <newName>', 'new Name for split File'],

    outputDir: ['-o, --outputDir <path>', 'STRING: Value path to output file'],
  },
};

type action = 'contact' | 'flatten' | 'split';

const {
  command,
  description,
  options: { file, files, fileFormat, concatColumns, identifier, outputDir, lines, name, flattenPath },
} = METADATA;

const csv = new Command()
  .command(command)
  .description(description)
  .option(parseTuple(file))
  .option(parseTuple(files))
  .option(parseTuple(fileFormat))

  .option(parseTuple(concatColumns))

  .option(parseTuple(identifier))
  .option(parseTuple(flattenPath))

  .option(parseTuple(lines))
  .option(parseTuple(name))

  .option(parseTuple(outputDir))

  .action((action: action, options) => {
    const { file, files, fileFormat, concatColumns, identifier, outputDir, lines, name, flattenPath } = options;
    switch (action) {
      case 'contact':
        // TODO update outputFile to accept outputDir
        return concatService({ filePaths: files, columnsToConcat: concatColumns, identifier, outputFile: outputDir });
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
        // TODO refactor
        if (lines && file && name) return splitFile(file, lines, name);
        if (file && name) return splitFile(file, lines, name);
        if (file && lines) return splitFile(file, lines, name);
        if (file) return splitFile(file);
        if (!file) throw new Error('Bro, you need to add a filepath');
      default:
        break;
    }
  });

export default csv;
