import { Command } from 'commander';
import { updateOrder } from '../services/orders/update.service';
import { parseTuple } from '../utils/helpers';

type CONFIG = {
  command: string;
  description: string;
  options: { file: string; fileFormat: 'csv' | 'json'; outputDir: string; debug: boolean };
};

const CONFIG = {
  command: 'orders <action>',
  description: 'update, information for a user order',
  options: {
    file: ['-f, --file <path> ', 'file path. Type: String'],
    fileFormat: ['-ff, --fileFormat <format> ', 'format to read file. Type: String'],
    outputDir: ['-o, --outputPath <path> ', 'Output directory. Type: String'],
    debug: ['-d, --debug', 'Type: Boolean'],
  },
};

const {
  command,
  description,
  options: { file, fileFormat, outputDir, debug },
} = CONFIG;

type action = 'update';

const updateOrderId = new Command()
  .command(command)
  .description(description)
  .option(parseTuple(file))
  .option(parseTuple(fileFormat))
  .option(parseTuple(outputDir))
  .option(parseTuple(debug))
  .action((action: action, options: CONFIG['options']) => {
    const { file, fileFormat, outputDir, debug } = options;
    switch (action) {
      default:
        return updateOrder({
          filePath: file,
          fileFormat,
          outputPath: outputDir,
          debugLevel: debug,
        });
    }
  });

export default updateOrderId;
