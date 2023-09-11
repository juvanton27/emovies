import { Injectable } from '@nestjs/common';
import { Observable, concatMap } from 'rxjs';
import { Movie } from './model/movie.model';
import { AiService } from './services/ai/ai.service';
import { MoviesService } from './services/movies/movies.service';

@Injectable()
export class AppService {
  constructor(
    private readonly moviesService: MoviesService,
    private readonly aiService: AiService,
  ) { }

  generateVideo(): Observable<any> {
    // return this.moviesService.findTrendingMovie().pipe(
    //     concatMap((movie: Movie) => {
    //       const summary = this.aiService.prepareTextFromTemplate(movie);
    //       return this.aiService.textToSpeech(summary, `${movie.id}.wav`);
    //     }),
    //     concatMap((fullpath: string) => this.aiService.speechToVideo(fullpath)),
    // );
    return this.moviesService.downloadPoster({id: 615656, posterPath: '/4m1Au3YkjqsxF8iwQy0fPYSxE0h.jpg'} as Movie);
  }
}
