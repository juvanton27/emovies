import { Controller, Get, NotFoundException, Param, StreamableFile } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import * as fs from 'fs';

@Controller('api/logger')
export class LoggerController {
  private logDir: string;

  constructor(
    private readonly configService: ConfigService,
  ) {
    this.logDir = configService.get<string>('directory.logs');
  }
  
  @Get(':id')
  getById(@Param('id') id: string) {
    const filePath: string = `${this.logDir}/${id}.log`;
    if (!fs.existsSync(filePath)) throw new NotFoundException(`No file found for movie ${id}`);
    const file = fs.createReadStream(filePath);
    return new StreamableFile(file);
  }
}
