import figlet from 'figlet';
import consoleClear from 'console-clear';
import { startLogger, succeedLogger, createLogger } from './logging';

const generateAsciiArt = async () => {
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

export const halt = async (ms: number) => {
  return new Promise(resolve => setTimeout(resolve, ms ?? 10));
};

export const bootstrap = async () => {
  consoleClear(true);
  const instance = createLogger();
  console.log(await generateAsciiArt());
  startLogger({ instance, name: 'Bootstrap', options: { text: 'Starting command...' } });
  await halt(1500);
  succeedLogger({ instance, name: 'Bootstrap', options: { text: "Welcome! Let's work..." } });
};
