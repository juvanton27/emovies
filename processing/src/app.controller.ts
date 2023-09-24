import { Controller, Get, Inject, MessageEvent, Query, Sse } from '@nestjs/common';
import { Observable, interval, map, of, tap } from 'rxjs';
import { AppService } from './app.service';
import { LoggerService } from './services/logger/logger.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @Inject(LoggerService) private logger: LoggerService,
  ) { }

  @Get()
  generateVideo(
    @Query('id') id: string,
  ): Observable<any> {
    if (id && !isNaN(+id)) return this.appService.generateVideo(+id);
    return this.appService.generateVideo();
  }

  @Sse('sse')
  sse(): Observable<MessageEvent> {
    return this.logger.onCurrentLog;
  }

  @Get('lastValue')
  sseLastValue(): Observable<MessageEvent> {
    return of(this.logger.getLastLog())
  }
}
