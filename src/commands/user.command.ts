import { Command } from 'commander';
import { getUser as getUserService } from '../services/user/get.service';
import { importUser as importUserService } from '../services/user/import.service';
import { deleteUsers as deleteUsersService } from '../services/user/delete.service';
import { validateUsers as validateUsersService } from '../services/user/validate.service';
import { parseTuple } from '../utils/helpers';
import { bootstrap } from '../utils/bootstrap';

const METADATA = {
  command: 'user <action>',
  description: 'Get, Update, Delete a single user',
  options: {
    userId: ['-id, --userId <id>', 'get user details by userId'],
    userEmail: ['-e, --userEmail <email>', 'get user details by emailId'],

    file: ['-f, --file <path> ', ' STRING: file name path'],
    fileFormat: ['-ff, --fileFormat <format> ', ' STRING: file format to read'],

    // TODO deprecate
    outputFile: ['-of, --outputFile <path> ', ' STRING: Output folder Path'],
    outputDir: ['-o, --outputDir <path>', 'STRING: Value path to output Directory for reports'],

    property: ['-p, --property <property> ', ' STRING: Property or Column to get userId'],
    validateBy: ['-by, --validateBy', ' STRING:'],

    debug: ['-d, --debug', 'output extra debugging'],
  },
};

type action = 'get' | 'update' | 'delete' | 'validate' | 'import';

const {
  command,
  description,
  options: { userId, userEmail, debug, file, fileFormat, outputFile, outputDir, validateBy },
} = METADATA;

const user = new Command()
  .command(command)
  .description(description)

  .option(parseTuple(userId))
  .option(parseTuple(userEmail))

  .option(parseTuple(file))
  .option(parseTuple(fileFormat))

  .option(parseTuple(outputFile))
  .option(parseTuple(outputDir))

  .option(parseTuple(validateBy))

  .option(parseTuple(debug))
  .action(async (action: action, options) => {
    await bootstrap();
    const { userId, userEmail, debug, file, fileFormat, outputFile, outputDir, validateBy } = options;

    switch (action) {
      case 'get':
        return getUserService({ userId, userEmail, outputDir, fileFormat, debug });
      case 'import':
        return importUserService({ filePath: file, outputDir });
      case 'delete':
        // return deleteUserService({ userId, outputPath, debug });
        return deleteUsersService({ filePath: file, fileFormat, outputPath: outputDir, debug });
      case 'validate':
        return validateUsersService({
          filePath: file,
          fileFormat,
          // TODO remove this
          property: '',
          outputPath: outputDir,
          debugLevel: debug,
          type: validateBy,
        });
      case 'update':
        break;
      default:
        break;
    }
  });

export default user;
