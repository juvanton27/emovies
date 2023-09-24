import { Component, EventEmitter, Inject, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Movie } from '../../model/movie.model';
import { SearchResult } from '../../model/search-result.model';
import { MoviesService } from '../../services/movies.service';
import { VideoInfoComponent } from '../video-info/video-info.component';
import { LoggerService } from '../../services/logger.service';
import { Log } from '../../model/log.model';
import { Emotion } from '../../model/emotion.type';
import { SettingsService } from '../../services/settings.service';

@Component({
  selector: 'app-videos-list',
  templateUrl: './videos-list.component.html',
  styleUrls: ['./videos-list.component.scss']
})
export class VideosListComponent implements OnInit, OnChanges {
  @Input() title?: string;
  @Input() emotion?: Emotion | 'all';
  @Input() skip?: number;
  @Input() pageSize?: number;
  @Output() count!: EventEmitter<number>;

  movies: Movie[] = [];
  
  constructor(
    @Inject('API_TMDB_IMAGE') private readonly tmdbImage: string,
    private readonly moviesService: MoviesService,
    public dialog: MatDialog,
    private readonly loggerService: LoggerService,
    private readonly settingsService: SettingsService
  ) {
    this.count = new EventEmitter<number>();
  }

  ngOnChanges(): void {
    let filter: any = {
      title: this.title,
      emotion: this.emotion === 'all' ? undefined : this.emotion
    };
    this.refreshMovies(this.pageSize, this.skip, filter);
  }

  ngOnInit(): void {
    this.loggerService.onCurrentLogs.subscribe((logs: Log) => logs?.refresh ? this.refreshMovies() : '');
  }

  fullPosterPath(path: string): string {
    return this.tmdbImage+path;
  }

  openMovieInfo(id: number): void {
    this.dialog.open(VideoInfoComponent, {
      panelClass: this.settingsService.isDarkTheme() ? 'dark' : '',
      data: id,
      maxHeight: '800px',
      height: '80%',
      maxWidth: '1200px',
      width: '80%'
    });
  }

  refreshMovies(pageSize: number = 50, skip: number = 0, filter: any = {}): void {
    this.moviesService.getAll(pageSize, skip, filter).subscribe((movies: SearchResult<Movie>) => {
      this.movies = movies.result;
      this.count.emit(movies.totalCount);
    });
  }
}
