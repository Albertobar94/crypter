import { Command } from 'commander';
import { parseTuple } from '../utils/helpers';
import { concatService } from '../services/csv/concat.service';
import { extractService } from '../services/csv/extract.service';
import { splitFile } from '../services/csv/split.service';
import { bootstrap } from '../utils/bootstrap';

type action = 'concat' | 'flatten' | 'split';

const CONFIG = {
  command: 'csv <action>',
  description: ' Concat information in the same rows for CSV files...',
  options: {
    files: ['-fs, --files <paths>', 'File names paths separated by ",". Type: String'],
    file: ['-f, --file <path> ', 'File name. Type: String'],
    fileFormat: ['-ff, --fileFormat <format> ', 'File format to Read and Parse file. Type: String'],
    concatColumns: [
      '-c, --concatColumns <columns>',
      'Names of columns to concatenate values in the same row separated by ",". Type: String',
    ],
    matchingValue: [
      '-mv, --matchingValue <value>',
      'Value to be present in both rows for concatenation. Type: String',
    ],
    flattenPath: [
      '-pe, --flattenPath <path>',
      '<Key>.<Key>.<key>...<Value>. Type: String, Object like access path to value',
    ],
    lines: ['-l, --lines <number>', 'Number of lines to split. Type: Number'],
    name: ['-n, --name <newName>', 'Name for output file. Type: String'],
    outputDir: ['-o, --outputDir <path>', 'Path to output directory. Type: String'],
    debug: ['-d, --debug', 'Debug process. Type: Boolean, Default: false'],
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

  .action(async (action: action, options) => {
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

    await bootstrap();

    switch (action) {
      case 'concat':
        return concatService({
          files,
          concatColumns,
          matchingValue,
          outputDir,
          name,
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
