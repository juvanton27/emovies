import { Injectable, MessageEvent } from '@nestjs/common';
import * as winston from 'winston';
import * as fs from 'fs';
import { ConfigService } from '@nestjs/config';
import { BehaviorSubject } from 'rxjs';


@Injectable()
export class LoggerService {
  private logger: winston.Logger;
  private readonly logDir: string;

  private log = new BehaviorSubject<MessageEvent>({
    data: {
      message: undefined,
      id: undefined,
      title: undefined,
      posterPath: undefined,
      stop: undefined,
      refresh: undefined
    }
  });
  public onCurrentLog = this.log.asObservable();

  constructor(
    private readonly configService: ConfigService
  ) {
    this.logDir = configService.get<string>('directory.logs');
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
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

  getLastLog(): MessageEvent {
    return this.log.value;
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
      tailable: true
    });
  }

  addTransport(transport: winston.transport) {
    this.logger.add(transport);
  }

  removeTransport(transport: winston.transport) {
    this.logger.remove(transport);
  }

  verbose(message: string, id?: number, title?: string, posterPath?: string, stop?: boolean, refresh?: boolean) {
    let value = this.log.value;
    value.data['message'] = message;
    value.data['stop'] = false;
    value.data['refresh'] = false;
    if (this.logger.transports.length > 1) {
      if (id) value.data['id'] = `${id}`;
      if (title) value.data['title'] = title;
      if (posterPath) value.data['posterPath'] = posterPath;
      if (stop) value.data['stop'] = stop ? 1 : 0;
      if (refresh) value.data['refresh'] = refresh ? 1 : 0;
      this.log.next(value);
    } else {
      this.log.next(value);
    }
    this.logger.info(message);
  }
}
