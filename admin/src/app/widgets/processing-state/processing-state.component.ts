import { Component, Inject, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Log } from '../../model/log.model';

@Component({
  selector: 'app-processing-state',
  templateUrl: './processing-state.component.html',
  styleUrls: ['./processing-state.component.scss']
})
export class ProcessingStateComponent {
  @Input() logs?: Log;

  constructor(
    @Inject('API_TMDB_IMAGE') private readonly tmdbImage: string,
  ) { }

  fullPosterPath(path: string): string {
    return path && path.trim() !== '' ? this.tmdbImage+path: '';
  }
}
