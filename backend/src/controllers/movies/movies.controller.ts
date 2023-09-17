import { Body, Controller, Get, Query } from '@nestjs/common';
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
  getAll(@Query('pageSize') pageSize: number, @Query('skip') skip: number): Observable<SearchResult<Movie>> {
    return this.moviesService.getAll(pageSize, skip);
  }
}
