import { HttpService } from '@nestjs/axios';
import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { Observable, concatMap, from, map, of, toArray } from 'rxjs';
import { Repository } from 'typeorm';
import { MovieDbo } from '../../dbo/movie.dbo';
import { MovieTMDBDbo } from '../../dbo/movie.tmdb.dbo';
import { MovieMapper } from '../../mappers/movies.mapper';
import { Emotion } from '../../model/emotion.type';
import { Movie } from '../../model/movie.model';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class MoviesService {

  private readonly tmdbUrl: string = 'https://api.themoviedb.org/3/movie';
  private readonly tmdbImageUrl: string = 'https://image.tmdb.org/t/p/original';
  private readonly headers: any;
  private readonly dataDir: string;

  constructor(
    private readonly axios: HttpService,
    private readonly configService: ConfigService,
    @Inject(LoggerService) private logger: LoggerService,
    @InjectRepository(MovieDbo) private readonly moviesRepo: Repository<MovieDbo>,
  ) {
    this.headers = {
      accept: 'application/json',
      Authorization: `Bearer ${configService.get<string>('tmdb.token')}`,
    };
    this.dataDir = configService.get<string>('directory.data');
  }

  /**
   * Finds a movie for video purpose
   * @returns the movie to present
   */
  findTrendingMovie(): Observable<MovieTMDBDbo> {
    const url = `${this.tmdbUrl}/popular`;
    return this.axios.get(url, {headers: this.headers}).pipe(
      concatMap(({data}: {data: {results: MovieTMDBDbo[]}}) => from(data.results)),
      concatMap((movie: MovieTMDBDbo) => {
        return from(this.moviesRepo.findOneBy({id: movie.id, uploaded: true})).pipe(
          map((dbo: MovieDbo) => !dbo ? movie : undefined)
        );
      }),
      toArray(),
      map((movies: MovieTMDBDbo[]) => {
        movies = movies.filter(m => !!m);
        if (!movies || movies?.length === 0) throw new Error('No movies found');
        return movies[0];
      }),
    );
  }

  downloadPoster(movie: Movie): Observable<string> {
    const posterExt = path.extname(movie.posterPath);
    const filepath = `${this.dataDir}/image/${movie.id}${posterExt}`;
    if (fs.existsSync(filepath)) {
      this.logger.verbose(`Cover "${filepath}" already downloaded. Just retreiving it ...`);
      return of(filepath);
    }
    const url = `${this.tmdbImageUrl}${movie.posterPath}`;   
    return this.axios.get(url, {responseType: 'arraybuffer'}).pipe(
      map(({data}) => {
        fs.writeFileSync(filepath, data);
        this.logger.verbose(`Poster saved to "${filepath}"`);
        return filepath;
      }),
    );
  }

  create(movie: Movie): Observable<Movie> {
    this.logger.verbose(`Creating movie "${movie.title}"`);
    return from(this.moviesRepo.findOneBy({id: movie.id})).pipe(
      concatMap((dbo: MovieDbo) => {
        if (dbo) throw new BadRequestException(`Movie "${dbo.title}" already exists !`);
        return from(this.moviesRepo.save(MovieMapper.toDbo(movie)));
      }),
      map((dbo: MovieDbo) => MovieMapper.fromDbo(dbo)),
    )
  }

  countByEmotion(emotion: Emotion): Observable<number> {
    return from(this.moviesRepo.countBy({emotion}));
  }

  setUploaded(id: number, uploaded: boolean): Observable<Movie> {
    return from(this.moviesRepo.findOneBy({id})).pipe(
      concatMap((dbo: MovieDbo) => {
        if (!dbo) throw new NotFoundException(`No movie with id ${id} found`);
        return from(this.moviesRepo.save({id, uploaded}));
      }),
      map((dbo: MovieDbo) => MovieMapper.fromDbo(dbo)),
    );
  }
}
