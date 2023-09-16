import { NestFactory } from '@nestjs/core';
import { exec } from 'child_process';
import * as fs from 'fs';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

const logger = new Logger('Main');

// Mandatory packages
const pip: string[] = ['auto_subtitle', 'openai-whisper']; // TO DO: à peaufiner
const apt: string[] = ['ffmpeg', 'imagemagick',]; // TO DO: à peaufiner

async function bootstrap() {
  try {
    await checkDependencies();
  } catch (e) {
    console.error(`Dependencies missing : ${e}`);
    process.exit(1);
  }
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}

function checkDependencies() {
  logger.verbose('Checking dependencies ...');
  return new Promise<void>((resolve, reject) => {
    const errors: Error[] = [];
    if (!fs.existsSync('data/utils/youtube-bot')) errors.push(new Error('"youtube-bot" folder missing in "data/utils"'));
    if (!fs.existsSync('data/utils/SadTalker')) errors.push(new Error('"SadTalker" folder missing in "data/utils"'));
    const checkPip = () => {
      const promises = pip.map(p => {
        return new Promise<void>((pipResolve, pipReject) => {
          exec(`pip3 show ${p}`, (error, stdout, stderr) => {
            if (error || stderr) {
              errors.push(new Error(`pip package "${p}" is not installed : ${error?.message ?? stderr}`));
              pipReject(errors); // Rejeter avec les erreurs ici
              return;
            }
            pipResolve();
          });
        });
      });
      return Promise.all(promises);
    };

    const checkApt = () => {
      const promises = apt.map(p => {
        return new Promise<void>((aptResolve, aptReject) => {
          exec(`dpkg -l | grep ${p}`, (error, stdout, stderr) => {
            if (error || stderr || stdout.trim() === '') {
              errors.push(new Error(`apt package "${p}" is not installed : ${error?.message ?? stderr ?? 'not found in apt list'}`));
              aptReject(errors); // Rejeter avec les erreurs ici
              return;
            }
            aptResolve();
          });
        });
      });
      return Promise.all(promises);
    };

    checkPip()
      .then(() => checkApt())
      .then(() => {
        if (errors.length > 0) {
          reject(errors);
        } else {
          resolve();
        }
      })
      .catch(error => {
        reject(error);
      });
  });
}


bootstrap();
