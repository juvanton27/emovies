import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Observable, concatMap, from, map, of, tap, toArray } from 'rxjs';
import { MetadataAlreadyExistsError, Repository } from 'typeorm';
import { MovieDbo } from '../../dbo/movie.dbo';
import { MovieTMDBDbo } from '../../dbo/movie.tmdb.dbo';
import { MovieMapper } from '../../mappers/movies.mapper';
import { Emotion } from '../../model/emotion.type';
import { Movie } from '../../model/movie.model';
import { AiService } from '../ai/ai.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class MoviesService {
  private readonly logger = new Logger(MoviesService.name)

  private readonly tmdbUrl: string = 'https://api.themoviedb.org/3/movie';
  private readonly tmdbImageUrl: string = 'https://image.tmdb.org/t/p/original';
  private readonly headers: any;

  constructor(
    private readonly axios: HttpService,
    @InjectRepository(MovieDbo) private readonly moviesRepo: Repository<MovieDbo>,
    private readonly configService: ConfigService,
    private readonly aiService: AiService
  ) {
    this.headers = {
      accept: 'application/json',
      Authorization: `Bearer ${configService.get<string>('tmdb.token')}`
    }
  }

  /**
   * Finds a movie for video purpose
   * @returns the movie to present
   */
  findTrendingMovie(): Observable<Movie> {
    const url = `${this.tmdbUrl}/popular`;
    return this.axios.get(url, {headers: this.headers}).pipe(
      concatMap(({data}: {data: {results: MovieTMDBDbo[]}}) => from(data.results)),
      concatMap((movie: MovieTMDBDbo) => {
        return from(this.moviesRepo.findOneBy({id: movie.id})).pipe(
          map((dbo: MovieDbo) => !dbo ? movie : undefined)
        );
      }),
      toArray(),
      concatMap((movies: MovieTMDBDbo[]) => {
        movies = movies.filter(m => !!m);
        if (!movies || movies?.length === 0) throw new Error('No movies found');
        this.logger.verbose(`Working with movie "${movies[0].title}" !`);
        return this.aiService.findEmotionFromSummary(movies[0].overview).pipe(
          concatMap((emotion: Emotion) => this.aiService.rephraseSummary(movies[0].overview).pipe(
            map((summary: string) => MovieMapper.fromTMDBDbo(movies[0], emotion, summary)),
          )),
        );
      }),
    );
  }

  downloadPoster(movie: Movie): Observable<string> {
    const posterExt = path.extname(movie.posterPath);
    const filepath = `data/image/${movie.id}${posterExt}`;
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
}
