import { Command } from 'commander';
import dotenv from 'dotenv';
import { resolve } from 'path';
import { bootstrap } from '../utils/bootstrap';

dotenv.config({
  path: resolve(__dirname, '../../.env'),
});

const allEnvVars = {
  AUTH_TOKEN: process.env.AUTH_TOKEN,
  SEGMENT_ID: process.env.SEGMENT_ID,
  USER_SERVICE_HOST: process.env.USER_SERVICE_HOST,
  USER_ID: process.env.USER_ID,
  USER_EMAIL: process.env.USER_EMAIL,
};

const showAllEnvVars = () => {
  console.log(allEnvVars);
};

type action = 'get';

const getEnv = new Command()
  .command('env <action>')
  .description('get, environment variables')
  .action(async (action: action) => {
    await bootstrap();

    switch (action) {
      default:
        return showAllEnvVars();
    }
  });

export default getEnv;
