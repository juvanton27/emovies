import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as fs from 'fs';
import configuration from '../config/configuration';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MovieDbo } from './dbo/movie.dbo';
import { MoviesService } from './services/movies/movies.service';
import { ScheduleModule } from '@nestjs/schedule';
import { LoggerService } from './services/logger/logger.service';
import { AiService } from './services/ai/ai.service';
import { ProcessingService } from './services/processing/processing.service';


const detectEnvFile = (): string => {
  if (!process.env.ENV) {
    throw new Error('No environment variable found: ENV');
  }

  const path = `config/${process.env.ENV}.env`;
  if (!fs.existsSync(path)) {
    throw new Error(`The environment file doesn\'t exist: ${path}`);
  }

  return path;
};

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: detectEnvFile(),
      load: [configuration],
      isGlobal: true
    }),
    HttpModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('db.host'),
        port: configService.get<number>('db.port'),
        username: configService.get<string>('db.username'),
        password: configService.get<string>('db.password'),
        database: configService.get<string>('db.name'),
        entities: [MovieDbo],
        synchronize: true,
      })
    }),
    TypeOrmModule.forFeature([MovieDbo]),
    ScheduleModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [AppService, AiService, MoviesService, ProcessingService, LoggerService],
})
export class AppModule {}
