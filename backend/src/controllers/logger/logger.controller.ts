import { Controller, Get, NotFoundException, Param, StreamableFile } from '@nestjs/common';

import * as fs from 'fs';

@Controller('api/logger')
export class LoggerController {
  
  @Get(':id')
  getById(@Param('id') id: string) {
    const logDir: string = 'logs';
    const filePath: string = `${logDir}/${id}.log`;
    if (!fs.existsSync(filePath)) throw new NotFoundException(`No file found for movie ${id}`);
    const file = fs.createReadStream(filePath);
    return new StreamableFile(file);
  }
}
