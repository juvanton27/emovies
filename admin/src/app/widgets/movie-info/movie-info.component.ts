import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MoviesService } from '../../services/movies.service';
import { Movie } from '../../model/movie.model';
import { LoggerService } from '../../services/logger.service';
import { Subscription, concatMap, interval, map, tap } from 'rxjs';

@Component({
  selector: 'app-movie-info',
  templateUrl: './movie-info.component.html',
  styleUrls: ['./movie-info.component.scss']
})
export class MovieInfoComponent implements OnInit, OnDestroy {
  movie?: Movie;
  logContent: string[] = [];
  private logSubscription!: Subscription;

  constructor(
    @Inject('API_TMDB_IMAGE') private readonly tmdbImage: string,
    public dialogRef: MatDialogRef<MovieInfoComponent>,
    @Inject(MAT_DIALOG_DATA) public id: number,
    private readonly moviesService: MoviesService,
    private readonly loggerService: LoggerService
  ) { }

  ngOnDestroy(): void {
    if (this.logSubscription) this.logSubscription.unsubscribe();
  }

  ngOnInit(): void {
    this.moviesService.getById(this.id).subscribe((movie: Movie) => this.movie = movie);
    this.loggerService.getById(this.id).subscribe((data: string) => this.logContent = data.split('\n'));
    this.logSubscription = interval(5000).pipe(
      concatMap(() => this.loggerService.getById(this.id))
    ).subscribe((data: string) => this.logContent = data.split('\n'));
  }

  fullPosterPath(path: string): string {
    return this.tmdbImage+path;
  }
}
