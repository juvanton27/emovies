import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Observable, concatMap, from, map, of, tap } from 'rxjs';
import { FindOptionsWhere, Like, Repository } from 'typeorm';
import { MovieDbo } from '../../dbo/movie.dbo';
import { MovieMapper } from '../../mappers/movies.mapper';
import { Movie } from '../../model/movie.model';
import { SearchResult } from '../../model/search-result.model';
import { MovieTMDBDbo } from '../../dbo/movie.tmdb.dbo';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class MoviesService {
  private readonly tmdbUrl: string = 'https://api.themoviedb.org/3/search/movie';
  private readonly headers: any;

  constructor(
    @InjectRepository(MovieDbo) private readonly moviesRepo: Repository<MovieDbo>,
    private readonly configService: ConfigService,
    private readonly axios: HttpService,
  ) {
    this.headers = {
      accept: 'application/json',
      Authorization: `Bearer ${configService.get<string>('tmdb.token')}`,
    };
  }

  getAll(pageSize: number, skip: number, filter?: any): Observable<SearchResult<Movie>> {
    let where: FindOptionsWhere<MovieDbo> = {};
    if (filter?.uploaded !== undefined) where['uploaded'] = filter.uploaded;
    if (filter?.title !== undefined) where['title'] = Like(`%${filter.title?.toLowerCase()}%`);
    if (filter?.emotion !== undefined) where['emotion'] = filter.emotion;
    return from(this.moviesRepo.findAndCount({ where, take: pageSize, skip })).pipe(
      map(([dbos, totalCount]) => ({
        totalCount,
        pageSize,
        skip,
        result: dbos.map(dbo => MovieMapper.fromDbo(dbo)),
      }))
    )
  }

  getAllFromTMDB(filter: any): Observable<MovieTMDBDbo[]> {
    let title: string;
    if (filter?.title) {
      title = filter.title;
      const url = `${this.tmdbUrl}?query=${title}`;
      return this.axios.get(url, {headers: this.headers}).pipe(
        map(({data}: {data: {results: MovieTMDBDbo[]}}) => data.results),
      );
    } else return of([]);
  }

  getById(id: number): Observable<Movie> {
    return from(this.moviesRepo.findOneBy({ id })).pipe(
      map((dbo: MovieDbo) => MovieMapper.fromDbo(dbo)),
    );
  }
}
