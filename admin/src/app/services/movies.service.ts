import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Movie } from '../model/movie.model';
import { HttpClient } from '@angular/common/http';
import { SearchResult } from '../model/search-result.model';

@Injectable({
  providedIn: 'root'
})
export class MoviesService {

  constructor(
    @Inject('API_BACKEND') private readonly endpoint: string,
    private readonly http: HttpClient,
  ) { }

  getAll(pageSize: number, skip: number, filter?: any): Observable<SearchResult<Movie>> {
    const url = `${this.endpoint}/movies`;
    return this.http.get<SearchResult<Movie>>(url);
  }
}
