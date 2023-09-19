import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Observable, catchError, concatMap, map, of, tap, throwError } from 'rxjs';
import { MovieTMDBDbo } from './dbo/movie.tmdb.dbo';
import { MovieMapper } from './mappers/movies.mapper';
import { Emotion } from './model/emotion.type';
import { Movie } from './model/movie.model';
import { AiService } from './services/ai/ai.service';
import { LoggerService } from './services/logger/logger.service';
import { MoviesService } from './services/movies/movies.service';
import { ProcessingService } from './services/processing/processing.service';

@Injectable()
export class AppService {
  constructor(
    private readonly moviesService: MoviesService,
    private readonly aiService: AiService,
    private readonly processingService: ProcessingService,
    @Inject(LoggerService) private logger: LoggerService,
  ) { }

  @Cron(CronExpression.EVERY_DAY_AT_NOON)
  generateVideo(): Observable<any> {
    return this.moviesService.findTrendingMovie().pipe(
      concatMap((tmdbDbo: MovieTMDBDbo) => {
        const fileTransport = this.logger.createFileTransport(tmdbDbo.id);
        this.logger.addTransport(fileTransport);
        this.logger.verbose(`Working with movie "${tmdbDbo.title}" !`, tmdbDbo.id, tmdbDbo.title, tmdbDbo.poster_path, false);

        return this.aiService.findEmotionFromSummary(tmdbDbo.id, tmdbDbo.overview).pipe(
          concatMap((emotion: Emotion) => this.aiService.rephraseSummary(tmdbDbo.id, tmdbDbo.overview).pipe(
            map((summary: string) => MovieMapper.fromTMDBDbo(tmdbDbo, emotion, summary)),
          )),
          concatMap((movie: Movie) => {
            return this.moviesService.create(movie).pipe(
              catchError(err => {
                if (err instanceof BadRequestException) {
                  this.logger.verbose(`Film with id ${movie.id} created`, tmdbDbo.id, tmdbDbo.title, tmdbDbo.poster_path, false, true)
                  return of(undefined);
                }
                return throwError(() => err);
              }),
              concatMap(() => {
                const summary = this.aiService.prepareTextFromTemplate(movie);
                return this.aiService.textToSpeech(summary, `${movie.id}.wav`);
              }),
              concatMap((fullpath: string) => this.aiService.speechToVideo(fullpath)),
              concatMap(() => this.moviesService.downloadPoster(movie)),
              concatMap(() => this.processingService.mountVideo(movie)),
              concatMap((fullpath: string) => this.processingService.createVideoTitleByEmotion(movie.emotion).pipe(
                concatMap((title: string) => this.processingService.uploadOnYouTube(title, movie.overview, fullpath)),
              )),
              concatMap(() => this.moviesService.setUploaded(movie.id, true)),
              tap(() => {
                this.logger.verbose(`Movie "${movie.title}" succefully added !`, undefined, undefined, undefined, true, true);
                this.logger.removeTransport(fileTransport)
              }),
              catchError((err) => {
                this.logger.verbose(err.message, undefined, undefined, undefined, true);
                this.logger.removeTransport(fileTransport)
                return throwError(() => err);
              }),
            );
          }),
        );
      }),
    );
  }
}
