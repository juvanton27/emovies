import { MovieTMDBDbo } from "../dbo/movie.tmdb.dbo";
import { Emotion } from "../model/emotion.type";
import { Movie } from "../model/movie.model";

export class MovieMapper {
  static fromTMDBDbo(dbo: MovieTMDBDbo, emotion: Emotion, summary?: string): Movie {
    return {
      id: dbo.id,
      title: dbo.title,
      overview: summary??dbo.overview,
      emotion,
      posterPath: dbo.poster_path
    }
  }
}