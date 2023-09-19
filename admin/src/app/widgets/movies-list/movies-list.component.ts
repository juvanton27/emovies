import { Component, Inject, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Movie } from '../../model/movie.model';
import { SearchResult } from '../../model/search-result.model';
import { MoviesService } from '../../services/movies.service';
import { MovieInfoComponent } from '../movie-info/movie-info.component';
import { LoggerService } from '../../services/logger.service';
import { Log } from '../../model/log.model';

@Component({
  selector: 'app-movies-list',
  templateUrl: './movies-list.component.html',
  styleUrls: ['./movies-list.component.scss']
})
export class MoviesListComponent implements OnInit {
  movies: Movie[] = [];
  
  constructor(
    @Inject('API_TMDB_IMAGE') private readonly tmdbImage: string,
    private readonly moviesService: MoviesService,
    public dialog: MatDialog,
    private readonly loggerService: LoggerService
  ) { }

  ngOnInit(): void {
    this.refreshMovies();
    this.loggerService.onCurrentLogs.subscribe((logs: Log) => logs.refresh ? this.refreshMovies() : '');
  }

  fullPosterPath(path: string): string {
    return this.tmdbImage+path;
  }

  openMovieInfo(id: number): void {
    this.dialog.open(MovieInfoComponent, {
      data: id,
      maxHeight: '80%'
    });
  }

  refreshMovies(): void {
    this.moviesService.getAll(50, 0, {uploaded: true}).subscribe((movies: SearchResult<Movie>) => this.movies = movies.result);
  }
}
