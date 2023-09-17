import { Body, Controller, Get, Patch, Query } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Movie } from '../../model/movie.model';
import { MoviesService } from '../../services/movies/movies.service';
import { SearchResult } from '../../model/search-result.model';

@Controller('api/movies')
export class MoviesController {

  constructor(
    private readonly moviesService: MoviesService
  ) { }

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
}
