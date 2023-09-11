import { Controller, Get } from '@nestjs/common';
import { Observable } from 'rxjs';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService
  ) { }

  @Get()
  getHello(): Observable<any> {
    return this.appService.generateVideo();
  }
}
