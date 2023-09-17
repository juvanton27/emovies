import { Injectable } from '@nestjs/common';
import * as winston from 'winston';
import * as fs from 'fs';
import { ConfigService } from '@nestjs/config';
import { sse } from '../../app.controller';

@Injectable()
export class LoggerService {
  private logger: winston.Logger;
  private readonly logDir: string;

  constructor(
    private readonly configService: ConfigService
  ) {
    this.logDir = configService.get<string>('directory.logs');
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, {recursive: true});
    }

    this.logger = winston.createLogger({
      level: 'verbose', 
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => {
          return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
        }),
      ), 
      transports: [
        new winston.transports.Console(),
      ],
    });
  }
  
  createFileTransport(id: number) {
    return new winston.transports.File({
      filename: `${this.logDir}/${id}.log`,
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => {
          return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
        }),
      ), 
    });
  }
  
  addTransport(transport: winston.transport) {
    this.logger.add(transport);
  }

  removeTransport(transport: winston.transport) {
    this.logger.remove(transport);
  }

  verbose(message: string) {
    if (this.logger.transports.length > 1) sse.next({data: {message}});
    this.logger.info(message);
  }
}
