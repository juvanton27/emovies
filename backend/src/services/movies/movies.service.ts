import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Observable, from, map } from 'rxjs';
import { FindOptionsWhere, Repository } from 'typeorm';
import { MovieDbo } from '../../dbo/movie.dbo';
import { MovieMapper } from '../../mappers/movies.mapper';
import { Movie } from '../../model/movie.model';
import { SearchResult } from '../../model/search-result.model';

@Injectable()
export class MoviesService {

  constructor(
    @InjectRepository(MovieDbo) private readonly moviesRepo: Repository<MovieDbo>,
  ) { }

  getAll(pageSize: number, skip: number, filter?: any): Observable<SearchResult<Movie>> {
    let where: FindOptionsWhere<MovieDbo> = {};
    if (filter?.uploaded !== undefined) where['uploaded'] = filter.uploaded;
    return from(this.moviesRepo.findAndCount({where, take: pageSize, skip})).pipe(
      map(([dbos, totalCount]) => ({
        totalCount,
        pageSize,
        skip,
        result: dbos.map(dbo => MovieMapper.fromDbo(dbo)),
      }))
    )
  }

  getById(id: number): Observable<Movie> {
    return from(this.moviesRepo.findOneBy({id})).pipe(
      map((dbo: MovieDbo) => MovieMapper.fromDbo(dbo)),
    );
  }
}
