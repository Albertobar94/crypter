import { Command } from 'commander';
import dotenv from 'dotenv';

dotenv.config();

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

// const showEnv = (envId: string) => {
//   console.log(process.env[envId]);
// };

type action = 'get';

const getEnv = new Command()
  .command('env <action>')
  .description('get, environment variables')
  .action((action: action) => {
    switch (action) {
      default:
        return showAllEnvVars();
    }
  });

export default getEnv;
