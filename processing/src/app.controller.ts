import { Controller, Get, Inject, MessageEvent, Sse } from '@nestjs/common';
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
  generateVideo(): Observable<any> {
    return this.appService.generateVideo();
  }

  @Sse('sse')
  sse(): Observable<MessageEvent> {
    // return interval(5000).pipe(
    //   tap(console.log),
    //   map(n => ({
    //     data: { 
    //       message: `message${n}`,
    //       id: `id${n}`,
    //       title: `type${n}`,
    //       stop: 1
    //     },
    //   }))
    // )
    return this.logger.onCurrentLog;
  }

  @Get('lastValue')
  sseLastValue(): Observable<MessageEvent> {
    return of(this.logger.getLastLog())
  }
}
