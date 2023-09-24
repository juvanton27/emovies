import { Component, ElementRef, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MoviesService } from '../../services/movies.service';
import { Movie } from '../../model/movie.model';
import { LoggerService } from '../../services/logger.service';
import { Subscription, concatMap, interval, map, tap } from 'rxjs';

@Component({
  selector: 'app-video-info',
  templateUrl: './video-info.component.html',
  styleUrls: ['./video-info.component.scss']
})
export class VideoInfoComponent implements OnInit, OnDestroy {
  @ViewChild('terminal') terminal!: ElementRef;
  movie?: Movie;

  // Logs
  logContent: string[] = [];
  private logSubscription!: Subscription;

  // Results
  resultContent: string = '';
  error = false;

  constructor(
    @Inject('API_TMDB_IMAGE') private readonly tmdbImage: string,
    public dialogRef: MatDialogRef<VideoInfoComponent>,
    @Inject(MAT_DIALOG_DATA) public id: number,
    private readonly moviesService: MoviesService,
    private readonly loggerService: LoggerService
  ) { }

  ngOnDestroy(): void {
    if (this.logSubscription) this.logSubscription.unsubscribe();
  }

  ngOnInit(): void {
    this.moviesService.getById(this.id).subscribe((movie: Movie) => {
      this.movie = movie;
      this.resultContent = '/api-backend/movies/result/'+this.id;
    });
    this.loggerService.getById(this.id).pipe(
      map((data: string) => this.logContent = data.split('\n')),
    ).subscribe(() => this.terminal.nativeElement.scrollTop = this.terminal.nativeElement.scrollHeight);
    this.logSubscription = interval(5000).pipe(
      concatMap(() => this.loggerService.getById(this.id)),
      map((data: string) => this.logContent = data.split('\n'))
    ).subscribe(() => this.terminal.nativeElement.scrollTop = this.terminal.nativeElement.scrollHeight);
  }

  fullPosterPath(path: string): string {
    return this.tmdbImage+path;
  }

  handleError(e: any): void {
    console.log(e)
  }
}
