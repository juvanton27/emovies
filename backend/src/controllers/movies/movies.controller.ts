import { Body, Controller, Get, NotFoundException, Param, Patch, Query, StreamableFile } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Movie } from '../../model/movie.model';
import { MoviesService } from '../../services/movies/movies.service';
import { SearchResult } from '../../model/search-result.model';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';

@Controller('api/movies')
export class MoviesController {
  private readonly resultDir: string;

  constructor(
    private readonly moviesService: MoviesService,
    private readonly configService: ConfigService
  ) {
    this.resultDir = configService.get<string>('directory.results');
  }

  @Get()
  getAll(
    @Query('pageSize') pageSize: string, 
    @Query('skip') skip: string,
    @Query('uploaded') uploaded: string,
  ): Observable<SearchResult<Movie>> {
    let filter: any = {};
    if (uploaded) filter['uploaded'] = uploaded === 'true';
    return this.moviesService.getAll(+pageSize, +skip, filter);
  }

  @Get(':id')
  getById(@Param('id') id: string): Observable<Movie> {
    return this.moviesService.getById(+id);
  }

  @Get('/result/:id')
  getResult(@Param('id') id: string) {
    const filePath: string = `${this.resultDir}/${id}.mp4`;
    if (!fs.existsSync(filePath)) throw new NotFoundException(`No file found for movie ${id}`);
    const file = fs.createReadStream(filePath);
    return new StreamableFile(file);
  }
}
