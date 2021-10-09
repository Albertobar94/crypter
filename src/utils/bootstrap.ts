import figlet from 'figlet';
import consoleClear from 'console-clear';
import { startLogger, succeedLogger, createLogger } from './logging';

const haltTime = 1000;
const keepHistory = true;
const instance = createLogger();

const generateAsciiArt = async (): Promise<unknown> => {
  return new Promise((resolve, reject) => {
    figlet.text(
      'CRYPTER',
      { font: 'ANSI Shadow', horizontalLayout: 'default', verticalLayout: 'default' },
      function (err, data) {
        if (err) {
          console.log('Something went wrong...');
          console.dir(err);
          reject(err);
        }
        resolve(data);
      },
    );
  });
};

export const halt = async (ms: number): Promise<unknown> => {
  return new Promise(resolve => setTimeout(resolve, ms ?? 10));
};

export const bootstrap = async (): Promise<void> => {
  consoleClear(keepHistory);
  console.log(await generateAsciiArt());
  startLogger({ instance, name: 'Bootstrap', options: { text: 'Starting command...' } });
  await halt(haltTime);
  succeedLogger({ instance, name: 'Bootstrap', options: { text: "Welcome! Let's work..." } });
};
