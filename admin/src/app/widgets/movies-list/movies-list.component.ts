import { Component, Inject, OnInit } from '@angular/core';
import { MoviesService } from '../../services/movies.service';
import { Movie } from '../../model/movie.model';
import { SearchResult } from '../../model/search-result.model';

@Component({
  selector: 'app-movies-list',
  templateUrl: './movies-list.component.html',
  styleUrls: ['./movies-list.component.scss']
})
export class MoviesListComponent implements OnInit {
  movies: Movie[] = [];
  
  constructor(
    @Inject('API_TMDB_IMAGE') private readonly tmdbImage: string,
    private readonly moviesService: MoviesService
  ) { }

  ngOnInit(): void {
    this.moviesService.getAll(50, 0, {uploaded: true}).subscribe((movies: SearchResult<Movie>) => {
      this.movies = movies.result;
      this.movies = [this.movies[0],this.movies[0],this.movies[0],this.movies[0]]
    });
  }

  fullPosterPath(path: string): string {
    return this.tmdbImage+path;
  }
}
