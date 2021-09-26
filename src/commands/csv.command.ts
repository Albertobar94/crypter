import { Command } from 'commander';
import { parseDescription, parseFlags } from '../utils/helpers';
import { concatService, flattenService, splitFileService } from '../services/csv';
import { bootstrap } from '../utils/bootstrap';

type action = 'concat' | 'flatten' | 'split';
type CONFIG = {
  command: string;
  description: string;
  options: {
    columns: string;
    debug: boolean;
    file: string;
    files: string;
    fileFormat: 'csv' | 'json';
    flattenPathToValue: string;
    lines: number;
    matchingValue: string;
    name: string;
    outputDir: string;
  };
};

const CONFIG = {
  command: 'csv <action>',
  description: 'concat | flatten | split, Csv files...',
  options: {
    file: ['-f, --file <path> ', 'File name.'],
    fileFormat: ['-F, --fileFormat <format> ', 'File format to Read and Parse file.'],
    columns: [
      '-c, --columns <columns>',
      'Names of columns to be in the new file, separated by ",".',
    ],
    matchingValue: [
      '-M, --matchingValue <value>',
      'Value to be present in both rows for concatenation.',
    ],
    flattenPathToValue: [
      '-V, --flattenPathToValue <path>',
      '<Key>.<Key>.<key>...<Value>., Object like access path to value',
    ],
    lines: ['-l, --lines <number>', 'Number of lines to split.'],
    name: ['-n, --name <newName>', 'Name for output file.'],
    outputDir: ['-o, --outputDir <path>', 'Path to output directory.'],
    debug: ['-d, --debug', 'Debug process.'],
  },
};

const {
  command,
  description,
  options: {
    columns,
    debug,
    file,
    fileFormat,
    flattenPathToValue,
    lines,
    matchingValue,
    name,
    outputDir,
  },
} = CONFIG;

const csv = new Command()
  .command(command)
  .description(description)
  .option(parseFlags(file), parseDescription(file))
  .option(parseFlags(fileFormat), parseDescription(fileFormat))
  .option(parseFlags(columns), parseDescription(columns))
  .option(parseFlags(matchingValue), parseDescription(matchingValue))
  .option(parseFlags(flattenPathToValue), parseDescription(flattenPathToValue))
  .option(parseFlags(lines), parseDescription(lines))
  .option(parseFlags(name), parseDescription(name))
  .option(parseFlags(outputDir), parseDescription(outputDir))
  .option(parseFlags(debug), parseDescription(debug))

  .action(async (action: action, options: CONFIG['options']) => {
    await bootstrap();

    const {
      columns,
      debug,
      file,
      fileFormat,
      flattenPathToValue,
      lines,
      matchingValue,
      name,
      outputDir,
    } = options;

    switch (action) {
      case 'concat':
        return concatService({
          file,
          concatColumns: columns,
          matchingValue,
          outputDir,
          name,
          debug,
        });
      case 'flatten':
        return flattenService({
          file,
          columns,
          flattenPathToValue,
          outputDir,
          name,
          fileFormat,
          debug,
        });
      case 'split':
        return splitFileService({ file, lines, name, outputDir, debug });
      default:
        throw new Error('Action must be either: split | concat | flatten');
    }
  });

export default csv;
