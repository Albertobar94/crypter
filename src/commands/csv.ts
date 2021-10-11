import { Command } from 'commander';
import { parseDescription, parseFlags } from '../common/helpers';
import { CsvAction, CsvActionType, CsvConfig } from '../common/types';
import { concatService, flattenService, splitFileService } from '../services/csv';
import { bootstrap } from '../utils/bootstrap';

/*----------  Configuration  ----------*/

const config = {
  command: 'csv <action>',
  description: `
  Actions: concat | flatten | split

  ** Minimum Requirements to run **
  - concat: You must provide at least 2 files, "file1,file2", and a --matchingValue 
    which must be present in both file the same exact name column.
  - flatten: You must provide a file and a flattenPath for a value in a csv column which is in JSON format.
  - split: You must provide the file you want to split.

  examples:
  - crypter csv split -l 500 -f './file.csv' -n "splitted" -o "./"
    Crypter will split the file -f into files of 500 lines and add the name "splitted" to each new file created.

  - crypter csv concat -f "./file.csv,./_files/file.csv" -c "emailId,userId,accountId" -M "emailId" -o "./_files"
    Crypter will concat both files and create a new file that has the specified columns in -c and will match the rows by 
    the emailId value that must be present in both files and output the new file in the value provided to -o
  `,
  options: {
    file: ['-f, --file <path> ', 'File path to read.'],
    fileFormat: ['-F, --fileFormat <format> ', 'Format of the file to read.'],
    columns: [
      '-c, --columns <columns>',
      'Names for columns to be in the new file, separated by ",".',
    ],
    matchingValue: [
      '-M, --matchingValue <value>',
      'Value to be present in both rows for concatenation.',
    ],
    flattenPathToValue: [
      '-V, --flattenPathToValue <path>',
      'Object like access path to the value we want to flatten ->> {Key}.{Key}...{Value}',
    ],
    lines: ['-l, --lines <number>', 'Number of lines to split.'],
    name: ['-n, --name <newName>', 'Name for the output file.'],
    outputDir: ['-o, --outputDir <path>', 'Path to the output directory.'],
    debug: ['-d, --debug', 'Debug'],
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
} = config;

/*----------  Command  ----------*/

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

  .action(async (action: CsvActionType, options: CsvConfig['options']) => {
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
      case CsvAction.concat:
        return concatService({
          file,
          concatColumns: columns,
          matchingValue,
          outputDir,
          name,
          debug,
        });
      case CsvAction.flatten:
        return flattenService({
          file,
          columns,
          flattenPathToValue,
          outputDir,
          name,
          fileFormat,
          debug,
        });
      case CsvAction.split:
        return splitFileService({ file, lines, name, outputDir, debug });
      default:
        throw new Error('Action must be either: split | concat | flatten');
    }
  });

export default csv;
