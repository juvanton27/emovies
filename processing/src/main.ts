import { NestFactory } from '@nestjs/core';
import { exec } from 'child_process';
import * as fs from 'fs';
import { AppModule } from './app.module';
import { LoggerService } from './services/logger/logger.service';
import { ConfigService } from '@nestjs/config';

// Mandatory packages
const pip: string[] = ['auto_subtitle', 'openai-whisper', 'mycroft-mimic3-tts']; // TO DO: à peaufiner
const apt: string[] = ['ffmpeg', 'imagemagick',]; // TO DO: à peaufiner

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = app.get(LoggerService);
  const config = app.get(ConfigService);
  const shouldCheckDependencies = config.get<boolean>('options.checkDependencies');
  if (shouldCheckDependencies === true) {
    logger.verbose('Checking dependencies ...');
    try {
      await checkDependencies(logger);
    } catch (e) {
      console.error(`Dependencies missing : ${e}`);
      process.exit(1);
    }
  } else {
    logger.verbose('Skipping dependencies check ...');
  }
  await app.listen(config.get<string>('port'));
}

function checkDependencies(logger: LoggerService) {
  return new Promise<void>((resolve, reject) => {
    const errors: Error[] = [];
    if (!fs.existsSync('utils/youtube-bot')) errors.push(new Error('"youtube-bot" folder missing in "utils"'));
    if (!fs.existsSync('utils/SadTalker')) errors.push(new Error('"SadTalker" folder missing in "utils"'));
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
