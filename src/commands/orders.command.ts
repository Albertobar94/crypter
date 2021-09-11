import { Command } from 'commander';
import { updateOrder } from '../services/orders/update.service';
import { parseTuple } from '../utils/helpers';

const METADATA = {
  command: 'orders <action>',
  description: ' Extract information from a specific column as a JSON value' + '\n' + '\n',
  options: {
    file: ['-f, --file <path> ', ' STRING: file name path'],
    fileFormat: ['-ff, --fileFormat <format> ', ' STRING: file format to read'],
    outputDir: ['-o, --outputPath <path> ', ' STRING: Output folder Path'],
    debug: ['-d, --debug', ' BOOLEAN'],
  },
};

const {
  command,
  description,
  options: { file, fileFormat, outputDir, debug },
} = METADATA;

type action = 'update';

const updateOrderId = new Command()
  .command(command)
  .description(description)
  .option(parseTuple(file))
  .option(parseTuple(fileFormat))
  .option(parseTuple(outputDir))
  .option(parseTuple(debug))
  .action((action: action, options) => {
    const { file, fileFormat, outputDir, debug } = options;
    switch (action) {
      default:
        return updateOrder({ filePath: file, fileFormat, outputPath: outputDir, debugLevel: debug });
    }
  });

export default updateOrderId;
