import { Injectable } from '@nestjs/common';
import { Observable, concatMap, map } from 'rxjs';
import { Movie } from './model/movie.model';
import { AiService } from './services/ai/ai.service';
import { MoviesService } from './services/movies/movies.service';
import { ProcessingService } from './services/processing/processing.service';

@Injectable()
export class AppService {
  constructor(
    private readonly moviesService: MoviesService,
    private readonly aiService: AiService,
    private readonly processingService: ProcessingService,
  ) { }

  generateVideo(): Observable<any> {
    return this.moviesService.findTrendingMovie().pipe(
      concatMap((movie: Movie) => {
        const summary = this.aiService.prepareTextFromTemplate(movie);
        return this.aiService.textToSpeech(summary, `${movie.id}.wav`).pipe(
          concatMap((fullpath: string) => this.aiService.speechToVideo(fullpath)),
          concatMap(() => this.moviesService.downloadPoster(movie)),
          concatMap(() => this.processingService.mountVideo(movie)),
          concatMap((fullpath: string) => this.processingService.createVideoTitleByEmotion(movie.emotion).pipe(
            concatMap((title: string) => this.processingService.uploadOnYouTube(title, movie.overview, fullpath)),
          )),
          concatMap(() => this.moviesService.create(movie)),
        );
      }),
    );
  }
}
