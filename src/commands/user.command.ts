import { Command } from 'commander';
import { getUser as getUserService } from '../services/user/get.service';
import {
  importUser as importUserService,
  deleteUsers as deleteUsersService,
  validateUsers as validateUsersService,
} from '../services/user';
import { parseTuple } from '../utils/helpers';
import { bootstrap } from '../utils/bootstrap';

type action = 'get' | 'update' | 'delete' | 'validate' | 'import';
type CONFIG = {
  command: string;
  description: string;
  options: {
    userId: string;
    userEmail: string;
    includes: 'all' | 'none';
    debug: boolean;
    dryRun: boolean;
    file: string;
    fileFormat: 'csv' | 'json';
    outputDir: string;
    validateBy: 'userId' | 'emailId';
  };
};

const CONFIG = {
  command: 'user <action>',
  description: 'Get | Update | Delete | validate, users',
  options: {
    userId: ['-id, --userId <id>', 'get user details by userId'],
    userEmail: ['-e, --userEmail <email>', 'get user details by emailId'],
    includes: [
      '-in, --includes <values>',
      'Includes information from the user separated by ",". Type: String',
    ],

    file: ['-f, --file <path> ', ' STRING: file name path'],
    fileFormat: ['-ff, --fileFormat <format> ', ' STRING: file format to read'],

    outputDir: ['-o, --outputDir <path>', 'STRING: Value path to output Directory for reports'],

    property: ['-p, --property <property> ', ' STRING: Property or Column to get userId'],
    validateBy: ['-by, --validateBy', ' STRING:'],

    debug: ['-d, --debug', 'output extra debugging'],
    dryRun: ['-dry, --dryRun', 'Perform a dry run'],
  },
};

const {
  command,
  description,
  options: { userId, userEmail, includes, debug, dryRun, file, fileFormat, outputDir, validateBy },
} = CONFIG;

const user = new Command()
  .command(command)
  .description(description)

  .option(parseTuple(userId))
  .option(parseTuple(userEmail))

  .option(parseTuple(file))
  .option(parseTuple(fileFormat))

  .option(parseTuple(outputDir))

  .option(parseTuple(validateBy))
  .option(parseTuple(includes))
  .option(parseTuple(debug))
  .option(parseTuple(dryRun))

  .action(async (action: action, options: CONFIG['options']) => {
    await bootstrap();

    const { userId, userEmail, includes, debug, dryRun, file, fileFormat, outputDir, validateBy } =
      options;

    switch (action) {
      case 'get':
        return getUserService({
          userId,
          userEmail,
          includes,
          outputDir,
          fileFormat,
          debug,
        });
      case 'import':
        return importUserService({ file, outputDir });
      case 'delete':
        return deleteUsersService({
          userId,
          userEmail,
          file,
          fileFormat,
          outputDir,
          debug,
          dryRun,
        });
      case 'validate':
        return validateUsersService({
          file,
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
        throw new Error('Action must be get | update | delete | validate | import');
    }
  });

export default user;
