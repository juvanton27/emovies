import { Controller, Get, MessageEvent, Sse } from '@nestjs/common';
import { BehaviorSubject, Observable } from 'rxjs';
import { AppService } from './app.service';

export const sse = new BehaviorSubject<MessageEvent>({ data: undefined })
const onCurrentSse = sse.asObservable();

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  generateVideo(): Observable<any> {
    return this.appService.generateVideo();
  }

  @Sse('sse')
  sse(): Observable<MessageEvent> {
    return onCurrentSse;
  }
}
