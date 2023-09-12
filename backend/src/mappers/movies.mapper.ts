import { MovieDbo } from "../dbo/movie.dbo";
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

  static fromDbo(dbo: MovieDbo): Movie {
    return {
      id: dbo.id,
      title: dbo.title,
      overview: dbo.overview,
      emotion: dbo.emotion,
      posterPath: dbo.poster_path
    }
  }

  static toDbo(movie: Movie): MovieDbo {
    return {
      id: movie.id,
      title: movie.title,
      overview: movie.overview,
      emotion: movie.emotion,
      poster_path: movie.posterPath
    };
  }
}