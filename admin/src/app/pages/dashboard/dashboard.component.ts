import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Observable, concatMap, debounceTime, of, startWith } from 'rxjs';
import { MoviesService } from '../../services/movies.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  movies = new FormGroup({
    title: new FormControl('')
  });
  movieSuggestions: Observable<any[]> | undefined;

  constructor(
    readonly moviesService: MoviesService,
    @Inject('API_TMDB_IMAGE') private readonly tmdbImage: string,
  ) { }

  ngOnInit(): void {
    this.movieSuggestions = this.movies.controls['title'].valueChanges.pipe(
      startWith(''),
      debounceTime(500),
      concatMap((title: string | null) => title !== null ? this.moviesService.getAllFromTMDB({title}): of([])),
    );
  }

  fullPosterPath(path: string): string {
    return this.tmdbImage+path;
  }

  generateVideo(id: number): void {
    this.movies.controls['title'].setValue('', {emitEvent: false});
    this.moviesService.generateVideo(id).subscribe();
  }
}
